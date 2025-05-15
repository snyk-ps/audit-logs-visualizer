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

### Basic Usage

```bash
node src/index.js --group-id <group-id> --output-format <format>
```

### NPM Scripts

For convenience, several npm scripts are available:

```bash
# Generate an HTML report using defaults from .env
npm run report:html

# Generate a group report (set GROUP_ID environment variable first)
GROUP_ID=abcd-1234-efgh-5678 npm run report:group

# Generate an organization report (set ORG_ID environment variable first)
ORG_ID=efgh-5678-ijkl-9012 npm run report:org
```

### Command Line Options

- `--org-id <id>`: Snyk Organization ID
- `--group-id <id>`: Snyk Group ID
- `--from-date <date>`: From date (YYYY-MM-DDTHH:MM:SSZ)
- `--to-date <date>`: To date (YYYY-MM-DDTHH:MM:SSZ)
- `--page-size <number>`: Page size (default: 100)
- `--page <number>`: Page number (default: 1)
- `--max-pages <number>`: Maximum number of pages (default: 100)
- `--debug`: Enable debug logging
- `--output-format <format>`: Output format (default: table)
  - Available formats: table, json, csv, sqlite, html
- `--output-file <filename>`: Specify the output filename for file formats

### Environment Variables

You can also set these options using environment variables:

- `SNYK_API_KEY`: Your Snyk API key (required)
- `SNYK_ORG_ID`: Your Snyk Organization ID
- `SNYK_GROUP_ID`: Your Snyk Group ID
- `FROM_DATE`: From date (YYYY-MM-DDTHH:MM:SSZ)
- `TO_DATE`: To date (YYYY-MM-DDTHH:MM:SSZ)
- `OUTPUT_FORMAT`: Output format (table, json, csv, sqlite, html)

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

## Examples

### Basic Examples

Fetch audit logs for a group and display as a table:
```bash
node src/index.js --group-id abcd-1234-efgh-5678 --from-date 2023-01-01T00:00:00Z --to-date 2023-01-31T23:59:59Z
```

Generate a JSON file:
```bash
node src/index.js --group-id abcd-1234-efgh-5678 --output-format json
```

Generate an HTML report:
```bash
node src/index.js --group-id abcd-1234-efgh-5678 --output-format html --output-file my-audit-report.html
```

### HTML Report Examples

Generate a report for a specific date range:
```bash
node src/index.js --group-id abcd-1234-efgh-5678 --from-date 2023-01-01T00:00:00Z --to-date 2023-01-31T23:59:59Z --output-format html
```

Generate a report for a specific organization:
```bash
node src/index.js --org-id efgh-5678-ijkl-9012 --output-format html --output-file org-audit-report.html
```

Generate and immediately view a report (on macOS):
```bash
node src/index.js --group-id abcd-1234-efgh-5678 --output-format html && open audit_logs_report_*.html
```

Generate and immediately view a report (on Windows):
```bash
node src/index.js --group-id abcd-1234-efgh-5678 --output-format html && start audit_logs_report_*.html
```

## Development

- Run tests:
  ```bash
  npm test
  ```

## License

MIT 