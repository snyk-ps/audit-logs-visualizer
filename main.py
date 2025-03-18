import os
import argparse
from tabulate import tabulate
from dotenv import load_dotenv
import logging
from datetime import datetime, timedelta

from audit_log_client import AuditLogClient, DEFAULT_MAX_PAGES, DEFAULT_DAYS
from utils import check_date_format

# Configure logging - Log level is now configurable
log_level = logging.INFO  # Default log level

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

    logging.basicConfig(level=log_level, format='%(asctime)s - %(levelname)s - %(message)s')

    # Load environment variables
    load_dotenv()
    api_key = os.getenv("SNYK_API_KEY")
    org_id = args.org_id or os.getenv("SNYK_ORG_ID")
    group_id = args.group_id or os.getenv("SNYK_GROUP_ID")
    from_date = args.from_date or os.getenv("FROM_DATE")
    to_date = args.to_date or os.getenv("TO_DATE")
    base_url = "https://api.snyk.io/rest"

    # Input validation
    if not all([api_key, org_id, group_id]):
        logger.error("Missing required environment variables (SNYK_API_KEY, SNYK_ORG_ID, SNYK_GROUP_ID).")
        return

    client = AuditLogClient(base_url, api_key, org_id)

    all_logs = client.get_all_audit_logs(
        group_id=group_id,
        from_date=from_date,
        to_date=to_date,
        page_size=args.page_size,
        max_pages=args.max_pages,
        debug=args.debug,
    )

    # Prepare data for table - Handle missing keys robustly and add counter column
    table_data = []
    for index, log in enumerate(all_logs):
        group_id = log.get("group_id", "N/A")
        org_id = log.get("org_id", "N/A")
        project_id = log.get("project_id", "N/A")
        user_id = log.get("user_id", "N/A")
        event = log.get("event", "N/A")
        timestamp = log.get("created", "N/A")
        table_data.append([index + 1, group_id, org_id, project_id, user_id, event, timestamp])

    # Print table
    headers = ["#", "Group ID", "Org ID", "Project ID", "User ID", "Event", "Time"]
    print(tabulate(table_data, headers=headers, tablefmt="grid"))


if __name__ == "__main__":
    main()
