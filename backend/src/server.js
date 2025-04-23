const express = require('express');
const cors = require('cors');
const { loadConfig, saveConfig } = require('./config');
const { AuditLogClient } = require('./AuditLogClient');
const { UserClient } = require('./UserClient');
const { OrgClient } = require('./OrgClient');
const axios = require('axios');
const { format, subDays } = require('date-fns');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// GET /api/config - Get current configuration
app.get('/api/config', (req, res) => {
  try {
    const config = loadConfig();
    
    // Add a debug field to show where values are coming from
    if (process.env.NODE_ENV === 'development') {
      config.debug = {
        source: 'Environment variables have priority over stored config',
        envVars: {
          SNYK_API_KEY: process.env.SNYK_API_KEY ? 'Set via environment' : 'Not set in environment',
          SNYK_ORG_ID: process.env.SNYK_ORG_ID ? 'Set via environment' : 'Not set in environment',
          SNYK_GROUP_ID: process.env.SNYK_GROUP_ID ? 'Set via environment' : 'Not set in environment',
          FROM_DATE: process.env.FROM_DATE ? 'Set via environment' : 'Not set in environment',
          TO_DATE: process.env.TO_DATE ? 'Set via environment' : 'Not set in environment'
        }
      };
    }
    
    res.json(config);
  } catch (error) {
    console.error('Error getting config:', error);
    
    // Even if there's an error, try to return something useful
    try {
      const emergencyConfig = {
        SNYK_API_KEY: process.env.SNYK_API_KEY || '',
        SNYK_ORG_ID: process.env.SNYK_ORG_ID || '',
        SNYK_GROUP_ID: process.env.SNYK_GROUP_ID || '',
        FROM_DATE: process.env.FROM_DATE || '',
        TO_DATE: process.env.TO_DATE || '',
        ERROR: 'Failed to load full configuration, returning emergency values'
      };
      res.json(emergencyConfig);
    } catch (secondError) {
      res.status(500).json({ message: 'Failed to load configuration' });
    }
  }
});

// GET /api/config/debug - Show detailed configuration info for debugging
app.get('/api/config/debug', (req, res) => {
  try {
    const config = loadConfig();
    
    // Return detailed debug information including environment variables
    const debugInfo = {
      storedConfig: config,
      environmentVariables: {
        SNYK_API_KEY: process.env.SNYK_API_KEY ? 'Set (value hidden)' : 'Not set',
        SNYK_ORG_ID: process.env.SNYK_ORG_ID || 'Not set',
        SNYK_GROUP_ID: process.env.SNYK_GROUP_ID || 'Not set',
        FROM_DATE: process.env.FROM_DATE || 'Not set',
        TO_DATE: process.env.TO_DATE || 'Not set',
        OUTPUT_FORMAT: process.env.OUTPUT_FORMAT || 'Not set',
        NODE_ENV: process.env.NODE_ENV || 'Not set'
      },
      effectiveConfig: {
        SNYK_API_KEY: process.env.SNYK_API_KEY || config.SNYK_API_KEY ? 'Set (value hidden)' : 'Not set',
        SNYK_ORG_ID: process.env.SNYK_ORG_ID || config.SNYK_ORG_ID || 'Not set',
        SNYK_GROUP_ID: process.env.SNYK_GROUP_ID || config.SNYK_GROUP_ID || 'Not set',
        FROM_DATE: process.env.FROM_DATE || config.FROM_DATE || 'Not set',
        TO_DATE: process.env.TO_DATE || config.TO_DATE || 'Not set',
        OUTPUT_FORMAT: process.env.OUTPUT_FORMAT || config.OUTPUT_FORMAT || 'Not set'
      },
      serverInfo: {
        timestamp: new Date().toISOString(),
        processId: process.pid,
        uptime: process.uptime()
      }
    };
    
    res.json(debugInfo);
  } catch (error) {
    console.error('Error getting debug config:', error);
    res.status(500).json({ message: 'Failed to load debug configuration' });
  }
});

// POST /api/config - Save configuration
app.post('/api/config', (req, res) => {
  try {
    const config = req.body;
    console.log('Received config:', config);
    
    // Validate required fields
    if (!config.SNYK_API_KEY) {
      return res.status(400).json({ message: 'API Key is required' });
    }
    
    const success = saveConfig(config);
    
    if (success) {
      res.json({ message: 'Configuration saved successfully' });
    } else {
      res.status(500).json({ message: 'Failed to save configuration' });
    }
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/audit-logs - Generate audit logs with query params
app.get('/api/audit-logs', async (req, res) => {
  try {
    const config = loadConfig();
    if (!config.SNYK_API_KEY) {
      return res.status(400).json({ message: 'API Key is required' });
    }

    // Get query parameters with fallback to config values
    const queryParams = req.query;
    const groupId = queryParams.groupId || config.SNYK_GROUP_ID;
    const orgId = queryParams.orgId || config.SNYK_ORG_ID;
    const fromDate = queryParams.fromDate || config.FROM_DATE;
    const toDate = queryParams.toDate || config.TO_DATE;

    // Determine query type based on provided parameters
    let queryType, queryId;
    
    if (queryParams.groupId) {
      // If groupId is explicitly provided in the query, prioritize it
      queryType = 'group';
      queryId = queryParams.groupId;
      console.log(`Using group_id from query: ${queryId}`);
    } else if (queryParams.orgId) {
      // If orgId is explicitly provided in the query, use it
      queryType = 'org';
      queryId = queryParams.orgId;
      console.log(`Using org_id from query: ${queryId}`);
    } else if (groupId) {
      // Fall back to config values, prioritizing group_id if both exist
      queryType = 'group';
      queryId = groupId;
      console.log(`Using group_id from config: ${queryId}`);
    } else if (orgId) {
      queryType = 'org';
      queryId = orgId;
      console.log(`Using org_id from config: ${queryId}`);
    } else {
      return res.status(400).json({ message: 'Either orgId or groupId is required' });
    }

    console.log(`Query type resolved to: ${queryType}, ID: ${queryId}`);

    const client = new AuditLogClient('https://api.snyk.io', config.SNYK_API_KEY);
    const logs = await client.getAllAuditLogs({
      queryType,
      queryId,
      fromDate,
      toDate
    });

    res.json(logs);
  } catch (error) {
    console.error('Error generating audit logs:', error);
    res.status(500).json({ message: 'Failed to generate audit logs', error: error.message });
  }
});

// GET /api/audit-logs/org/:orgId - Get audit logs specifically by org ID
app.get('/api/audit-logs/org/:orgId', async (req, res) => {
  try {
    const config = loadConfig();
    if (!config.SNYK_API_KEY) {
      return res.status(400).json({ message: 'API Key is required' });
    }

    const { orgId } = req.params;
    if (!orgId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const fromDate = req.query.fromDate || config.FROM_DATE;
    const toDate = req.query.toDate || config.TO_DATE;

    const client = new AuditLogClient('https://api.snyk.io', config.SNYK_API_KEY);
    const logs = await client.getAllAuditLogs({
      queryType: 'org',
      queryId: orgId,
      fromDate,
      toDate
    });

    res.json(logs);
  } catch (error) {
    console.error('Error generating org audit logs:', error);
    res.status(500).json({ message: 'Failed to generate audit logs for organization', error: error.message });
  }
});

// GET /api/audit-logs/group/:groupId - Get audit logs specifically by group ID
app.get('/api/audit-logs/group/:groupId', async (req, res) => {
  try {
    const config = loadConfig();
    if (!config.SNYK_API_KEY) {
      return res.status(400).json({ message: 'API Key is required' });
    }

    const { groupId } = req.params;
    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }

    console.log(`Fetching audit logs for group ID: ${groupId}`);
    const fromDate = req.query.fromDate || config.FROM_DATE;
    const toDate = req.query.toDate || config.TO_DATE;

    // Log dates for debugging
    console.log(`Using date range: from=${fromDate}, to=${toDate}`);

    const client = new AuditLogClient('https://api.snyk.io', config.SNYK_API_KEY);
    try {
      const logs = await client.getAllAuditLogs({
        queryType: 'group',
        queryId: groupId,
        fromDate,
        toDate
      });
      
      console.log(`Successfully retrieved ${logs.length} logs for group ID ${groupId}`);
      res.json(logs);
    } catch (apiError) {
      console.error('API error when fetching group logs:', apiError.message);
      
      // If the error was from the API, provide more details
      if (apiError.response) {
        const status = apiError.response.status;
        const message = apiError.response.data?.message || apiError.response.data?.errors?.[0]?.detail || 'Unknown error';
        
        // Create debugging info object to help troubleshoot
        const debugInfo = {
          requestedPath: `/rest/groups/${groupId}/audit_logs/search`,
          apiVersion: '2024-10-15',
          dateRange: { fromDate, toDate },
          statusCode: status,
          responseMessage: message
        };
        
        if (status === 404) {
          return res.status(404).json({ 
            message: 'Group not found or you do not have access to this group',
            details: 'Please verify the Group ID is correct and that your API key has access to this group',
            debug: process.env.NODE_ENV === 'development' ? debugInfo : undefined
          });
        }
        
        if (status === 401 || status === 403) {
          return res.status(status).json({ 
            message: 'Authentication or authorization error', 
            details: 'Your API key may not have permissions to access group audit logs',
            debug: process.env.NODE_ENV === 'development' ? debugInfo : undefined
          });
        }
        
        return res.status(status).json({ 
          message: `API error: ${message}`,
          details: 'See server logs for more information',
          debug: process.env.NODE_ENV === 'development' ? debugInfo : undefined
        });
      }
      
      throw apiError; // Re-throw if it's not an API error for the general handler below
    }
  } catch (error) {
    console.error('Error generating group audit logs:', error);
    res.status(500).json({ 
      message: 'Failed to generate audit logs for group', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/user/:orgId/:userId - Get user details
app.get('/api/user/:orgId/:userId', async (req, res) => {
  try {
    const config = loadConfig();
    if (!config.SNYK_API_KEY) {
      return res.status(400).json({ message: 'API Key is required' });
    }

    const { orgId, userId } = req.params;
    
    if (!orgId || !userId) {
      return res.status(400).json({ message: 'Organization ID and User ID are required' });
    }

    const userClient = new UserClient('https://api.snyk.io', config.SNYK_API_KEY);
    const userData = await userClient.getUserDetails(orgId, userId);
    
    if (userData.error) {
      return res.status(userData.status).json({ message: userData.message });
    }

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
});

// GET /api/orgs - Get all organizations
app.get('/api/orgs', async (req, res) => {
  try {
    const config = loadConfig();
    if (!config.SNYK_API_KEY) {
      return res.status(400).json({ message: 'API Key is required' });
    }

    const orgClient = new OrgClient('https://api.snyk.io', config.SNYK_API_KEY);
    const orgsData = await orgClient.getOrgs();
    
    if (orgsData.error) {
      return res.status(orgsData.status).json({ message: orgsData.message });
    }

    res.json(orgsData);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ message: 'Failed to fetch organizations' });
  }
});

// GET /api/org/:orgId - Get organization details by ID
app.get('/api/org/:orgId', async (req, res) => {
  try {
    const config = loadConfig();
    if (!config.SNYK_API_KEY) {
      return res.status(400).json({ message: 'API Key is required' });
    }

    const { orgId } = req.params;
    
    if (!orgId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const orgClient = new OrgClient('https://api.snyk.io', config.SNYK_API_KEY);
    const orgData = await orgClient.getOrgDetails(orgId);
    
    if (orgData.error) {
      return res.status(orgData.status).json({ message: orgData.message });
    }

    res.json(orgData);
  } catch (error) {
    console.error('Error fetching organization details:', error);
    res.status(500).json({ message: 'Failed to fetch organization details' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

// Export the app to be used in index.js
console.log('Exporting Express app from server.js');
module.exports = app; 