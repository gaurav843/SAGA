# FILEPATH: backend/app/core/meta/features/widgets/seeds/__init__.py
# @file: Widget Registry Aggregator
# @author: The Engineer (ansav8@gmail.com)
# @description: Merges Atoms, Molecules, and Structures into a unified Manifest.
# @security-level: LEVEL 9 (Composition)

import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.meta.features.widgets.models import WidgetDefinition
from app.core.meta.features.widgets.schemas import WidgetCreate
from app.core.meta.features.widgets.service import WidgetService

# ⚡ FRACTAL IMPORTS
# These assume you have created atoms.py, molecules.py, and structures.py in this folder.
from .atoms import WIDGETS_ATOMS
from .molecules import WIDGETS_MOLECULES
from .structures import WIDGETS_STRUCTURES

logger = logging.getLogger("core.meta.widgets.seeds")

# ==============================================================================
#  GLOBAL SCHEMA MIXINS (The Level 9 Capabilities)
# ==============================================================================
# These props are injected into EVERY widget to support the Logic Engine & Layouts.
COMMON_PROPS = {
    "dependencies": {"type": "array", "items": {"type": "string"}, "description": "Fields to watch for changes"},
    "show_if": {"type": "string", "description": "JMESPath expression for visibility"},
    "disabled_if": {"type": "string", "description": "JMESPath expression for disabled state"},
    "addonBefore": {"type": "string", "description": "Text or Icon prefix"},
    "addonAfter": {"type": "string", "description": "Text or Icon suffix"},
    "tooltip": {"type": "string", "description": "Help text"},
    "width": {"type": "string", "enum": ["xs", "sm", "md", "lg", "xl"], "default": "md"}
}

async def seed_widgets(db: AsyncSession):
    """
    Hydrates the Widget Registry from the Fractal Manifests.
    """
    # 1. Merge Manifests
    FULL_LIBRARY = WIDGETS_ATOMS + WIDGETS_MOLECULES + WIDGETS_STRUCTURES
    
    logger.info(f"🧱 [WidgetRegistry] Seeding {len(FULL_LIBRARY)} Widgets from 3 fractals...")

    count = 0
    for widget_data in FULL_LIBRARY:
        try:
            # ⚡ SAFETY CHECK: Ensure critical keys exist to prevent 'NoneType' errors
            if not widget_data.get("key"):
                logger.warning(f"⚠️ [Widget] Skipping invalid entry (Missing Key): {widget_data}")
                continue
                
            # FIX: Ensure name is a string, not None
            if not widget_data.get("name"):
                 # Fallback to key if name is missing
                 widget_data["name"] = widget_data["key"].replace("_", " ").title()

            # 2. Inject Capabilities (Level 9 Logic)
            # Ensure props_schema structure exists before updating
            if "props_schema" not in widget_data or widget_data["props_schema"] is None:
                widget_data["props_schema"] = {"type": "object", "properties": {}}
            
            if "properties" not in widget_data["props_schema"]:
                 widget_data["props_schema"]["properties"] = {}
                
            # Deep merge common props
            widget_data["props_schema"]["properties"].update(COMMON_PROPS)

            # 3. Idempotency Check
            stmt = select(WidgetDefinition).where(
                WidgetDefinition.key == widget_data["key"],
                WidgetDefinition.is_latest == True
            )
            existing = await db.execute(stmt)
            if existing.scalars().first():
                continue

            # 4. Register
            payload = WidgetCreate(**widget_data)
            await WidgetService.register_widget(db, payload)
            count += 1
            
        except Exception as e:
            # ⚡ ERROR TRAP: Catch specific failures to prevent full seed crash
            logger.error(f"   ❌ [Widget] Failed to seed {widget_data.get('key', 'UNKNOWN')}: {e}")

    if count > 0:
        logger.info(f"✨ [WidgetRegistry] Planted {count} new widgets.")
    else:
        logger.info("✨ [WidgetRegistry] Library is up to date.")

