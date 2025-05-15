![snyk-oss-category](https://github.com/snyk-labs/oss-images/blob/main/oss-community.jpg)

# Audit Logs Visualizer

## Description

The Audit Logs Visualizer is a tool designed to help visualize and analyze Snyk audit logs. It provides a user-friendly interface to view, filter, and export audit logs from both organization and group levels. The tool helps security teams and administrators better understand and track security-related activities within their Snyk environment.

## Table of Contents

- [Description](#description)
- [Installation and Setup](#installation-and-setup)
  - [Prerequisites](#prerequisites)
  - [Environment Setup](#environment-setup)
  - [Installation Methods](#installation-methods)
  - [Verification](#verification)
- [Usage](#usage)
- [Features](#features)
- [Configuration](#configuration)
  - [Parameter Descriptions](#parameter-descriptions)
- [Testing](#testing)
- [Error Handling/Logging](#error-handlinglogging)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)

## Installation and Setup

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- A Snyk API token with appropriate permissions

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/snyk-ps/audit-logs-visualizer.git
cd audit-logs-visualizer
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
SNYK_API_TOKEN=your_api_token_here
```

### Installation Methods

#### Direct Installation
1. Install backend dependencies:
```bash
cd src/backend
npm install
```

2. Install frontend dependencies:
```bash
cd src/frontend
npm install
```

### Verification

To verify the installation:
1. Start the backend server:
```bash
npm run server
```

2. Start the frontend development server:
```bash
cd src/frontend
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Start the application using the provided scripts:
```bash
npm run server
```

2. Access the web interface at `http://localhost:3000`
3. Enter your Snyk API token if not already configured
4. Select the organization or group to view audit logs
5. Use the date range picker to select the desired time period
6. View and filter the audit logs as needed

## Features

- View audit logs from both organization and group levels
- Filter logs by date range, event type, and user
- Export logs to CSV format
- Real-time log updates
- User-friendly interface with detailed event information
- Support for both organization and group-level audit logs

## Configuration

### Parameter Descriptions

- `SNYK_API_TOKEN`: Your Snyk API token
- `PORT`: Backend server port (default: 3001)
- `FRONTEND_PORT`: Frontend development server port (default: 3000)

## Testing

To run tests:
```bash
# Backend tests
cd src/backend
npm test

# Frontend tests
cd src/frontend
npm test
```

## Error Handling/Logging

The application uses a structured logging system:
- Backend logs are stored in `src/backend/backend.log`
- Frontend errors are logged to the browser console
- API errors are displayed in the UI with detailed messages

## Troubleshooting

Common issues and solutions:

1. **API Token Issues**
   - Ensure your API token has the correct permissions
   - Verify the token is correctly set in the environment variables

2. **Connection Issues**
   - Check if the backend server is running
   - Verify the correct ports are being used
   - Check network connectivity

3. **Data Loading Issues**
   - Verify the date range selection
   - Check if the selected organization/group has audit logs
   - Ensure proper API permissions

## Deployment

The application can be deployed using various methods:

1. **Docker Deployment**
   - Build and run using Docker Compose
   - Configure environment variables in docker-compose.yml

2. **Manual Deployment**
   - Build the frontend: `cd src/frontend && npm run build`
   - Start the backend server: `cd src/backend && npm start`
   - Serve the frontend build files using a web server

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
