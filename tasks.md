# Audit Logs Visualizer - Pending Tasks

## Current Tasks

- [ ] **Validate widget time window accuracy**
  - Verify that the time filters (FROM_DATE and TO_DATE) are correctly applied to the audit logs
  - Check for any timezone discrepancies between user input and API queries
  - Add visual indicators for the currently applied time window in the UI
  - Consider adding preset time ranges (last 24 hours, last 7 days, last 30 days)

- [ ] **Refactor AuditLogsVisualization.js component**
  - Break down the large component (1400+ lines) into smaller, reusable components
  - Extract filtering logic into separate hooks or utilities
  - Create dedicated components for:
    - Filter UI (dropdowns, search, active filters display)
    - Table and rendering logic
    - Entity ID display components
  - Improve performance by optimizing render cycles

- [ ] **Test data consistency between Python script and front end**
  - Compare audit logs returned by Python script and front end for identical time windows
  - Verify that filtering logic is consistent across implementations
  - Document any discrepancies and create resolution plan

- [ ] **Remove default values from front end inputs**
  - Remove hardcoded API keys, org IDs, and other sensitive information
  - Implement proper blank state handling when no values are provided
  - Add clear validation and error states for missing required inputs

## Completed Tasks

- [x] Add User ID column to audit logs table
- [x] Improve table layout and prevent column overlap
- [x] Format date/time display for better readability
- [x] **Make Project ID a clickable link**
  - Updated the Project ID column in AuditLogsVisualization.js to render as a clickable link
  - Links navigate to project details in a new tab using the format: https://app.snyk.io/org/{slug}/project/{project-id}/
  - Added API endpoint to fetch organization slugs
  - Implemented caching to reduce API calls
  - Added hover effect to indicate it's clickable
  
- [x] **Cross query users endpoint to show name/email based on user ID**
  - Implemented a new endpoint in the backend to fetch user details
  - Added caching mechanism to reduce API calls for repetitive user IDs
  - Updated the User ID column to display user name/email when available
  - Kept the user ID visible and added name/email as additional information
  - Added fallback to display "N/A" if the user details aren't available 