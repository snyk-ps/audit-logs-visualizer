# Audit Logs Event Visualizer

A React-based visualization tool for audit logs data. This application provides interactive charts and tables to analyze event data from audit logs.

## Features

- Upload and parse CSV, TXT, or LOG files containing audit event data
- View interactive visualizations:
  - Action Types Distribution (Pie Chart)
  - Time of Day Distribution (Bar Chart)
  - Daily Activity Breakdown (Stacked Bar Chart)
  - Recent Events Timeline (Table)
- Support for multiple data formats:
  - Standard audit_logs.csv format with columns: Count, Group ID, Org ID, Project ID, User ID, Event, Time
  - Custom format with columns for user ID, session ID, resource ID, status, action type, timestamp
  - Space-delimited text files with similar column structure

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/luciano-mori/audit-logs-v2.git
   cd audit-logs-v2/event-visualizer
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Running the Application

1. Start the development server:
   ```
   npm start
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. Use the file upload button to select and upload your audit log file

## Supported File Formats

The visualizer supports several types of input files:

### CSV Format (audit_logs.csv)
```
Count,Group ID,Org ID,Project ID,User ID,Event,Time
1,0fe5f483-330b-4dc7-8770-a48422312f75,7568202e-ab7e-4a3e-8ca0-493b39157336,2af1da8b-8154-4c7e-880b-98fa0276d861,N/A,org.project.files.access,2025-03-15T03:03:59.000Z
```

### Standard Format (CSV or text)
```
user_id,session_id,resource_id,status,action_type,timestamp
```

## Building for Production

Build the application for production deployment:
```
npm run build
```

This creates an optimized production build in the `build` folder.

## Technology Stack

- React
- Recharts for data visualization
- Papa Parse for CSV parsing
- Tailwind CSS for styling

---

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
