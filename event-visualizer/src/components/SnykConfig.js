import React, { useState } from 'react';

function SnykConfig({ onConfigSave }) {
  const [config, setConfig] = useState({
    SNYK_API_KEY: 'e47dd26f-275e-4f27-b459-2f29ae8e7b00',
    SNYK_ORG_ID: '7568202e-ab7e-4a3e-8ca0-493b39157336',
    SNYK_GROUP_ID: '',
    FROM_DATE: '',
    TO_DATE: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate that either orgId or groupId is provided
    if (!config.SNYK_ORG_ID && !config.SNYK_GROUP_ID) {
      setError('Please provide either Organization ID or Group ID');
      return;
    }

    // Validate dates
    if (config.FROM_DATE && config.TO_DATE) {
      const start = new Date(config.FROM_DATE);
      const end = new Date(config.TO_DATE);
      if (start > end) {
        setError('Start date cannot be after end date');
        return;
      }
    }

    try {
      const requestBody = {
        ...config,
        FROM_DATE: config.FROM_DATE ? `${config.FROM_DATE}:00Z` : '',
        TO_DATE: config.TO_DATE ? `${config.TO_DATE}:00Z` : ''
      };

      console.log('Sending request with data:', requestBody);

      const response = await fetch('http://localhost:3001/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to save configuration');
      }

      setSuccess('Configuration saved successfully!');
      onConfigSave(config);
    } catch (err) {
      console.error('Error saving configuration:', err);
      setError(err.message || 'Failed to save configuration. Please check the console for details.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="SNYK_API_KEY" className="block text-sm font-medium text-gray-700">
            API Key
          </label>
          <input
            type="password"
            id="SNYK_API_KEY"
            name="SNYK_API_KEY"
            value={config.SNYK_API_KEY}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="SNYK_ORG_ID" className="block text-sm font-medium text-gray-700">
            Organization ID (optional if Group ID is provided)
          </label>
          <input
            type="text"
            id="SNYK_ORG_ID"
            name="SNYK_ORG_ID"
            value={config.SNYK_ORG_ID}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="SNYK_GROUP_ID" className="block text-sm font-medium text-gray-700">
            Group ID (optional if Organization ID is provided)
          </label>
          <input
            type="text"
            id="SNYK_GROUP_ID"
            name="SNYK_GROUP_ID"
            value={config.SNYK_GROUP_ID}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Example format: 0fe5f483-330b-4dc7-8770-a48422312f75.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="FROM_DATE" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="datetime-local"
              id="FROM_DATE"
              name="FROM_DATE"
              value={config.FROM_DATE}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 h-10"
              required
            />
          </div>

          <div>
            <label htmlFor="TO_DATE" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="datetime-local"
              id="TO_DATE"
              name="TO_DATE"
              value={config.TO_DATE}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 h-10"
              required
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">{success}</div>
          </div>
        )}

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}

export default SnykConfig; 