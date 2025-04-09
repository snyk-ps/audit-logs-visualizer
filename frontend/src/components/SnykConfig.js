import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';

const SnykConfig = ({ onConfigChange }) => {
  // Default values for testing
  const defaultConfig = {
    apiKey: 'e47dd26f-275e-4f27-b459-2f29ae8e7b00',
    orgId: '7568202e-ab7e-4a3e-8ca0-493b39157336',
    groupId: '0fe5f483-330b-4dc7-8770-a48422312f75',
    startDate: format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"),
    endDate: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  };

  const [config, setConfig] = useState(defaultConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load saved config from localStorage if available
    const savedConfig = localStorage.getItem('snykConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(prevConfig => ({
          ...defaultConfig,
          ...parsedConfig,
          // Ensure dates are in the correct format
          startDate: parsedConfig.startDate || defaultConfig.startDate,
          endDate: parsedConfig.endDate || defaultConfig.endDate
        }));
      } catch (e) {
        console.error('Error parsing saved config:', e);
      }
    } else {
      // Use default config if nothing is saved
      setConfig(defaultConfig);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Save config to localStorage
      localStorage.setItem('snykConfig', JSON.stringify(config));
      
      // Format dates for API
      const formattedConfig = {
        ...config,
        startDate: format(new Date(config.startDate), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        endDate: format(new Date(config.endDate), "yyyy-MM-dd'T'HH:mm:ss'Z'")
      };

      // Call the parent component's handler
      await onConfigChange(formattedConfig);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="config-container">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="apiKey">API Key:</label>
          <input
            type="text"
            id="apiKey"
            name="apiKey"
            value={config.apiKey}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="orgId">Organization ID:</label>
          <input
            type="text"
            id="orgId"
            name="orgId"
            value={config.orgId}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="groupId">Group ID (optional):</label>
          <input
            type="text"
            id="groupId"
            name="groupId"
            value={config.groupId}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="startDate">Start Date:</label>
          <input
            type="datetime-local"
            id="startDate"
            name="startDate"
            value={config.startDate}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="endDate">End Date:</label>
          <input
            type="datetime-local"
            id="endDate"
            name="endDate"
            value={config.endDate}
            onChange={handleInputChange}
            required
          />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Fetch Audit Logs'}
        </button>

        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  );
};

export default SnykConfig; 