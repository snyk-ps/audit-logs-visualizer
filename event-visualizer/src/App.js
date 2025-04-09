import React, { useState } from 'react';
import SnykConfig from './components/SnykConfig';
import AuditLogsVisualization from './components/AuditLogsVisualization';

function App() {
  const [showLogs, setShowLogs] = useState(false);
  const [config, setConfig] = useState(null);

  const handleConfigSave = (newConfig) => {
    setConfig(newConfig);
    setShowLogs(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-7xl md:max-w-full md:mx-6 lg:mx-12 sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-full mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <SnykConfig onConfigSave={handleConfigSave} />
                {showLogs && <AuditLogsVisualization config={config} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;