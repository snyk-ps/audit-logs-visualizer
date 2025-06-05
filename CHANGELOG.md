# Changelog

All notable changes to this project will be documented in this file.

## [0.1.1] - 2024-03-21

### Added
- GitHub Actions workflows for automated testing:
  - `test-cli.yml`: Tests CLI functionality with group ID
  - `test-servers.yml`: Tests server startup and availability
- Automated HTML report generation verification
- Server startup verification in CI/CD pipeline
- Weekly automated testing via GitHub Actions cron jobs:
  - Both CLI and server tests run every Monday at 00:00 UTC
  - Ensures regular validation of core functionality

### Changed
- Updated Node.js version to 20.x in CI/CD workflows
- Improved server startup script reliability

### Fixed
- Server startup verification in CI/CD pipeline
- Process cleanup after server tests
- Log file handling in test workflows

## [0.1.0] - 2024-03-20

### Added
- Initial release of the Snyk Audit Logs Visualizer
- Two main ways to use the tool:

#### 1. Web Interface
- Launch both backend and frontend servers using `start-servers.sh`
- Access the web interface at `http://localhost:3000`
- View and interact with audit logs through a user-friendly UI
- Backend API available at `http://localhost:3001`

#### 2. CLI Report Generation
- Generate HTML reports directly from the command line
- Example command:
  ```bash
  node src/index.js --api-key YOUR_API_KEY --group-id YOUR_GROUP_ID --from-date  2025-03-12T00:00:00Z --to-date 2025-03-16T00:00:00Z
  ```
  ```bash
  node src/index.js --api-key YOUR_API_KEY --org-id YOUR_ORG_ID --from-date  2025-03-12T00:00:00Z --to-date 2025-03-16T00:00:00Z
  ```
- Supports both group-level and organization-level audit logs
- Outputs a standalone HTML report with detailed audit log information

### Technical Details
- Backend built with Node.js
- Frontend built with React
- Supports Snyk API authentication (RBAC-based)
- Configurable date ranges for audit log retrieval
- Default HTML output format for easy sharing and viewing 