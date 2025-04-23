# Snyk Audit Log Client

This Python script interacts with the Snyk Audit Log API to retrieve and filter audit log entries. It allows you to fetch logs for a specific organization, filter by group, event type, user, and date range.

## Description

The `AuditLogClient` class in this script provides a convenient way to query the Snyk Audit Log API. It handles:

*   **Authentication:** Uses a Snyk API token for authentication.
*   **Endpoint:** Constructs the correct API endpoint URL for the specified organization.
*   **Filtering:** Allows filtering of audit logs by:
    *   `group_id`
    *   `event` type
    *   `user_id`
    *   Date range (using `days_ago`)
*   **Pagination:** Automatically handles pagination to retrieve all log entries, even if they span multiple pages.
*   **Error Handling:** Gracefully handles API errors and network issues.

## Features

*   **Retrieve All Logs:** Fetch all audit logs for an organization within a specified time frame (default: 30 days).
*   **Filter by Group:** Retrieve logs associated with a specific group ID.
*   **Filter by Event Type:** Retrieve logs for a particular event type (e.g., `org.project.files.create`, `org.project.edit`).
*   **Filter by User:** Retrieve logs for a particular user.
*   **Filter by Date Range:** Specify the number of days in the past to retrieve logs for.
*   **API Version:** the script is prepared to support the api versioning.
*   **Pagination:** Automatically handles the endpoint pagination.

## Prerequisites

*   **Python 3.6+:** Ensure you have Python 3 installed on your system.
*   **Snyk API Token:** You need a valid Snyk API token to authenticate with the API.
*   **Snyk Organization ID:** You need a Snyk Organization ID to authenticate with the API.

## Setup Instructions

These instructions will guide you through setting up a virtual environment, installing dependencies, and configuring the Snyk Audit Log Client.

1.  **Clone the Repository (or download the script):**

    If you have this in a Git repository:

    ```bash
    git clone <repository_url>
    cd audit-logs-v2
    ```

    If you only have the file, navigate to the directory where you saved it using the `cd` command.

2.  **Create a Virtual Environment (Recommended):**

    A virtual environment will isolate your project's dependencies from other Python projects. To create one, run the following command:

    ```bash
    python3 -m venv .venv
    ```
    This creates a directory named `.venv`.

3.  **Activate the Virtual Environment:**

    Before installing dependencies, activate the virtual environment:

    ```bash
    source .venv/bin/activate
    ```

    *(Note: On Windows (Command Prompt), use: `.venv\Scripts\activate`; on Windows (PowerShell) use `.venv\Scripts\Activate.ps1`)*.
    Your terminal prompt will likely change to indicate that the virtual environment is active (e.g., `(.venv) $`).

4.  **Install Dependencies:**

    Install the required packages:

    ```bash
    pip install -r requirements.txt
    ```
    *(Note: This step assumes you have a file named `requirements.txt` with the needed dependencies, including `requests` and `python-dotenv`)*

5.  **Configure Environment Variables:**

    It's best practice not to hardcode sensitive information like API keys directly into your script. Use environment variables instead:

    *   **Create a `.env` file:** Create a `.env` file in the project's root directory.
    *   **Add your credentials:** Add your Snyk API key and Snyk Organization ID to the `.env` file:

        ```
        SNYK_API_KEY="your_snyk_api_key_here"
        SNYK_ORG_ID="your_snyk_org_id_here"
        ```

    *   **Load variables in your code:** Use the `python-dotenv` library to load these variables:

        ```python
        from dotenv import load_dotenv
        import os

        load_dotenv()  # Load environment variables from .env

        API_KEY = os.getenv("SNYK_API_KEY")
        ORG_ID = os.getenv("SNYK_ORG_ID")
        ```

6.  **(Optional) Verify Installations:**

    To verify that the packages are installed in the virtual environment correctly, run:

    ```bash
    pip freeze
    ```

    This will display a list of the installed packages and their versions.

## Usage

1.  **Run the Script:**

    ```bash
    python main.py
    ```

2.  **Example Use Cases:**

    The `main.py` file contains example usages. Here's a summary:

    *   **Get all logs for the last 30 days:**

        ```python
        all_logs = client.get_all_audit_logs()
        print(f"Total logs for the last 30 days: {len(all_logs)}")
        ```

    *   **Get logs for a specific group:**

        ```python
        group_logs = client.get_all_audit_logs(group_id="0fe5f483-330b-4dc7-8770-a48422312f75")
        print(f"Logs for group 0fe5f483-330b-4dc7-8770-a48422312f75: {len(group_logs)}")
        ```

    *   **Get logs for a specific event type (e.g., `org.project.files.create`) within the last 15 days:**

        ```python
        event_logs = client.get_all_audit_logs(event="org.project.files.create", days_ago=15)
        print(f"Logs for event org.project.files.create (last 15 days): {len(event_logs)}")
        ```

    *   **Get logs for a specific event type:**

        ```python
        org_event_logs = client.get_all_audit_logs(event="org.project.edit")
        print(f"Logs for event org.project.edit: {len(org_event_logs)}")
        ```

    *   **Get logs for a specific user:**

        ```python
        user_logs = client.get_all_audit_logs(user_id="af1e6030-c906-4ab6-8f2b-a0d56db4445c")
        print(f"Logs for user af1e6030-c906-4ab6-8f2b-a0d56db4445c: {len(user_logs)}")
        ```

## Running the Application

The application consists of a backend server (Express.js) and a frontend visualization tool (React). You can run them together or individually.

### Running Both Servers Together

A convenience script is provided to start both the backend and frontend servers simultaneously:

```bash
# Navigate to the frontend directory
cd event-visualizer

# Install the concurrently dependency if not already installed
npm install --save-dev concurrently

# Start both servers
npm run start:all
```

This will:
- Start the backend server on http://localhost:3001
- Start the frontend server on http://localhost:3000
- Handle graceful shutdown of both servers when you press Ctrl+C

### Running Servers Individually

If you prefer to run the servers separately:

#### Backend Server

```bash
# Navigate to the backend directory
cd backend

# Start the server
npm run server
```

The backend server will run on http://localhost:3001.

#### Frontend Server

```bash
# Navigate to the frontend directory
cd event-visualizer

# Start the React development server
npm start
```

The frontend application will be available at http://localhost:3000.

## Generating HTML Reports

This application provides two ways to generate HTML reports of audit logs:

### Using the Frontend

1. Access the frontend visualization at http://localhost:3000
2. Configure your API key, organization ID, or group ID
3. Apply any filters you want (event types, search text, etc.)
4. Click the "Export as HTML" button at the top of the table
5. The browser will download an HTML file containing your filtered audit logs

The HTML report includes:
- Color-coded event categories
- Badges for entity IDs
- All currently applied filters
- Metadata such as generation time and date range

### Using the Command Line

You can also generate HTML reports directly from the command line:

```bash
# Navigate to the backend directory
cd backend

# Generate a report for a specific group
npm run report:group GROUP_ID=your-group-id-here

# Or generate a report for a specific organization
npm run report:org ORG_ID=your-org-id-here

# Or use the default config from .env
npm run report:html
```

You can also use the full command with more options:

```bash
node src/index.js --group-id your-group-id --from-date 2023-01-01T00:00:00Z --to-date 2023-12-31T23:59:59Z --output-format html --output-file my-custom-report-name
```

The HTML report will be saved to the current directory with a timestamp in the filename.

## Deactivating the Virtual Environment

When you're finished working with the script, deactivate the virtual environment:

```bash
deactivate
```
