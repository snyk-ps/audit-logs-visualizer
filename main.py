import os
import argparse
from tabulate import tabulate
from dotenv import load_dotenv
import logging
from datetime import datetime, timedelta

from audit_log_client import AuditLogClient, DEFAULT_MAX_PAGES, DEFAULT_DAYS

# Configure logging
log_level = logging.INFO
logger = logging.getLogger(__name__)
logging.basicConfig(level=log_level, format='%(asctime)s - %(levelname)s - %(message)s')

def main():
    parser = argparse.ArgumentParser(description="Query Snyk Audit Logs")
    parser.add_argument(
        "--org_id",
        type=str,
        help="Snyk Organization ID (optional, uses SNYK_ORG_ID from .env if not provided)",
        default=None,
    )
    parser.add_argument(
        "--group_id",
        type=str,
        help="Snyk Group ID (optional, uses SNYK_GROUP_ID from .env if not provided)",
        default=None,
    )
    parser.add_argument(
        "--from_date",
        type=str,
        help="From date (YYYY-MM-DDTHH:MM:SSZ) - Overrides .env and automatic CONSTANT day calculation",
        default=None,
    )
    parser.add_argument(
        "--to_date", type=str, help="To date (YYYY-MM-DDTHH:MM:SSZ) - Overrides .env and automatic 7-day calculation", default=None
    )
    parser.add_argument("--page_size", type=int, help="Page size", default=100)
    parser.add_argument("--page", type=int, help="Page number", default=1)
    parser.add_argument("--max_pages", type=int, help="Maximum number of pages to retrieve", default=DEFAULT_MAX_PAGES)
    parser.add_argument("--debug", action="store_true", help="Enable debug logging level")

    args = parser.parse_args()

    # Set logging level based on debug flag
    global log_level
    if args.debug:
        log_level = logging.DEBUG
    else:
        log_level = logging.INFO

    logging.getLogger().setLevel(log_level) #Setting log level

    # Load environment variables
    load_dotenv()
    api_key = os.getenv("SNYK_API_KEY")
    org_id = args.org_id or os.getenv("SNYK_ORG_ID")
    group_id = args.group_id or os.getenv("SNYK_GROUP_ID")
    from_date = args.from_date or os.getenv("FROM_DATE")
    to_date = args.to_date or os.getenv("TO_DATE")
    base_url = "https://api.snyk.io/rest"

    # Input validation and query type determination
    if not api_key:
        logger.error("Missing required environment variable (SNYK_API_KEY).")
        return

    if org_id and group_id:
        logger.warning(f"Both org_id and group_id provided. Using org_id {org_id} and ignoring group_id.")
        query_type = "org"
        query_id = org_id
    elif org_id:
        query_type = "org"
        query_id = org_id
        logger.info(f"Using org_id {org_id}")
    elif group_id:
        query_type = "group"
        query_id = group_id
        logger.info(f"Using group_id {group_id}")
    else:
      logger.error(f"Neither org_id nor group_id provided. At least one is required.")
      return  # Exit the function because of the error

    client = AuditLogClient(base_url, api_key)

    all_logs = client.get_all_audit_logs(
        query_type=query_type,
        query_id=query_id,
        from_date=from_date,
        to_date=to_date,
        page_size=args.page_size,
        max_pages=args.max_pages,
        debug=args.debug,
    )

    # Prepare data for table - Handle missing keys robustly and add counter column
    table_data = []
    for index, log_entry in enumerate(all_logs):
        # Directly access the top-level keys
        group_id = log_entry.get("group_id", "N/A")
        org_id = log_entry.get("org_id", "N/A")
        project_id = log_entry.get("project_id", "N/A")
        user_id = log_entry.get("user_id", "N/A") # Added this for user_id handling
        event = log_entry.get("event", "N/A")
        created = log_entry.get("created", "N/A")  # Renamed this to 'created' for clarity

        table_data.append(
            [index + 1, group_id, org_id, project_id, user_id, event, created]
        )

    # Print table
    headers = ["#", "Group ID", "Org ID", "Project ID", "User ID", "Event", "Time"]
    print(tabulate(table_data, headers=headers, tablefmt="grid"))

if __name__ == "__main__":
    main()
