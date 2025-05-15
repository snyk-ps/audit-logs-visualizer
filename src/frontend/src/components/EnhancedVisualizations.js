import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
  AreaChart, Area
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function EnhancedVisualizations({ data }) {
  // Transform data for different visualizations
  const eventsByType = data.reduce((acc, log) => {
    const eventType = log.event;
    if (!acc[eventType]) {
      acc[eventType] = 0;
    }
    acc[eventType]++;
    return acc;
  }, {});

  const eventsByDate = data.reduce((acc, log) => {
    const date = log.created.split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        date,
        total: 0,
        'org.project.files.access': 0,
        'org.project.files.create': 0,
        'org.project.files.update': 0,
        'org.project.test': 0,
        other: 0
      };
    }
    acc[date].total++;
    
    if (acc[date][log.event] !== undefined) {
      acc[date][log.event]++;
    } else {
      acc[date].other++;
    }
    return acc;
  }, {});

  const pieData = Object.entries(eventsByType).map(([name, value]) => ({
    name,
    value
  }));

  // Sort dates in ascending order (oldest to newest)
  const lineData = Object.values(eventsByDate).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  // Calculate issue severity distribution
  const issueSeverity = data.reduce((acc, log) => {
    if (log.event.includes('issue') && log.content.issueCounts) {
      const counts = log.content.issueCounts.sast || {};
      acc.high += counts.high || 0;
      acc.medium += counts.medium || 0;
      acc.low += counts.low || 0;
    }
    return acc;
  }, { high: 0, medium: 0, low: 0 });

  const severityData = [
    { name: 'High', value: issueSeverity.high },
    { name: 'Medium', value: issueSeverity.medium },
    { name: 'Low', value: issueSeverity.low }
  ];

  return (
    <div className="grid grid-cols-1 gap-8">
      {/* Event Type Distribution - Full Width */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Event Type Distribution</h3>
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={200}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Over Time - Full Width */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Over Time</h3>
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ angle: -45, textAnchor: 'end' }}
                height={100}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="org.project.files.access" stackId="1" stroke="#8884d8" fill="#8884d8" name="Files Access" />
              <Area type="monotone" dataKey="org.project.files.create" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Files Create" />
              <Area type="monotone" dataKey="org.project.files.update" stackId="1" stroke="#ffc658" fill="#ffc658" name="Files Update" />
              <Area type="monotone" dataKey="org.project.test" stackId="1" stroke="#ff8042" fill="#ff8042" name="Tests" />
              <Area type="monotone" dataKey="other" stackId="1" stroke="#0088FE" fill="#0088FE" name="Other Events" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* File Operations - Full Width */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">File Operations</h3>
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ angle: -45, textAnchor: 'end' }}
                height={100}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="org.project.files.access" stroke="#8884d8" name="Files Access" />
              <Line type="monotone" dataKey="org.project.files.create" stroke="#82ca9d" name="Files Create" />
              <Line type="monotone" dataKey="org.project.files.update" stroke="#ffc658" name="Files Update" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default EnhancedVisualizations; 