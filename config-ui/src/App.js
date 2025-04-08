import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

function App() {
  const [config, setConfig] = useState({
    SNYK_API_KEY: '',
    SNYK_ORG_ID: '',
    SNYK_GROUP_ID: '',
    FROM_DATE: '',
    TO_DATE: '',
    OUTPUT_FORMAT: 'table'
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load existing config if available
    fetch('/api/config')
      .then(response => response.json())
      .then(data => setConfig(data))
      .catch(error => console.error('Error loading config:', error));
  }, []);

  const handleGenerateLogs = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/audit-logs');
      if (!response.ok) {
        throw new Error('Failed to generate audit logs');
      }
      const data = await response.json();
      console.log('Received audit logs:', data); // Debug log
      
      // Transform the data to match the table structure
      const transformedLogs = data.map(log => ({
        date: log.created || '',
        user: log.actor?.name || 'System',
        action: log.event || '',
        details: JSON.stringify(log.content || {}, null, 2),
        orgId: log.org_id || '',
        projectId: log.project_id || '',
        groupId: log.group_id || ''
      }));
      
      setAuditLogs(transformedLogs);
    } catch (err) {
      setErrorMessage(err.message);
      setShowError(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          FROM_DATE: config.FROM_DATE ? `${config.FROM_DATE}:00Z` : '',
          TO_DATE: config.TO_DATE ? `${config.TO_DATE}:00Z` : ''
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Automatically generate audit logs after saving
      await handleGenerateLogs();
    } catch (err) {
      setErrorMessage(err.message);
      setShowError(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Snyk Configuration</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="SNYK_API_KEY" className="block text-sm font-medium text-gray-700">
                      API Key
                    </label>
                    <input
                      type="password"
                      name="SNYK_API_KEY"
                      id="SNYK_API_KEY"
                      value={config.SNYK_API_KEY}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="SNYK_ORG_ID" className="block text-sm font-medium text-gray-700">
                      Organization ID
                    </label>
                    <input
                      type="text"
                      name="SNYK_ORG_ID"
                      id="SNYK_ORG_ID"
                      value={config.SNYK_ORG_ID}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="SNYK_GROUP_ID" className="block text-sm font-medium text-gray-700">
                      Group ID (optional)
                    </label>
                    <input
                      type="text"
                      name="SNYK_GROUP_ID"
                      id="SNYK_GROUP_ID"
                      value={config.SNYK_GROUP_ID}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="FROM_DATE" className="block text-sm font-medium text-gray-700">
                      From Date
                    </label>
                    <input
                      type="datetime-local"
                      name="FROM_DATE"
                      id="FROM_DATE"
                      value={config.FROM_DATE}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="TO_DATE" className="block text-sm font-medium text-gray-700">
                      To Date
                    </label>
                    <input
                      type="datetime-local"
                      name="TO_DATE"
                      id="TO_DATE"
                      value={config.TO_DATE}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="OUTPUT_FORMAT" className="block text-sm font-medium text-gray-700">
                      Output Format
                    </label>
                    <select
                      name="OUTPUT_FORMAT"
                      id="OUTPUT_FORMAT"
                      value={config.OUTPUT_FORMAT}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="table">Table</option>
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                      <option value="sqlite">SQLite</option>
                    </select>
                  </div>

                  <div className="pt-6">
                    <button
                      type="submit"
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>

                {auditLogs.length > 0 && (
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.action}</td>
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
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          <div className="relative bg-white rounded-lg max-w-sm mx-auto p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
              <Dialog.Title className="text-lg font-medium">Configuration Saved</Dialog.Title>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Error Dialog */}
      <Dialog
        open={showError}
        onClose={() => setShowError(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          <div className="relative bg-white rounded-lg max-w-sm mx-auto p-4">
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-2" />
              <Dialog.Title className="text-lg font-medium">Error</Dialog.Title>
            </div>
            <p className="mt-2 text-sm text-gray-500">{errorMessage}</p>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default App; 