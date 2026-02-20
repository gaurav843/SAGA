# FILEPATH: backend/app/domains/auth/workflows/user_create.py
# @file: User Creation Wizard (Admin Context)
# @author: The Engineer
# @description: Dedicated flow for Admins to create new users.
# @security-level: LEVEL 9 (Registry Aligned)
# @invariant: Uses Standard Library Keys (TEXT_INPUT, SECURE_PASSWORD).

from typing import Dict, Any

USER_CREATE: Dict[str, Any] = {
    "key": "USER_CREATE",
    "label": "Create User",
    "type": "WIZARD",
    "mode": "CREATE", 
    "target_field": None,
    "config": {
        "id": "user_create_flow",
        "initial": "account_setup",
        "states": {
            "account_setup": {
                "meta": {
                    "title": "New User Registration",
                    "description": "Create a new identity in the system.",
                    "submit_label": "Validate & Submit", # ⚡ NEW: Overrides "Next Step"
                    "form_schema": [
                        # --- IDENTITY ---
                        {
                            "name": "email",
                            "label": "Email Address",
                            "component": "TEXT_INPUT",
                            "required": True,
                            "rules": [
                                {"required": True, "message": "Email is required"},
                                {"type": "email", "message": "Invalid email format"},
                                {
                                    "validator": "checkUniqueness", 
                                    "field": "email", 
                                    "domain": "USER",
                                    "message": "This email is already in use."
                                }
                            ]
                        },
                        {
                            "name": "password",
                            "label": "Initial Password",
                            "component": "SECURE_PASSWORD",
                            "required": True,
                            "tooltip": "Must be at least 8 characters. Click 'Generate' to create a strong key.",
                            "fieldProps": {
                                "showStrength": True,
                                "allowGenerate": True
                            },
                            "rules": [{"min": 8, "message": "Min 8 characters"}]
                        },
                        {
                            "name": "full_name",
                            "label": "Full Name",
                            "component": "TEXT_INPUT",
                            "required": True
                        },
                        
                        # --- GOVERNANCE ---
                        {
                            "name": "role",
                            "label": "System Role",
                            "component": "SELECT_DROPDOWN",
                            "options": [
                                {"label": "Administrator", "value": "admin"},
                                {"label": "User", "value": "user"},
                                {"label": "Operator", "value": "operator"}
                            ],
                            "initialValue": "user",
                            "required": True
                        },
                        {
                            "name": "is_active",
                            "label": "Activate Immediately",
                            "component": "BOOLEAN_SWITCH",
                            "initialValue": True
                        }
                    ]
                },
                "on": {
                    "CREATE": "complete"
                }
            },
            "complete": {
                "type": "final"
            }
        }
    }
}

