# FILEPATH: backend/app/domains/auth/workflows/signup.py
# @file Sign Up Wizard Definition
# @author The Engineer
# @description The Logic and Interface for New User Registration.
#              UPDATED: Added 'checkUniqueness' validator for Email.

from typing import Dict, Any

# ⚡ CONVENTION: The Variable Name matches the Scope Key
SIGNUP_FLOW: Dict[str, Any] = {
    "key": "SIGNUP_FLOW",
    "label": "Sign Up Wizard",
    "type": "WIZARD",
    "target_field": None, # Wizards often don't govern a single field
    "mode": "CREATE",
    "config": {
        "id": "signup_flow",
        "initial": "credentials",
        "states": {
            "credentials": {
                "meta": {
                    "title": "Create Account",
                    "description": "Enter your login details.",
                    "form_schema": [
                        {
                            "name": "email", 
                            "component": "ProFormText", 
                            "label": "Email Address", 
                            "required": True,
                            "placeholder": "you@company.com",
                            # ⚡ VALIDATION RULES
                            "rules": [
                                {"required": True, "message": "Email is required"},
                                {"type": "email", "message": "Please enter a valid email"},
                                # 🔍 ASYNC CHECK: Prevents duplicates PROACTIVELY
                                {
                                    "validator": "checkUniqueness",
                                    "field": "email",
                                    "message": "This email is already registered."
                                }
                            ]
                        },
                        {
                            "name": "password", 
                            "component": "ProFormText.Password", 
                            "label": "Secure Password", 
                            "required": True,
                            # ⚡ PASSWORD POLICY
                            "rules": [
                                {"required": True, "message": "Password is required"},
                                {"min": 8, "message": "Must be at least 8 characters long"}
                            ]
                        }
                    ]
                },
                "on": {"NEXT": "profile"}
            },
            "profile": {
                "meta": {
                    "title": "Your Profile",
                    "description": "Tell us who you are.",
                    "form_schema": [
                        {
                            "name": "full_name", 
                            "component": "ProFormText", 
                            "label": "Full Name", 
                            "required": True
                        },
                        {
                            "name": "phone", 
                            "component": "ProFormText", 
                            "label": "Phone Number (Optional)",
                            "rules": [
                                {"pattern": "^[0-9]*$", "message": "Numbers only"}
                            ]
                        }
                    ]
                },
                "on": {"NEXT": "terms"}
            },
            "terms": {
                "meta": {
                    "title": "Final Review",
                    "description": "Review legal terms.",
                    "form_schema": [
                        {
                            "name": "agreed_to_terms", 
                            "component": "ProFormCheckbox", 
                            "label": "I agree to the Terms of Service", 
                            "required": True
                        }
                    ]
                },
                "on": {"NEXT": "complete"}
            },
            "complete": {
                "type": "final"
            }
        }
    }
}

