import React, { useState, useEffect } from 'react';
import EnhancedVisualizations from './EnhancedVisualizations';

function AuditLogsVisualization({ config }) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (config) {
      fetchAuditLogs();
    }
  }, [config]);

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
        <div className="overflow-x-auto w-full" style={{ maxWidth: '100vw' }}>
          <table className="w-full divide-y divide-gray-200 table-fixed" style={{ width: '100%', minWidth: '1200px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '12%' }}>Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '12%' }}>Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '36%' }}>Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '20%' }}>Project ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-800 uppercase tracking-wider bg-purple-100 font-bold" style={{ width: '20%' }}>User ID</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.created}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.event}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <pre className="whitespace-pre-wrap max-h-40 overflow-y-auto text-xs">{JSON.stringify(log.content, null, 2)}</pre>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-blue-600 break-all">
                    <div className="truncate hover:text-clip" title={log.project_id || 'N/A'}>
                      {log.project_id || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono bg-purple-50 font-medium text-purple-700 break-all">
                    <div className="truncate hover:text-clip" title={log.user_id || 'N/A'}>
                      {log.user_id || 'N/A'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AuditLogsVisualization; 