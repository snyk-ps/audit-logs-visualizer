import React, { useState } from 'react';
import ActivityOverTime from './ActivityOverTime';
import './EventVisualizer.css';

const EventVisualizer = ({ events = [], dateRange }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showFullContent, setShowFullContent] = useState(false);

  const truncateContent = (content) => {
    if (typeof content === 'string') {
      return content.length > 50 ? content.substring(0, 50) + '...' : content;
    }
    return JSON.stringify(content).length > 50 
      ? JSON.stringify(content).substring(0, 50) + '...' 
      : JSON.stringify(content);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="event-visualizer">
      <ActivityOverTime events={events} dateRange={dateRange} />
      <div className="events-list">
        <h2>Events</h2>
        <div className="events-table">
          <div className="table-header">
            <div>Time</div>
            <div>Event</div>
            <div>Details</div>
          </div>
          {events.map((event, index) => (
            <div 
              key={index} 
              className={`event-row ${selectedEvent === index ? 'selected' : ''}`}
              onClick={() => setSelectedEvent(index)}
            >
              <div>{formatDate(event.created)}</div>
              <div>{event.event}</div>
              <div title={JSON.stringify(event.content, null, 2)}>
                {truncateContent(event.content)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {selectedEvent !== null && (
        <div className="event-details">
          <h3>Event Details</h3>
          <button 
            className="toggle-content"
            onClick={() => setShowFullContent(!showFullContent)}
          >
            {showFullContent ? 'Show Less' : 'Show More'}
          </button>
          <pre className={showFullContent ? 'full-content' : 'truncated-content'}>
            {JSON.stringify(events[selectedEvent], null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default EventVisualizer; 