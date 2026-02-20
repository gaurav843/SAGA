# FILEPATH: backend/app/domains/auth/features/preferences/workflows.py
# @file: User Settings Workflow (High-Fidelity)
# @author: The Sovereign Engineer
# @description: Defines the configuration wizard for User Preferences with Rich UI components.
# @security-level: LEVEL 9 (Strict Schema)

from typing import Dict, Any

USER_SETTINGS: Dict[str, Any] = {
    "key": "USER_SETTINGS",
    "label": "User Settings",
    "type": "WIZARD",
    "mode": "EDIT",
    "target_field": "virtual", # Virtual field as preferences are JSONB sidecar
    "config": {
        "id": "user_settings_flow",
        "initial": "settings_view",
        "states": {
            "settings_view": {
                "meta": {
                    "title": "My Preferences",
                    "description": "Customize your workspace experience.",
                    "submit_label": "Save Preferences",
                    "layout": "TABS",
                    "tabs": [
                        {
                            "key": "appearance",
                            "label": "Appearance",
                            "icon": "antd:BgColorsOutlined",
                            "fields": ["theme.mode", "theme.preset", "theme.primary_color"]
                        },
                        {
                            "key": "workspace",
                            "label": "Workspace",
                            "icon": "antd:LayoutOutlined",
                            "fields": ["layout.density", "layout.sidebar_collapsed"]
                        },
                        {
                            "key": "localization",
                            "label": "Localization",
                            "icon": "antd:GlobalOutlined",
                            "fields": ["localization.language", "localization.timezone", "localization.date_format", "localization.number_format"]
                        },
                        {
                            "key": "notifications",
                            "label": "Notifications",
                            "icon": "antd:BellOutlined",
                            "fields": ["notifications.email_digest", "notifications.workflow_alerts"]
                        }
                    ],
                    "form_schema": [
                        # --- TAB 1: APPEARANCE ---
                        {
                            "component": "SECTION",
                            "title": "Visual Theme",
                            "children": [
                                {
                                    "name": "theme.mode",
                                    "label": "Brightness",
                                    "component": "RADIO_GROUP", # ⚡ UPGRADE: Better than Select
                                    "width": "md",
                                    "options": [
                                        {"label": "System Sync", "value": "system"},
                                        {"label": "Light", "value": "light"},
                                        {"label": "Dark", "value": "dark"}
                                    ],
                                    "fieldProps": { "readonly": False, "buttonStyle": "solid" }
                                },
                                {
                                    "component": "GROUP",
                                    "fieldProps": { "direction": "horizontal" },
                                    "children": [
                                        {
                                            "name": "theme.preset",
                                            "label": "Color Theme",
                                            "component": "SELECT_DROPDOWN",
                                            "width": "md",
                                            "options": [
                                                {"label": "Void (Deep Dark)", "value": "void"},
                                                {"label": "Polar (Clean Light)", "value": "polar"},
                                                {"label": "Midnight (Developer)", "value": "midnight"},
                                                {"label": "Enterprise (SaaS)", "value": "enterprise"},
                                                {"label": "Cyberpunk (Neon)", "value": "cyberpunk"}
                                            ],
                                            "fieldProps": { "readonly": False }
                                        },
                                        {
                                            "name": "theme.primary_color",
                                            "label": "Accent Color",
                                            "component": "COLOR_PICKER", # ⚡ UPGRADE: Rich Component
                                            "width": "sm",
                                            "fieldProps": { "readonly": False, "showText": True }
                                        }
                                    ]
                                }
                            ]
                        },

                        # --- TAB 2: WORKSPACE ---
                        {
                            "name": "layout.density",
                            "label": "Information Density",
                            "component": "SEGMENTED_CONTROL", # ⚡ UPGRADE: Best for binary/ternary choice
                            "width": "md",
                            "options": [
                                {"label": "Comfortable", "value": "comfortable"},
                                {"label": "Compact", "value": "compact"}
                            ],
                            "fieldProps": { "readonly": False }
                        },
                        {
                            "name": "layout.sidebar_collapsed",
                            "label": "Default Sidebar State",
                            "component": "BOOLEAN_SWITCH",
                            "width": "sm",
                            "fieldProps": {
                                "readonly": False,
                                "checkedChildren": "Collapsed",
                                "unCheckedChildren": "Expanded"
                            }
                        },

                        # --- TAB 3: LOCALIZATION ---
                        {
                            "component": "GROUP",
                            "fieldProps": { "direction": "horizontal" },
                            "children": [
                                {
                                    "name": "localization.language",
                                    "label": "Language",
                                    "component": "SELECT_DROPDOWN",
                                    "width": "sm",
                                    "options": [
                                        {"label": "English (US)", "value": "en-US"},
                                        {"label": "Spanish (ES)", "value": "es-ES"},
                                        {"label": "German (DE)", "value": "de-DE"},
                                        {"label": "French (FR)", "value": "fr-FR"}
                                    ],
                                    "fieldProps": { "readonly": False }
                                },
                                {
                                    "name": "localization.timezone",
                                    "label": "Time Zone",
                                    "component": "SELECT_DROPDOWN", # ⚡ Note: In production, use AUTOCOMPLETE
                                    "width": "md",
                                    "options": [
                                        {"label": "UTC (Universal)", "value": "UTC"},
                                        {"label": "America/New_York (EST)", "value": "America/New_York"},
                                        {"label": "America/Los_Angeles (PST)", "value": "America/Los_Angeles"},
                                        {"label": "Europe/London (GMT)", "value": "Europe/London"},
                                        {"label": "Asia/Kolkata (IST)", "value": "Asia/Kolkata"},
                                        {"label": "Asia/Tokyo (JST)", "value": "Asia/Tokyo"}
                                    ],
                                    "fieldProps": { "readonly": False, "showSearch": True }
                                }
                            ]
                        },
                        {
                            "component": "GROUP",
                            "fieldProps": { "direction": "horizontal" },
                            "children": [
                                {
                                    "name": "localization.date_format",
                                    "label": "Date Format",
                                    "component": "SELECT_DROPDOWN",
                                    "width": "sm",
                                    "options": [
                                        {"label": "ISO 8601 (YYYY-MM-DD)", "value": "YYYY-MM-DD"},
                                        {"label": "European (DD/MM/YYYY)", "value": "DD/MM/YYYY"},
                                        {"label": "American (MM/DD/YYYY)", "value": "MM/DD/YYYY"}
                                    ],
                                    "fieldProps": { "readonly": False }
                                },
                                {
                                    "name": "localization.number_format",
                                    "label": "Number Format",
                                    "component": "SELECT_DROPDOWN",
                                    "width": "sm",
                                    "options": [
                                        {"label": "1,234.56 (Dot Decimal)", "value": "dot"},
                                        {"label": "1.234,56 (Comma Decimal)", "value": "comma"}
                                    ],
                                    "fieldProps": { "readonly": False }
                                }
                            ]
                        },

                        # --- TAB 4: NOTIFICATIONS ---
                        {
                            "component": "SECTION",
                            "title": "Email & Alerts",
                            "children": [
                                {
                                    "name": "notifications.email_digest",
                                    "label": "Daily Email Digest",
                                    "component": "BOOLEAN_SWITCH",
                                    "width": "full",
                                    "fieldProps": { "readonly": False }
                                },
                                {
                                    "name": "notifications.workflow_alerts",
                                    "label": "Real-time Workflow Alerts",
                                    "component": "BOOLEAN_SWITCH",
                                    "width": "full",
                                    "fieldProps": { "readonly": False }
                                }
                            ]
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

