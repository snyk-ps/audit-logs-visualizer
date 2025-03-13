import os
import argparse
from tabulate import tabulate
from dotenv import load_dotenv
import logging

from audit_log_client import AuditLogClient, DEFAULT_MAX_PAGES
from utils import check_date_format

# Load environment variables
load_dotenv()
API_KEY = os.getenv("SNYK_API_KEY")
ORG_ID = os.getenv("SNYK_ORG_ID")
BASE_URL = "https://api.snyk.io/rest"
FROM_DATE = os.getenv("from_date")
TO_DATE = os.getenv("to_date")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Query Snyk Audit Logs")
    parser.add_argument(
        "--org_id",
        type=str,
        help="Snyk Organization ID",
        default=ORG_ID,
    )
    parser.add_argument(
        "--from_date",
        type=str,
        help="From date (YYYY-MM-DDTHH:MM:SSZ)",
        default=FROM_DATE,
    )
    parser.add_argument(
        "--to_date", type=str, help="To date (YYYY-MM-DDTHH:MM:SSZ)", default=TO_DATE
    )
    parser.add_argument("--page_size", type=int, help="Page size", default=100)
    parser.add_argument("--max_pages", type=int, help="Maximum number of pages to retrieve", default=DEFAULT_MAX_PAGES)
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")

    args = parser.parse_args()

    # Set logging level based on debug flag
    if args.debug:
        logger.setLevel(logging.DEBUG)
        logger.debug("Debug mode enabled")

    # Check if org_id is provided
    if not args.org_id:
        print(
            "Error: Organization ID is required. Please provide it via --org_id or set SNYK_ORG_ID in the .env file."
        )
        return

    if not API_KEY:
        print(
            "Error: API Key is required. Please provide it via SNYK_API_KEY in the .env file."
        )
        return

    if args.from_date and not check_date_format(args.from_date):
        print(
            f"Error: Incorrect from_date format. The correct format is: YYYY-MM-DDTHH:MM:SSZ, your input was: {args.from_date}"
        )
        return

    if args.to_date and not check_date_format(args.to_date):
        print(
            f"Error: Incorrect to_date format. The correct format is: YYYY-MM-DDTHH:MM:SSZ, your input was: {args.to_date}"
        )
        return

    client = AuditLogClient(BASE_URL, API_KEY, args.org_id)

    all_logs = client.get_all_audit_logs(
        from_date=args.from_date,
        to_date=args.to_date,
        page_size=args.page_size,
        max_pages=args.max_pages,
        debug=args.debug,
    )

    # Prepare data for table
    table_data = []
    for log in all_logs:
        if isinstance(log, dict):
            group_name = log.get("group_id", "")
            org_name = log.get("org_id", "")
            user_name = log.get("user_id", "")
            event_name = log.get("event", "")
            timestamp = log.get("created", "")
            table_data.append([group_name, org_name, user_name, event_name, timestamp])
        else:
            print(f"Warning: Log entry is not a dictionary: {log}")

    # Print table
    headers = ["Group", "Org", "User", "Event", "Time"]
    print(tabulate(table_data, headers=headers, tablefmt="grid"))


if __name__ == "__main__":
    main()
