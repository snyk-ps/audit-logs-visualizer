# Snyk Audit Logs CLI (Node.js Version)

A Node.js command-line tool for querying and exporting Snyk audit logs. This is a Node.js port of the original Python application.

## Features

- Query audit logs by organization or group
- Support for date range filtering
- Multiple output formats:
  - Table (console)
  - JSON
  - CSV
  - SQLite
- Pagination support
- Debug logging

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- A Snyk API key
- Snyk Organization ID or Group ID

## Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy the environment template and fill in your values:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Snyk API key and other configuration.

## Usage

### Basic Usage

```bash
node src/index.js
```

This will use the default settings from your `.env` file.

### Command Line Options

```bash
node src/index.js --help
```

Available options:
- `--org-id <id>`: Snyk Organization ID
- `--group-id <id>`: Snyk Group ID
- `--from-date <date>`: From date (YYYY-MM-DDTHH:MM:SSZ)
- `--to-date <date>`: To date (YYYY-MM-DDTHH:MM:SSZ)
- `--page-size <number>`: Page size (default: 100)
- `--page <number>`: Page number (default: 1)
- `--max-pages <number>`: Maximum number of pages (default: 100)
- `--debug`: Enable debug logging
- `--output-format <format>`: Output format (table, json, csv, sqlite)

### Examples

1. Query with specific dates:
   ```bash
   node src/index.js --from-date 2024-01-01T00:00:00Z --to-date 2024-01-31T23:59:59Z
   ```

2. Export to CSV:
   ```bash
   node src/index.js --output-format csv
   ```

3. Query with debug logging:
   ```bash
   node src/index.js --debug
   ```

## Development

- Start development server:
  ```bash
  npm run dev
  ```

- Run tests:
  ```bash
  npm test
  ```

## License

MIT 