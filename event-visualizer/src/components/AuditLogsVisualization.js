import React, { useState, useEffect } from 'react';
import EnhancedVisualizations from './EnhancedVisualizations';

function AuditLogsVisualization({ config }) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [orgDetails, setOrgDetails] = useState({});
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/audit-logs');
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      const data = await response.json();
      setAuditLogs(data);
      setError('');
      
      // After setting audit logs, fetch user details and org details
      fetchUserDetails(data);
      fetchOrgDetails(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserDetails = async (logs) => {
    if (!logs || !logs.length) return;
    
    setLoadingUsers(true);
    
    // Get unique user IDs to avoid duplicate requests
    const uniqueUserIds = [...new Set(logs.map(log => log.user_id).filter(id => id))];
    const orgId = logs[0]?.org_id || config.SNYK_ORG_ID;
    
    if (!orgId) {
      console.error('No organization ID found');
      setLoadingUsers(false);
      return;
    }
    
    const userDetailsMap = { ...userDetails };
    
    try {
      // Fetch user details for each unique user ID
      const promises = uniqueUserIds.map(async (userId) => {
        try {
          const response = await fetch(`http://localhost:3001/api/user/${orgId}/${userId}`);
          if (!response.ok) {
            console.warn(`Failed to fetch details for user ${userId}`);
            return null;
          }
          const userData = await response.json();
          return { userId, userData };
        } catch (err) {
          console.error(`Error fetching user ${userId}:`, err);
          return null;
        }
      });
      
      // Wait for all promises to resolve
      const results = await Promise.all(promises);
      
      // Update the user details map
      results.forEach(result => {
        if (result) {
          userDetailsMap[result.userId] = result.userData;
        }
      });
      
      setUserDetails(userDetailsMap);
    } catch (err) {
      console.error('Error fetching user details:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchOrgDetails = async (logs) => {
    if (!logs || !logs.length) return;
    
    setLoadingOrgs(true);
    
    // Get unique org IDs to avoid duplicate requests
    const uniqueOrgIds = [...new Set(logs.map(log => log.org_id).filter(id => id))];
    
    if (uniqueOrgIds.length === 0) {
      console.error('No organization IDs found in logs');
      setLoadingOrgs(false);
      return;
    }
    
    const orgDetailsMap = { ...orgDetails };
    
    try {
      // Fetch details for each unique org ID
      const promises = uniqueOrgIds.map(async (orgId) => {
        try {
          const response = await fetch(`http://localhost:3001/api/org/${orgId}`);
          if (!response.ok) {
            console.warn(`Failed to fetch details for org ${orgId}`);
            return null;
          }
          const orgData = await response.json();
          return { orgId, orgData };
        } catch (err) {
          console.error(`Error fetching org ${orgId}:`, err);
          return null;
        }
      });
      
      // Wait for all promises to resolve
      const results = await Promise.all(promises);
      
      // Update the org details map
      results.forEach(result => {
        if (result) {
          orgDetailsMap[result.orgId] = result.orgData;
        }
      });
      
      setOrgDetails(orgDetailsMap);
    } catch (err) {
      console.error('Error fetching org details:', err);
    } finally {
      setLoadingOrgs(false);
    }
  };

  useEffect(() => {
    if (config) {
      fetchAuditLogs();
    }
  }, [config]);

  // Function to extract user name and email from user details
  const getUserInfo = (userId) => {
    if (!userId) return { name: 'N/A', email: 'N/A' };
    
    const user = userDetails[userId];
    if (!user || !user.data || !user.data.attributes) {
      return { name: 'N/A', email: 'N/A' };
    }
    
    return {
      name: user.data.attributes.name || 'N/A',
      email: user.data.attributes.email || 'N/A'
    };
  };

  // Function to get organization slug and construct project URL
  const getProjectUrl = (orgId, projectId) => {
    if (!orgId || !projectId) return null;
    
    const org = orgDetails[orgId];
    if (!org || !org.attributes || !org.attributes.slug) {
      return null;
    }
    
    const slug = org.attributes.slug;
    return `https://app.snyk.io/org/${slug}/project/${projectId}/`;
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (isLoading) {
    return <div className="text-gray-500">Loading audit logs...</div>;
  }

  if (auditLogs.length === 0) {
    return <div className="text-gray-500">No audit logs available</div>;
  }

  return (
    <div className="space-y-8 w-full max-w-full">
      {/* Enhanced Visualizations */}
      <EnhancedVisualizations data={auditLogs} />

      {/* Table Section */}
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-full">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Audit Logs Details</h3>
        {(loadingUsers || loadingOrgs) && (
          <div className="text-sm text-blue-500 mb-2">
            {loadingUsers && "Loading user details..."}
            {loadingUsers && loadingOrgs && " | "}
            {loadingOrgs && "Loading organization details..."}
          </div>
        )}
        <div className="overflow-x-auto w-full" style={{ maxWidth: '100vw' }}>
          <table className="w-full divide-y divide-gray-200 table-fixed" style={{ width: '100%', minWidth: '1200px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '12%' }}>Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '18%' }}>Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '15%' }}>Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider bg-purple-100 font-bold" style={{ width: '20%' }}>User Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '35%' }}>Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log, index) => {
                const userInfo = getUserInfo(log.user_id);
                const projectUrl = getProjectUrl(log.org_id, log.project_id);
                
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.created ? (
                        <div>
                          <div>{log.created.split('T')[0]}</div>
                          <div className="text-xs text-gray-400">T{log.created.split('T')[1]}</div>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-normal">{log.event}</td>
                    <td className="px-6 py-4 text-sm font-mono text-blue-600 break-all">
                      {log.project_id ? (
                        projectUrl ? (
                          <a 
                            href={projectUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-800 transition-colors"
                          >
                            {log.project_id}
                          </a>
                        ) : (
                          <div className="truncate hover:text-clip">
                            {log.project_id}
                          </div>
                        )
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono bg-purple-50 font-medium text-purple-700 break-all">
                      {log.user_id ? (
                        <div>
                          <div className="font-bold">{log.user_id}</div>
                          <div className="text-sm text-gray-700 mt-1 font-normal">{userInfo.name}</div>
                          <div className="text-xs text-gray-500 mt-1 font-normal">{userInfo.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <pre className="whitespace-pre-wrap max-h-40 overflow-y-auto text-xs">{JSON.stringify(log.content, null, 2)}</pre>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AuditLogsVisualization; 