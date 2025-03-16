import requests
from typing import List, Dict, Any, Optional
import json
import os
from datetime import datetime, timedelta
import logging
from dotenv import load_dotenv
from utils import check_date_format 

logger = logging.getLogger(__name__)

# Define the default maximum number of pages and default number of days
DEFAULT_MAX_PAGES = 110
DEFAULT_DAYS = 2


class AuditLogClient:
    def __init__(self, base_url: str, api_key: str, org_id: str):
        self.base_url = base_url
        self.api_key = api_key
        self.org_id = org_id
        self.headers = {
            "Authorization": f"token {self.api_key}",
            "Content-Type": "application/json",
        }

    def _get_dates(self, from_date: Optional[str] = None, to_date: Optional[str] = None) -> tuple[str, str]:
        """Helper function to get from_date and to_date."""
        if from_date is not None and to_date is not None:
            if not check_date_format(from_date):
                raise ValueError(f"Incorrect from_date format. Use YYYY-MM-DDTHH:MM:SSZ. Input: {from_date}")
            if not check_date_format(to_date):
                raise ValueError(f"Incorrect to_date format. Use YYYY-MM-DDTHH:MM:SSZ. Input: {to_date}")
            return from_date, to_date
        elif from_date is not None or to_date is not None:
            raise ValueError("Both from_date and to_date must be provided if either is specified.")
        else:
            today = datetime.now()
            to_date = today.strftime("%Y-%m-%dT%H:%M:%SZ")
            from_date = (today - timedelta(days=DEFAULT_DAYS)).strftime("%Y-%m-%dT%H:%M:%SZ")
            return from_date, to_date


    def query_audit_logs(
        self,
        group_id: str,
        event: Optional[str] = None,
        user_id: Optional[str] = None,
        page_size: Optional[int] = None,
        page: Optional[int] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        debug: bool = False,
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/groups/{group_id}/audit_logs/search?version=2024-10-15"
        params = {}

        if event:
            params["filter[event]"] = event
        if user_id:
            params["filter[userId]"] = user_id

        try:
          from_date, to_date = self._get_dates(from_date, to_date)
        except ValueError as e:
          logger.error(e)
          return {"logs": [], "has_more": False, "total": 0}

        params["from"] = from_date
        params["to"] = to_date

        if page_size:
            params["page[size]"] = page_size
        if page:
            params["page[number]"] = page

        if debug:
            logger.debug(f"Querying URL: {url}")
            logger.debug(f"Request Headers: {self.headers}")
            logger.debug(f"Query Parameters: {params}")

        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()

            if "data" in data and "items" in data["data"]:
                if debug:
                    logger.debug(f"Full Response: {json.dumps(data, indent=2)}")
                return {
                    "logs": data["data"]["items"],
                    "has_more": data.get("links", {}).get("next") is not None,
                    "total": data["data"].get("meta", {}).get("total")
                }
            else:
                logger.error(
                    f"Unexpected response format from Snyk API: {data}. Status code: {response.status_code}"
                )
                return {"logs": [], "has_more": False, "total": 0}
        except requests.exceptions.RequestException as e:
            logger.error(f"Error querying audit logs: {e}")
            return {"logs": [], "has_more": False, "total": 0}
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding JSON response: {e}")
            return {"logs": [], "has_more": False, "total": 0}

    def get_all_audit_logs(
        self,
        group_id: str,
        event: Optional[str] = None,
        user_id: Optional[str] = None,
        page_size: Optional[int] = 100,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        max_pages: int = DEFAULT_MAX_PAGES,
        debug: bool = False,
    ) -> List[Dict[str, Any]]:
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
            if result["logs"]:
                all_logs.extend(result["logs"])
            has_more = result["has_more"]
            page += 1
        if page > max_pages:
            logger.warning(f"Reached maximum number of pages ({max_pages}). Stopping.")
        return all_logs

