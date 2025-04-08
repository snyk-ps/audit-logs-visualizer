const express = require('express');
const cors = require('cors');
const { loadConfig, saveConfig } = require('./config');
const { AuditLogClient } = require('./AuditLogClient');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// GET /api/config - Get current configuration
app.get('/api/config', (req, res) => {
  try {
    const config = loadConfig();
    res.json(config);
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ message: 'Failed to load configuration' });
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

// GET /api/audit-logs - Generate audit logs
app.get('/api/audit-logs', async (req, res) => {
  try {
    const config = loadConfig();
    if (!config.SNYK_API_KEY) {
      return res.status(400).json({ message: 'API Key is required' });
    }

    const client = new AuditLogClient('https://api.snyk.io', config.SNYK_API_KEY);
    const logs = await client.getAllAuditLogs({
      queryType: config.SNYK_GROUP_ID ? 'group' : 'org',
      queryId: config.SNYK_GROUP_ID || config.SNYK_ORG_ID,
      fromDate: config.FROM_DATE,
      toDate: config.TO_DATE
    });

    res.json(logs);
  } catch (error) {
    console.error('Error generating audit logs:', error);
    res.status(500).json({ message: 'Failed to generate audit logs' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 