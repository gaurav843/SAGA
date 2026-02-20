# FILEPATH: backend/app/domains/auth/features/preferences/seeds.py
# @file: Preference Schema Seeder
# @role ⚙️ Data Hydration
# @author: The Engineer
# @description: Registers the Virtual Attributes for User Preferences.
# These attributes map JSONB keys to Meta-Kernel Widgets.
# @security-level LEVEL 9 (System Locked)
# @updated Fixed Enum Attributes to match 'core.meta.constants.WidgetType'.

import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.meta.models import AttributeDefinition
from app.core.meta.constants import AttributeType, WidgetType

logger = logging.getLogger("auth.features.preferences.seeds")

# ⚡ THE CONTRACT: Defines the structure of the 'preferences' JSONB column
# These fields will appear in the Dictionary UI as locked system fields.
PREFERENCE_ATTRIBUTES = [
    # --- 1. VISUALS ---
    {
        "key": "theme.mode",
        "label": "Theme Mode",
        "data_type": AttributeType.SELECT,
        "widget_type": WidgetType.DROPDOWN, # ⚡ FIX: Was SELECT
        "configuration": {
            "options": [
                {"label": "System Sync", "value": "system"},
                {"label": "Light Mode", "value": "light"},
                {"label": "Dark Mode", "value": "dark"}
            ],
            "default_value": "system"
        },
        "description": "Controls the base brightness of the interface."
    },
    {
        "key": "theme.preset",
        "label": "Color Theme",
        "data_type": AttributeType.SELECT,
        "widget_type": WidgetType.DROPDOWN, # ⚡ FIX: Was SELECT
        "configuration": {
            "options": [
                {"label": "Void (Deep Dark)", "value": "void"},
                {"label": "Polar (Clean Light)", "value": "polar"},
                {"label": "Midnight (Developer)", "value": "midnight"},
                {"label": "Enterprise (SaaS)", "value": "enterprise"},
                {"label": "Cyberpunk (Neon)", "value": "cyberpunk"}
            ],
            "default_value": "void"
        },
        "description": "The color palette used across the application."
    },
    {
        "key": "theme.primary_color",
        "label": "Accent Color",
        "data_type": AttributeType.TEXT,
        "widget_type": WidgetType.COLOR, 
        "configuration": {
            "default_value": "#00e676"
        },
        "description": "The brand color used for buttons and active states."
    },
    {
        "key": "layout.density",
        "label": "Information Density",
        "data_type": AttributeType.SELECT,
        "widget_type": WidgetType.RADIO_GROUP, # ⚡ FIX: SEGMENTED not in Python Enum
        "configuration": {
            "options": [
                {"label": "Comfortable", "value": "comfortable"},
                {"label": "Compact", "value": "compact"}
            ],
            "default_value": "comfortable"
        },
        "description": "Controls spacing and padding in lists and grids."
    },
    {
        "key": "layout.sidebar_collapsed",
        "label": "Default Sidebar State",
        "data_type": AttributeType.BOOLEAN,
        "widget_type": WidgetType.SWITCH,
        "configuration": {
            "default_value": False
        },
        "description": "If enabled, the sidebar starts collapsed."
    },

    # --- 2. REGIONAL / I18N ---
    {
        "key": "localization.timezone",
        "label": "Time Zone",
        "data_type": AttributeType.SELECT,
        "widget_type": WidgetType.AUTOCOMPLETE,
        "configuration": {
            # In a real app, we'd load this from a library like 'pytz'
            "options": [
                {"label": "UTC (Universal)", "value": "UTC"},
                {"label": "America/New_York (EST)", "value": "America/New_York"},
                {"label": "America/Los_Angeles (EST)", "value": "America/Los_Angeles"},
                {"label": "Europe/London (GMT)", "value": "Europe/London"},
                {"label": "Asia/Kolkata (IST)", "value": "Asia/Kolkata"},
                {"label": "Asia/Tokyo (JST)", "value": "Asia/Tokyo"}
            ],
            "default_value": "UTC"
        },
        "description": "Used to calculate local times for display."
    },
    {
        "key": "localization.language",
        "label": "Language (Locale)",
        "data_type": AttributeType.SELECT,
        "widget_type": WidgetType.DROPDOWN, # ⚡ FIX: Was SELECT
        "configuration": {
            "options": [
                {"label": "English (US)", "value": "en-US"},
                {"label": "Spanish (ES)", "value": "es-ES"},
                {"label": "German (DE)", "value": "de-DE"},
                {"label": "French (FR)", "value": "fr-FR"}
            ],
            "default_value": "en-US"
        },
        "description": "The language for UI labels and messages."
    },
    {
        "key": "localization.date_format",
        "label": "Date Format",
        "data_type": AttributeType.SELECT,
        "widget_type": WidgetType.DROPDOWN, # ⚡ FIX: Was SELECT
        "configuration": {
            "options": [
                {"label": "ISO 8601 (YYYY-MM-DD)", "value": "YYYY-MM-DD"},
                {"label": "European (DD/MM/YYYY)", "value": "DD/MM/YYYY"},
                {"label": "American (MM/DD/YYYY)", "value": "MM/DD/YYYY"}
            ],
            "default_value": "YYYY-MM-DD"
        },
        "description": "Preferred format for displaying dates."
    },
    {
        "key": "localization.number_format",
        "label": "Number Format",
        "data_type": AttributeType.SELECT,
        "widget_type": WidgetType.DROPDOWN, # ⚡ FIX: Was SELECT
        "configuration": {
            "options": [
                {"label": "1,234.56 (Dot Decimal)", "value": "dot"},
                {"label": "1.234,56 (Comma Decimal)", "value": "comma"}
            ],
            "default_value": "dot"
        },
        "description": "Decimal and thousands separators."
    },

    # --- 3. NOTIFICATIONS ---
    {
        "key": "notifications.email_digest",
        "label": "Daily Email Digest",
        "data_type": AttributeType.BOOLEAN,
        "widget_type": WidgetType.SWITCH,
        "configuration": {
            "default_value": True
        },
        "description": "Receive a summary of activity every morning."
    },
    {
        "key": "notifications.workflow_alerts",
        "label": "Workflow Alerts",
        "data_type": AttributeType.BOOLEAN,
        "widget_type": WidgetType.SWITCH,
        "configuration": {
            "default_value": True
        },
        "description": "Receive real-time alerts for assigned workflow steps."
    }
]

async def seed_preferences_schema(db: AsyncSession):
    """
    Idempotent seeder for User Preference Attributes.
    """
    domain_key = "USER_PREFS"
    logger.info(f"🎨 [Preferences] Seeding Virtual Schema for {domain_key}...")
    
    count = 0
    for attr in PREFERENCE_ATTRIBUTES:
        # Check existence
        stmt = select(AttributeDefinition).where(
            AttributeDefinition.domain == domain_key,
            AttributeDefinition.key == attr["key"]
        )
        existing = (await db.execute(stmt)).scalars().first()
        
        if not existing:
            new_attr = AttributeDefinition(
                domain=domain_key,
                key=attr["key"],
                label=attr["label"],
                description=attr["description"],
                data_type=attr["data_type"],
                widget_type=attr["widget_type"],
                configuration=attr["configuration"],
                is_system=True,   # 🔒 LOCK IT
                is_required=False,
                is_active=True
            )
            db.add(new_attr)
            count += 1
            logger.debug(f"   ↳ Defined: {attr['key']}")
    
    if count > 0:
        await db.commit()
        logger.info(f"✅ [Preferences] Created {count} System Attributes.")
    else:
        logger.info(f"✨ [Preferences] Schema up to date.")

