# FILEPATH: backend/app/domains/auth/workflows/lifecycle.py
# @file Account Lifecycle Definition
# @author The Engineer
# @description The Governance Logic for User Status.

from typing import Dict, Any

# ⚡ CONVENTION: The Variable Name matches the Scope Key
LIFECYCLE: Dict[str, Any] = {
    "key": "LIFECYCLE",
    "label": "Account Status Lifecycle",
    "type": "GOVERNANCE",
    "target_field": "status", # Maps to User.status column
    "config": {
        "id": "user_lifecycle",
        "initial": "PENDING",
        "states": {
            "PENDING": {
                "on": {
                    "ACTIVATE": "ACTIVE",
                    "REJECT": "REJECTED"
                }
            },
            "ACTIVE": {
                "on": {
                    "SUSPEND": "SUSPENDED",
                    "ARCHIVE": "ARCHIVED"
                }
            },
            "SUSPENDED": {
                "on": {
                    "RESTORE": "ACTIVE",
                    "ARCHIVE": "ARCHIVED"
                }
            },
            "REJECTED": {
                "type": "final"
            },
            "ARCHIVED": {
                "type": "final"
            }
        }
    }
}

