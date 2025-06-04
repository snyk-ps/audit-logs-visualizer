![snyk-oss-category](https://github.com/snyk-labs/oss-images/blob/main/oss-community.jpg)

# Audit Logs Visualizer

A tool for visualizing Snyk audit logs with both a web interface and CLI capabilities.

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

- Node.js (v14 or higher)
- npm (v6 or higher)
- A Snyk API token with appropriate permissions

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/luciano-mori/audit-logs-visualizer.git
   cd audit-logs-visualizer
   ```

2. Install dependencies for both backend and frontend:
   ```bash
   bash start-servers.sh
   ```

## Usage

### Starting the Servers

To start both the backend and frontend servers, run:

```bash
bash start-servers.sh
```

This script will:
- Install dependencies for both backend and frontend if not already installed
- Start the backend server (logs available in `backend.log`)
- Start the frontend server (logs available in `src/frontend/frontend.log`)

### Accessing the Application

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:3001](http://localhost:3001)

### CLI Report Generation

You can generate reports directly using the backend CLI tool:

These commands need to be executed in src/backend

```bash
# Using Group ID
node src/index.js --api-key YOUR_API_KEY --group-id YOUR_GROUP_ID --from-date 2025-03-12T00:00:00Z --to-date 2025-03-16T00:00:00Z

# Using Organization ID
node src/index.js --api-key YOUR_API_KEY --org-id YOUR_ORG_ID --from-date 2025-03-12T00:00:00Z --to-date 2025-03-16T00:00:00Z
```

For more details about CLI options and usage, see the [Backend README](src/backend/README.md).

## Features

- Web interface for interactive visualization
- CLI tool for generating reports
- Multiple output formats (HTML, JSON, CSV, SQLite)
- Date range filtering
- Support for both organization and group-level audit logs
- RBAC-based Snyk API authentication
- Configurable date ranges for audit log retrieval
- Default HTML output format for easy sharing and viewing

## Configuration

### Parameter Descriptions

- **API Key**: Required for Snyk API authentication
- **Group ID**: Optional, used for group-level audit logs
- **Organization ID**: Optional, used for organization-level audit logs
- **From Date**: Start date for filtering audit logs (format: YYYY-MM-DDTHH:MM:SSZ)
- **To Date**: End date for filtering audit logs (format: YYYY-MM-DDTHH:MM:SSZ)

## Error Handling/Logging

- **Backend**: The backend service provides detailed logs for debugging and monitoring
- **Frontend**: The frontend service provides detailed logs for debugging and monitoring

## Troubleshooting

- **Common Issues**: If you encounter issues, please check the logs for detailed error messages
- **Support**: If you need further assistance, please contact the development team

## Deployment

- **Production**: The application is designed to be deployed in a production environment
- **Development**: The application is designed to be deployed in a development environment

## Development

### Backend

The backend service provides both a REST API and a CLI tool. See the [Backend README](src/backend/README.md) for detailed information about:
- CLI usage and options
- API endpoints
- Configuration
- Development setup

### Frontend

The frontend is a React application that provides an interactive interface for visualizing audit logs.

<img width="1233" alt="image" src="https://github.com/user-attachments/assets/81735e0e-bd11-4ad1-9b40-d98b51660f00" />


<img width="1353" alt="image" src="https://github.com/user-attachments/assets/3bd0f559-5ced-4382-a34d-75003ccea62c" />


## License

MIT
