import requests
from typing import List, Dict, Any, Optional
import json
import os
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Define the default maximum number of pages here
DEFAULT_MAX_PAGES = 1


class AuditLogClient:
    def __init__(self, base_url: str, api_key: str, org_id: str):
        self.base_url = base_url
        self.api_key = api_key
        self.org_id = org_id
        self.headers = {
            "Authorization": f"token {self.api_key}",
            "Content-Type": "application/json",
            "version": "2024-10-15",
        }

    def query_audit_logs(
        self,
        group_id: Optional[str] = None,
        event: Optional[str] = None,
        user_id: Optional[str] = None,
        page_size: int = 100,
        page: int = 1,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        debug: bool = False,
    ) -> Dict[str, Any]:
        """
        Queries the audit log endpoint with filtering.

        Returns:
            Dict[str, Any]: A dictionary containing:
                - 'logs': A list of audit log entries (list of dictionaries).
                - 'has_more': True if there are more pages, False otherwise.
        """

        url = f"{self.base_url}/orgs/{self.org_id}/audit_logs/search?version=2024-10-15"

        params = {
            "page[size]": page_size,
            "page[number]": page,
        }

        if group_id:
            params["filter[groupId]"] = group_id
        if event:
            params["filter[event]"] = event
        if user_id:
            params["filter[userId]"] = user_id

        # Handle from_date default here (if not provided, set to yesterday)
        if not from_date:
            yesterday = datetime.now() - timedelta(days=1)
            from_date = yesterday.strftime("%Y-%m-%dT00:00:00Z")
        params["filter[from]"] = from_date

        if to_date:
            params["filter[to]"] = to_date

        if debug:
            logger.debug(f"Querying URL: {url}")
            logger.debug(f"Query Parameters: {params}")

        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()

            data = response.json()
            if debug:
                logger.debug(f"Response: {json.dumps(data, indent=2)}")

            if (
                isinstance(data, dict)
                and "data" in data
                and "items" in data["data"]
                and isinstance(data["data"]["items"], list)
            ):
                return {
                    "logs": data["data"]["items"],
                    "has_more": True if data.get("links", {}).get("next") else False,
                }
            else:
                logger.warning(
                    f"Warning: Response did not contain data in the expected format: {data}"
                )
                return {"logs": [], "has_more": False}

        except requests.exceptions.RequestException as e:
            logger.error(f"Error querying audit logs: {e}")
            return {"logs": [], "has_more": False}

    def get_all_audit_logs(
        self,
        group_id: Optional[str] = None,
        event: Optional[str] = None,
        user_id: Optional[str] = None,
        page_size: int = 100,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        max_pages: int = DEFAULT_MAX_PAGES,  # Use the constant here
        debug: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves all audit logs.
        """
        all_logs = []
        page = 1
        has_more = True

        while has_more and page <= max_pages:
            logger.info(f"Retrieving page {page} of audit logs")
            result = self.query_audit_logs(
                group_id=group_id,
                event=event,
                user_id=user_id,
                page_size=page_size,
                page=page,
                from_date=from_date,
                to_date=to_date,
                debug=debug,
            )
            all_logs.extend(result["logs"])
            has_more = result["has_more"]
            page += 1
        if page > max_pages:
            logger.warning(f"Reached maximum number of pages ({max_pages}). Stopping.")

        return all_logs

