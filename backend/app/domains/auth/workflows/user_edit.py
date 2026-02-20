# FILEPATH: backend/app/domains/auth/workflows/user_edit.py
# @file: User Edit Workflow (The Mutation Engine)
# @author: The Sovereign Engineer
# @description: A multi-tabbed interface for managing User Identity.
# @security-level: LEVEL 9 (Tab-Gated)
# @invariant: ASCII Only (Database Safe).

from typing import Dict, Any

USER_EDIT: Dict[str, Any] = {
    "key": "USER_EDIT",
    "label": "Edit User",
    "type": "WIZARD",
    "mode": "EDIT",
    "target_field": None,
    "config": {
        "id": "user_edit_flow",
        "initial": "edit_dashboard",
        "states": {
            "edit_dashboard": {
                "meta": {
                    "title": "User Management Console",
                    "description": "Update profile, security, and access rights.",
                    "submit_label": "Save Changes",
                    "layout": "TABS",
                    "tabs": [
                        {
                            "key": "profile",
                            "label": "Profile", # ⚡ REMOVED EMOJI
                            "fields": ["full_name", "phone", "department"]
                        },
                        {
                            "key": "security",
                            "label": "Security", # ⚡ REMOVED EMOJI
                            "fields": ["email", "password_status", "trigger_reset"]
                        },
                        {
                            "key": "governance",
                            "label": "Governance", # ⚡ REMOVED EMOJI
                            "fields": ["role", "status", "audit_log"],
                            "policy": "ADMIN_ONLY"
                        }
                    ],
                    "form_schema": [
                        # --- TAB 1: PROFILE ---
                        {
                            "name": "full_name",
                            "label": "Full Name",
                            "component": "TEXT_INPUT",
                            "required": True,
                            "width": "lg"
                        },
                        {
                            "name": "phone",
                            "label": "Phone Number",
                            "component": "TEXT_INPUT",
                            "width": "md"
                        },
                        {
                            "name": "department",
                            "label": "Department",
                            "component": "SELECT_DROPDOWN",
                            "options": [{"label": "Engineering", "value": "ENG"}, {"label": "Sales", "value": "SALES"}],
                            "width": "md"
                        },

                        # --- TAB 2: SECURITY ---
                        {
                            "name": "email",
                            "label": "Identity (Email)",
                            "component": "TEXT_INPUT",
                            "fieldProps": { "readonly": True, "prefix": "[LOCK]" }, # ⚡ REPLACED EMOJI WITH TEXT
                            "tooltip": "Identity is immutable. Contact IT to migrate.",
                            "width": "lg"
                        },
                        {
                            "name": "password_status",
                            "label": "Credential Status",
                            "component": "DESCRIPTION_LIST",
                            "fieldProps": { "value": "Set (Last changed 30 days ago)" }
                        },
                        {
                            "name": "trigger_reset",
                            "label": "Actions",
                            "component": "ACTION_BUTTON",
                            "fieldProps": {
                                "label": "Manage Credentials",
                                "icon": "antd:KeyOutlined",
                                "action_type": "WIZARD",
                                "target_scope": "PASSWORD_RESET"
                            }
                        },

                        # --- TAB 3: GOVERNANCE ---
                        {
                            "name": "role",
                            "label": "System Role",
                            "component": "SELECT_DROPDOWN",
                            "options": [
                                {"label": "Administrator (Full Access)", "value": "admin"},
                                {"label": "Standard User", "value": "user"}
                            ],
                            "required": True,
                            "tooltip": "Admins can delete system resources." # ⚡ REMOVED WARNING EMOJI
                        },
                        {
                            "name": "status",
                            "label": "Account Status",
                            "component": "SELECT_DROPDOWN",
                            "options": [
                                {"label": "Active", "value": "ACTIVE"}, # ⚡ REMOVED DOT EMOJI
                                {"label": "Suspended", "value": "SUSPENDED"} # ⚡ REMOVED DOT EMOJI
                            ],
                            "required": True,
                            "tooltip": "Suspending will kill active sessions immediately."
                        }
                    ]
                },
                "on": {
                    "SUBMIT": "complete"
                }
            },
            "complete": {
                "type": "final"
            }
        }
    }
}