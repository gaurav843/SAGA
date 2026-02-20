# FILEPATH: backend/app/domains/auth/workflows/user_admin.py
# @file: User Admin Console Definition
# @author: The Engineer
# @description: Defines the "User Administration" view.
# @updated: Fixed Widget Key casing (SmartGrid -> SMART_GRID) to match Registry.

from typing import Dict, Any

USER_ADMIN: Dict[str, Any] = {
    "key": "USER_ADMIN",
    "label": "User Administration",
    "type": "WIZARD",
    "mode": "VIEW",
    "target_field": None,
    "config": {
        "id": "user_admin_console",
        "initial": "list_view",
        "states": {
            "list_view": {
                "meta": {
                    "title": "User Management",
                    "description": "Manage system access and identities.",
                    "form_schema": [
                        {
                            "name": "main_grid",
                            "label": "Registered Users",
                            # ⚡ FIX: Use Strict Registry Key (Matches structures.py)
                            "component": "SMART_GRID",
                            
                            # CONFIGURATION
                            "options": [{"value": "USER"}],
                            
                            # ⚡ SPLIT ACTION CONFIGURATION
                            "create_flow": "USER_CREATE", 
                            "edit_flow": "USER_EDIT",
                            
                            # Fallback for older Grid Components
                            "placeholder": "USER_CREATE", 

                            # COLUMN DEFINITIONS
                            "columns": [
                                {
                                    "title": "Identity",
                                    "dataIndex": "email",
                                    "hideInSearch": False
                                },
                                {
                                    "title": "Full Name",
                                    "dataIndex": "full_name",
                                    "hideInSearch": False
                                },
                                {
                                    "title": "Role",
                                    "dataIndex": "role",
                                    "valueType": "select",
                                    "valueEnum": {
                                        "admin": {"text": "Administrator", "status": "Error"},
                                        "user": {"text": "User", "status": "Success"},
                                        "operator": {"text": "Operator", "status": "Processing"}
                                    }
                                },
                                {
                                    "title": "Status",
                                    "dataIndex": "status",
                                    "valueType": "select",
                                    "valueEnum": {
                                        "ACTIVE": {"text": "Active", "status": "Success"},
                                        "PENDING": {"text": "Pending", "status": "Warning"},
                                        "SUSPENDED": {"text": "Suspended", "status": "Error"}
                                    }
                                },
                                {
                                    "title": "Joined",
                                    "dataIndex": "created_at",
                                    "valueType": "date",
                                    "hideInSearch": True
                                }
                            ]
                        }
                    ]
                },
                "type": "final"
            }
        }
    }
}

