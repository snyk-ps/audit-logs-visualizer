# Audit Logs Visualizer - Pending Tasks

## Current Tasks

- [ ] **Make Project ID a clickable link**
  - Update the Project ID column in AuditLogsVisualization.js to render as a clickable link
  - Link should navigate to project details or open in a new tab
  - Consider using Snyk API endpoint for project details if available
  - Add hover effect to indicate it's clickable

- [ ] **Cross query users endpoint to show name/email based on user ID**
  - Implement a new endpoint in the backend to fetch user details
  - Add caching mechanism to reduce API calls for repetitive user IDs
  - Update the User ID column in AuditLogsVisualization.js to display user name/email when available
  - Keep the user ID visible but add name/email as additional information
  - Consider displaying as `name <email>` or `name (email)` format
  - Fall back to showing only user ID if the user details aren't available

## Completed Tasks

- [x] Add User ID column to audit logs table
- [x] Improve table layout and prevent column overlap
- [x] Format date/time display for better readability 