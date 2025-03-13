import os
import argparse
from tabulate import tabulate
from dotenv import load_dotenv

from audit_log_client import AuditLogClient  # Importing the class
from utils import check_date_format # Importing the check date format function

# Load environment variables
load_dotenv()
API_KEY = os.getenv("SNYK_API_KEY")
ORG_ID = os.getenv("SNYK_ORG_ID")
BASE_URL = "https://api.snyk.io/rest"


def main():
    parser = argparse.ArgumentParser(description="Query Snyk Audit Logs")
    parser.add_argument(
        "--org_id",
        type=str,
        help="Snyk Organization ID",
        default=ORG_ID,  # Use the ORG_ID from the .env
    )
    parser.add_argument(
        "--from_date",
        type=str,
        help="From date (YYYY-MM-DDTHH:MM:SSZ)",
        default=None,
    )
    parser.add_argument(
        "--to_date", type=str, help="To date (YYYY-MM-DDTHH:MM:SSZ)", default=None
    )
    parser.add_argument("--page_size", type=int, help="Page size", default=100)

    args = parser.parse_args()

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

    # Example 1: Get all logs
    all_logs = client.get_all_audit_logs(
        from_date=args.from_date, to_date=args.to_date, page_size=args.page_size
    )

    # Prepare data for table
    table_data = []
    for log in all_logs:
        # print(log) #uncomment to debug
        if isinstance(log, dict):  # check if it is a dict, before trying to get info from it
            # this is for the items
            group_name = log.get("group_id", "")  # Use .get() with a default value
            org_name = log.get("org_id", "")
            user_name = log.get("user_id", "")  # Now getting user id
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
