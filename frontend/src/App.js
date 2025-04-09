import React, { useState } from 'react';
import SnykConfig from './components/SnykConfig';
import EventVisualizer from './components/EventVisualizer';
import './App.css';

function App() {
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

  const handleConfigChange = async (config) => {
    try {
      // Save the date range
      setDateRange({
        startDate: config.startDate,
        endDate: config.endDate
      });

      const response = await fetch('http://localhost:3001/api/audit-logs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log('Audit logs:', data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>Audit Logs Visualizer</h1>
          <p className="subtitle">Monitor and analyze your Snyk audit logs</p>
        </div>
      </header>
      <main>
        <SnykConfig onConfigChange={handleConfigChange} />
        <EventVisualizer dateRange={dateRange} />
      </main>
    </div>
  );
}

export default App; 