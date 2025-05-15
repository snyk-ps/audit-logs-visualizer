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
npm run install:all
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
SNYK_API_TOKEN=your_api_token_here
```

### Installation Methods

#### Direct Installation
1. Install all dependencies using the provided script:
```bash
npm run install:all
```

### Verification

To verify the installation:
1. Start the application using the provided script:
```bash
./start-servers.sh
```

2. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Start the application using the provided script:
```bash
./start-servers.sh [OPTIONS]
```

The script supports the following options:
- `--api-key, -k`: Set Snyk API Key
- `--org-id, -o`: Set Snyk Organization ID
- `--group-id, -g`: Set Snyk Group ID
- `--from-date, -f`: Set start date (format: YYYY-MM-DDTHH:MM:SSZ)
- `--to-date, -t`: Set end date (format: YYYY-MM-DDTHH:MM:SSZ)

Example:
```bash
./start-servers.sh --api-key=YOUR_KEY --group-id=YOUR_GROUP_ID --from-date=2023-01-01T00:00:00Z --to-date=2023-01-31T23:59:59Z
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

The application can be deployed using the provided `start-servers.sh` script:

1. **Script-based Deployment**
   - Make the script executable: `chmod +x start-servers.sh`
   - Run the script with your desired options:
     ```bash
     ./start-servers.sh --api-key=YOUR_KEY --group-id=YOUR_GROUP_ID
     ```
   - The script will:
     - Start the backend server
     - Start the frontend server
     - Handle environment variables
     - Manage process cleanup

2. **CLI Usage**
   For information about using the CLI-only features, please refer to the README in the `src/backend` directory.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
