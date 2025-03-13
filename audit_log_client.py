import requests
from typing import List, Dict, Any, Optional
import json  # Import the json module
import os


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
        page_size: int = 500,
        page: int = 1,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
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
            params["filter[groupId]"] = group_id  # Correct parameter name
        if event:
            params["filter[event]"] = event  # Correct parameter name
        if user_id:
            params["filter[userId]"] = user_id  # Correct parameter name
        if from_date:
            params["filter[from]"] = from_date
        if to_date:
            params["filter[to]"] = to_date

        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()

            data = response.json()
            print(json.dumps(data, indent=2))  # Print the response in formatted JSON

            if (
                isinstance(data, dict)
                and "data" in data
                and "items" in data["data"]
                and isinstance(data["data"]["items"], list)
            ):  # Check if the response is a dictionary with a data.items key
                return {
                    "logs": data["data"]["items"],
                    "has_more": True if data.get("links", {}).get("next") else False,
                }
            else:
                print(
                    f"Warning: Response did not contain data in the expected format: {data}"
                )
                return {"logs": [], "has_more": False}

        except requests.exceptions.RequestException as e:
            print(f"Error querying audit logs: {e}")
            return {"logs": [], "has_more": False}

    def get_all_audit_logs(
        self,
        group_id: Optional[str] = None,
        event: Optional[str] = None,
        user_id: Optional[str] = None,
        page_size: int = 100,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves all audit logs.
        """
        all_logs = []
        page = 1
        has_more = True

        while has_more:
            result = self.query_audit_logs(
                group_id=group_id,
                event=event,
                user_id=user_id,
                page_size=page_size,
                page=page,
                from_date=from_date,
                to_date=to_date,
            )
            all_logs.extend(result["logs"])
            has_more = result["has_more"]
            page += 1

        return all_logs
