import React, { useState, useEffect } from 'react';

function AuditLogsTable() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState('');

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/audit-logs');
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      const data = await response.json();
      console.log('Received audit logs:', data);
      
      // Transform the data to match the table structure
      const transformedLogs = data.map(log => ({
        date: log.created || '',
        event: log.event || '',
        details: JSON.stringify(log.content || {}, null, 2),
        projectId: log.project_id || '',
        orgId: log.org_id || '',
        groupId: log.group_id || ''
      }));
      
      setAuditLogs(transformedLogs);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (auditLogs.length === 0) {
    return <div className="text-gray-500">No audit logs available</div>;
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Audit Logs</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project ID</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {auditLogs.map((log, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.event}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <pre className="whitespace-pre-wrap">{log.details}</pre>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.projectId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuditLogsTable; 