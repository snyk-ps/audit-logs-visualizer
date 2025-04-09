import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const ActivityOverTime = ({ events, dateRange }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!events || events.length === 0 || !dateRange.startDate || !dateRange.endDate) return;

    // Use the provided date range
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    // Create time slots (e.g., hourly)
    const timeSlots = {};
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const slotKey = currentDate.toISOString();
      timeSlots[slotKey] = 0;
      currentDate.setHours(currentDate.getHours() + 1);
    }

    // Count events in each time slot
    events.forEach(event => {
      const eventDate = new Date(event.created);
      const slotKey = new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate(),
        eventDate.getHours()
      ).toISOString();
      timeSlots[slotKey] = (timeSlots[slotKey] || 0) + 1;
    });

    const data = {
      labels: Object.keys(timeSlots),
      datasets: [
        {
          label: 'Events per Hour',
          data: Object.values(timeSlots),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1
        }
      ]
    };

    setChartData(data);
  }, [events, dateRange]);

  if (!chartData) return <div>Loading activity data...</div>;

  return (
    <div className="activity-over-time">
      <h3>Activity Over Time</h3>
      <div className="chart-container">
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                type: 'time',
                time: {
                  unit: 'hour',
                  displayFormats: {
                    hour: 'MMM d, HH:mm'
                  }
                },
                title: {
                  display: true,
                  text: 'Time'
                },
                min: dateRange.startDate,
                max: dateRange.endDate
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Number of Events'
                }
              }
            },
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.parsed.y} events`;
                  }
                }
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default ActivityOverTime; 