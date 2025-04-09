import React, { useState } from 'react';
import Papa from 'papaparse';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const CSVEventVisualizer = () => {
  const [eventData, setEventData] = useState([]);
  const [actionPieData, setActionPieData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileLoaded, setFileLoaded] = useState(false);

  // Process file upload
  const handleFileUpload = (event) => {
    try {
      const file = event.target.files[0];
      if (!file) {
        console.log('No file selected');
        return;
      }

      console.log('File selected:', file.name, 'type:', file.type, 'size:', file.size);
      
      // Reset states
      setLoading(true);
      setError(null);
      setFileLoaded(false);
      setEventData([]);
      setActionPieData([]);
      setHourlyData([]);
      setDailyData([]);
      
      // File size check
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File is too large. Please upload a file smaller than 10MB.');
        setLoading(false);
        return;
      }
      
      // Check if it's a CSV file
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        console.log('Processing as CSV file');
        processCSVFile(file);
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.log')) {
        console.log('Processing as text file');
        processTextFile(file);
      } else {
        console.log('Unknown file type:', file.type);
        setError(`Unsupported file type: ${file.type}. Please upload a CSV, TXT, or LOG file.`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in file upload handler:', error);
      setError(`Error handling file upload: ${error.message}`);
      setLoading(false);
    }
  };

  // Process CSV file
  const processCSVFile = (file) => {
    console.log('Processing CSV file:', file.name);
    try {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log('CSV parsing complete, rows:', results.data.length);
          if (results.data && results.data.length > 0) {
            console.log('First row sample:', results.data[0]);
            processData(results.data);
            setLoading(false);
            setFileLoaded(true);
          } else {
            console.error('No data parsed from CSV');
            setError('No data found in the CSV file. Please check the file format.');
            setLoading(false);
          }
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          setError(`Error parsing CSV: ${error}`);
          setLoading(false);
        }
      });
    } catch (e) {
      console.error('Exception in CSV processing:', e);
      setError(`Error processing file: ${e.message}`);
      setLoading(false);
    }
  };

  // Process space-delimited text file
  const processTextFile = (file) => {
    console.log('Processing text file:', file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        console.log('Text file loaded, length:', text.length);
        
        const lines = text.split('\n').filter(line => line.trim());
        console.log('Number of non-empty lines:', lines.length);
        
        if (lines.length === 0) {
          setError('No data found in the file. Please check the file content.');
          setLoading(false);
          return;
        }
        
        // Log a sample line for debugging
        if (lines.length > 0) {
          console.log('Sample line:', lines[0]);
        }
        
        const parsedData = lines.map((line, index) => {
          try {
            const parts = line.trim().split(/\s+/);
            
            // Check if the first item is a number (row ID)
            let offset = 0;
            let rowId = null;
            if (/^\d+$/.test(parts[0])) {
              rowId = parseInt(parts[0]);
              offset = 1;
            }
            
            // Ensure we have enough parts
            if (parts.length < offset + 6) {
              console.warn(`Line ${index + 1} has insufficient data (${parts.length} parts, need ${offset + 6}):`, line);
              return null; // Skip incomplete lines
            }
            
            // Extract timestamp and convert to date parts
            const timestamp = parts[offset + 5];
            let date = "";
            let hour = 0;
            
            try {
              const dateObj = new Date(timestamp);
              if (isNaN(dateObj.getTime())) {
                console.warn(`Invalid timestamp at line ${index + 1}:`, timestamp);
              } else {
                date = dateObj.toISOString().split('T')[0];
                hour = dateObj.getHours();
              }
            } catch (e) {
              console.error(`Error parsing timestamp at line ${index + 1}:`, timestamp, e);
            }
            
            return {
              rowId,
              userId: parts[offset] || '',
              sessionId: parts[offset + 1] || '',
              resourceId: parts[offset + 2] || '',
              status: parts[offset + 3] || '',
              actionType: parts[offset + 4] || 'unknown',
              timestamp: timestamp || '',
              date,
              hour
            };
          } catch (lineError) {
            console.error(`Error processing line ${index + 1}:`, lineError, line);
            return null;
          }
        }).filter(item => item !== null);
        
        console.log('Successfully parsed data rows:', parsedData.length);
        
        if (parsedData.length === 0) {
          setError('Could not parse any valid data from the file. Please check the format.');
          setLoading(false);
          return;
        }
        
        processData(parsedData);
        setLoading(false);
        setFileLoaded(true);
      } catch (error) {
        console.error('Error processing text file content:', error);
        setError(`Error processing file: ${error.message}`);
        setLoading(false);
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      setError("Error reading file");
      setLoading(false);
    };
    
    try {
      reader.readAsText(file);
    } catch (error) {
      console.error('Error in readAsText:', error);
      setError(`Error reading file: ${error.message}`);
      setLoading(false);
    }
  };

  // Process the parsed data and update state
  const processData = (parsedData) => {
    try {
      console.log('Processing data, rows:', parsedData.length);
      console.log('Sample data item:', parsedData[0]);
      
      // Map the fields from the audit_logs.csv format to our expected format
      const processedData = parsedData.map(item => {
        // Check if using audit_logs.csv format (has Group ID, Org ID, etc.)
        const isAuditLogsFormat = item['Group ID'] !== undefined;
        
        if (isAuditLogsFormat) {
          return {
            userId: item['User ID'] || 'N/A',
            sessionId: 'N/A', // Not present in audit_logs.csv
            resourceId: item['Project ID'] || item['Org ID'] || item['Group ID'] || 'N/A',
            status: 'N/A', // Not present in audit_logs.csv
            actionType: item['Event'] || 'unknown',
            timestamp: item['Time'] || '',
            date: item['Time'] ? new Date(item['Time']).toISOString().split('T')[0] : '',
            hour: item['Time'] ? new Date(item['Time']).getHours() : 0,
            // Additional fields from audit_logs.csv
            groupId: item['Group ID'] || 'N/A',
            orgId: item['Org ID'] || 'N/A',
            projectId: item['Project ID'] || 'N/A',
          };
        } else {
          // Check for JSON format from API
          let projectId = 'N/A';
          
          // Try to extract project_id from content if it exists
          if (item.content && typeof item.content === 'object') {
            projectId = item.content.project_id || item.content.projectId || 'N/A';
          }
          
          // Also check if project_id exists directly in the item
          if (item.project_id) {
            projectId = item.project_id;
          }
          
          // Simplify user_id extraction - just get it or set to N/A
          const userId = item.user_id || item.userId || 'N/A';
          
          return {
            ...item,
            actionType: item.actionType || item.event || 'unknown',
            timestamp: item.timestamp || item.created || '',
            date: item.date || 
                  (item.timestamp ? new Date(item.timestamp).toISOString().split('T')[0] : '') ||
                  (item.created ? new Date(item.created).toISOString().split('T')[0] : ''),
            hour: typeof item.hour === 'number' ? item.hour : 
                  (item.timestamp ? new Date(item.timestamp).getHours() : 0) ||
                  (item.created ? new Date(item.created).getHours() : 0),
            userId: userId,
            orgId: item.orgId || item.org_id || 'N/A',
            groupId: item.groupId || item.group_id || 'N/A',
            projectId: projectId,
          };
        }
      });
      
      // Store the processed event data
      setEventData(processedData);
      
      // Process data for pie chart by action type
      const actionCounts = {};
      processedData.forEach(item => {
        // Make sure actionType exists and isn't null/undefined
        const actionType = item.actionType || 'unknown';
        if (!actionCounts[actionType]) {
          actionCounts[actionType] = 0;
        }
        actionCounts[actionType]++;
      });
      
      console.log('Action types found:', Object.keys(actionCounts));
      
      const pieData = Object.entries(actionCounts).map(([name, value]) => ({
        name: (name || 'unknown').replace('org.project.', ''),
        value,
        fullName: name || 'unknown'
      }));
      setActionPieData(pieData);
      
      // Process data for hourly distribution
      const hourCounts = {};
      for (let i = 0; i < 24; i++) {
        hourCounts[i] = 0;
      }
      
      processedData.forEach(item => {
        try {
          let hour = 0;
          if (typeof item.hour === 'number' && !isNaN(item.hour) && item.hour >= 0 && item.hour < 24) {
            hour = item.hour;
          } else if (item.timestamp) {
            const date = new Date(item.timestamp);
            if (!isNaN(date.getTime())) {
              hour = date.getHours();
            }
          }
          
          if (hourCounts[hour] !== undefined) {
            hourCounts[hour]++;
          }
        } catch (e) {
          console.warn('Error processing hour data:', e);
        }
      });
      
      const hourlyChartData = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .filter(item => item.count > 0);
      setHourlyData(hourlyChartData);
      
      console.log('Hourly data generated, points:', hourlyChartData.length);
      
      // Process data for daily activity
      const dateCounts = {};
      processedData.forEach(item => {
        try {
          let date = null;
          
          // Try to get date from the item.date first
          if (item.date && typeof item.date === 'string' && item.date.match(/^\d{4}-\d{2}-\d{2}/)) {
            date = item.date;
          } 
          // If no valid date, try to parse from timestamp
          else if (item.timestamp) {
            const dateObj = new Date(item.timestamp);
            if (!isNaN(dateObj.getTime())) {
              date = dateObj.toISOString().split('T')[0];
            }
          }
          
          if (!date) return;
          
          if (!dateCounts[date]) {
            dateCounts[date] = {};
          }
          
          const actionType = item.actionType || 'unknown';
          
          if (!dateCounts[date][actionType]) {
            dateCounts[date][actionType] = 0;
          }
          
          dateCounts[date][actionType]++;
        } catch (e) {
          console.warn('Error processing date data:', e);
        }
      });
      
      const dailyChartData = Object.entries(dateCounts).map(([date, actions]) => ({
        date,
        ...actions,
        total: Object.values(actions).reduce((sum, count) => sum + count, 0)
      }));
      
      console.log('Daily data generated, days:', dailyChartData.length);
      setDailyData(dailyChartData);
      
    } catch (error) {
      console.error('Error in processData:', error);
      setError(`Error processing data: ${error.message}`);
      setLoading(false);
    }
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Shortened display name for action types
  const getActionDisplayName = (name) => {
    if (!name) return 'unknown';
    return String(name).replace('org.project.', '').replace('.auto_open', '');
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen w-full max-w-full">
      <h1 className="text-2xl font-bold mb-6">Event Data Visualizer</h1>
      
      {/* File Upload Section */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload Event Data</h2>
        <div className="flex items-center space-x-4">
          <label className={`flex flex-col items-center px-4 py-6 bg-white rounded-lg shadow-lg tracking-wide uppercase border cursor-pointer
            ${error ? 'border-red-500 text-red-500 hover:bg-red-50' : 'border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white'}
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {loading ? (
              <svg className="w-8 h-8 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
              </svg>
            )}
            <span className="mt-2 text-base leading-normal">
              {loading ? 'Processing...' : 'Select a file'}
            </span>
            <input 
              type='file' 
              className="hidden" 
              onChange={handleFileUpload} 
              accept=".csv,.txt,.log" 
              disabled={loading}
            />
          </label>
          <div>
            <p className="text-sm text-gray-600">Upload a CSV file or space-delimited text file with event data.</p>
            <p className="text-xs text-gray-500 mt-1">Supported formats:</p>
            <ul className="text-xs text-gray-500 mt-1 list-disc ml-5">
              <li>audit_logs.csv format with columns: Count, Group ID, Org ID, Project ID, User ID, Event, Time</li>
              <li>Standard format with columns: user ID, session ID, resource ID, status, action type, timestamp</li>
              <li>Space-delimited text files (.txt, .log) with similar columns</li>
            </ul>
            {fileLoaded && <p className="mt-2 text-sm text-green-600">✓ {eventData.length} events loaded successfully!</p>}
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 border border-red-300 bg-red-50 text-red-600 rounded">
            <strong>Error:</strong> {error}
            <p className="text-sm mt-1">
              Please ensure your file contains the required columns in the correct format.
            </p>
          </div>
        )}
        
        {loading && !error && (
          <div className="mt-4 p-3 border border-blue-300 bg-blue-50 text-blue-600 rounded flex items-center">
            <svg className="w-5 h-5 mr-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing file... This may take a moment for large files.
          </div>
        )}
      </div>
      
      {fileLoaded && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Action Types Distribution */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Action Types Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={actionPieData && actionPieData.length > 0 ? actionPieData : [{ name: 'No Data', value: 1, fullName: 'No Data' }]}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name || 'Unknown'} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(actionPieData && actionPieData.length > 0 ? actionPieData : [{ name: 'No Data', value: 1, fullName: 'No Data' }])
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Time of Day Distribution */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Time of Day Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData && hourlyData.length > 0 ? hourlyData : [{ hour: 0, count: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Number of Events', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value} events`, 'Count']} />
                  {hourlyData && hourlyData.length > 0 ? (
                    <Bar dataKey="count" fill="#8884d8" />
                  ) : (
                    <Bar dataKey="count" fill="#cccccc" name="No Data" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Daily Activity Breakdown */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold mb-4">Daily Activity Breakdown</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {actionPieData && actionPieData.length > 0 ? (
                  actionPieData.map((action, index) => (
                    <Bar 
                      key={action.fullName || `action-${index}`} 
                      dataKey={action.fullName || `unknown-${index}`} 
                      name={getActionDisplayName(action.fullName || 'unknown')} 
                      stackId="a" 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))
                ) : (
                  <Bar dataKey="noData" name="No Data" fill="#cccccc" />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Event Timeline */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Recent Events Timeline ({eventData.length} events)</h2>
            <div className="overflow-x-auto w-full" style={{ maxWidth: '100vw' }}>
              <table className="w-full bg-white" style={{ minWidth: '1500px', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase" style={{ width: '15%' }}>Time</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase" style={{ width: '15%' }}>Action</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase" style={{ width: '15%' }}>Project ID</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase" style={{ width: '15%' }}>Org ID</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase" style={{ width: '15%' }}>Group ID</th>
                    <th className="py-2 px-4 border-b border-gray-200 bg-blue-100 text-left text-xs font-semibold text-blue-800 uppercase font-bold border-l-2 border-r-2 border-blue-400" style={{ width: '25%' }}>User ID</th>
                  </tr>
                </thead>
                <tbody>
                  {eventData && eventData.length > 0 ? (
                    eventData
                      .sort((a, b) => {
                        try {
                          // Handle invalid dates safely
                          const dateA = new Date(b.timestamp || 0);
                          const dateB = new Date(a.timestamp || 0);
                          
                          // If both dates are invalid, maintain original order
                          if (isNaN(dateA) && isNaN(dateB)) return 0;
                          
                          // If only one date is invalid, put it at the end
                          if (isNaN(dateA)) return -1;
                          if (isNaN(dateB)) return 1;
                          
                          return dateA - dateB;
                        } catch (e) {
                          console.warn('Error sorting timestamps:', e);
                          return 0;
                        }
                      })
                      .slice(0, 100) // Limit to first 100 for performance
                      .map((event, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">
                            {(() => {
                              try {
                                const date = new Date(event.timestamp || '');
                                return !isNaN(date) ? date.toLocaleString() : 'Invalid date';
                              } catch (e) {
                                return 'Invalid date';
                              }
                            })()}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">
                            {getActionDisplayName(event.actionType || 'unknown')}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm font-mono">
                            {event.projectId && event.projectId !== 'N/A' 
                              ? <span className="text-blue-600">{event.projectId}</span> 
                              : <span className="text-gray-400">N/A</span>}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm font-mono">
                            {event.orgId !== 'N/A' ? <span className="text-blue-600">{event.orgId}</span> : <span className="text-gray-400">N/A</span>}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm font-mono">
                            {event.groupId !== 'N/A' ? <span className="text-blue-600">{event.groupId}</span> : <span className="text-gray-400">N/A</span>}
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm font-mono bg-blue-50 border-l-2 border-r-2 border-blue-400">
                            {event.userId !== 'N/A' ? <span className="text-blue-600">{event.userId}</span> : <span className="text-gray-400">N/A</span>}
                          </td>
                        </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                        No event data to display
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CSVEventVisualizer;