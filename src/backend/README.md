# Snyk Audit Logs CLI Tool

This command line tool fetches audit logs from the Snyk API and displays them in various formats. It's part of the Audit Logs Visualizer project but can be used independently as a CLI tool.

## Features

- Query audit logs by organization or group
- Support for date range filtering
- Multiple output formats:
  - Table (console)
  - JSON
  - CSV
  - SQLite
  - HTML reports with color-coded events
- Pagination support
- Debug logging

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- A Snyk API key
- Snyk Organization ID or Group ID

## Installation

1. Navigate to the backend directory:
   ```bash
   cd src/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template and fill in your values:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Snyk API key and other configuration.

## Usage

### Example Commands

To generate a report using the backend only from the CLI, you can use the following commands:

1. **Using Group ID**:
   ```bash
   node src/index.js --api-key YOUR_API_KEY --group-id YOUR_GROUP_ID --from-date 2023-01-01T00:00:00Z --to-date 2023-01-31T23:59:59Z
   ```

2. **Using Organization ID**:
   ```bash
   node src/index.js --api-key YOUR_API_KEY --org-id YOUR_ORG_ID --from-date 2023-01-01T00:00:00Z --to-date 2023-01-31T23:59:59Z
   ```

Replace `YOUR_API_KEY`, `YOUR_GROUP_ID`, and `YOUR_ORG_ID` with your actual Snyk API key, group ID, and organization ID, respectively. These commands will generate an HTML report using the default output file name.

### Command Line Options

- `--org-id <id>`: Snyk Organization ID
- `--group-id <id>`: Snyk Group ID
- `--from-date <date>`: From date (YYYY-MM-DDTHH:MM:SSZ)
- `--to-date <date>`: To date (YYYY-MM-DDTHH:MM:SSZ)
- `--page-size <number>`: Page size (default: 100)
- `--page <number>`: Page number (default: 1)
- `--max-pages <number>`: Maximum number of pages (default: 100)
- `--debug`: Enable debug logging
- `--output-format <format>`: Output format (default: html)
  - Available formats: table, json, csv, sqlite, html
- `--output-file <filename>`: Specify the output filename for file formats

## Output Formats

- **table**: Display logs in a table format in the console
- **json**: Save logs to a JSON file
- **csv**: Save logs to a CSV file
- **sqlite**: Save logs to a SQLite database
- **html**: Generate a styled HTML report with color-coded events and formatted data
  - Events are color-coded by category (blue), subcategory (purple), action (green), and subaction (orange)
  - Entity IDs are displayed as colored badges for better visibility
  - Timestamp is automatically added to the filename
  - Report includes metadata such as generation time, date range, and log count

## License

MIT 