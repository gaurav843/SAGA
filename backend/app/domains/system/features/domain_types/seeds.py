# FILEPATH: backend/app/domains/system/features/domain_types/seeds.py
# @file: Domain Type Seeder (Factory Settings v2.0)
# @role: ⚙️ Data Hydration
# @author: The Engineer (ansav8@gmail.com)
# @description: Injects the Immutable Domain Types into the Kernel.
# @security-level: LEVEL 9 (System Critical)
# @updated: Injected 'entity_label' to completely eradicate frontend/backend hardcoding.

import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert

from app.domains.system.features.domain_types.models import KernelDomainType

logger = logging.getLogger("system.features.domain_types.seeds")

# ⚡ THE IMMUTABLE LAWS
# This defines the capability matrix for the OS.
CONST_DOMAIN_TYPES = [
    {
        "key": "STANDARD",
        "label": "Business Entity",
        "description": "Standard SQLAlchemy Model with Database Table and CRUD API.",
        "properties": {
            "storage_strategy": "TABLE",
            "api_strategy": "CRUD",
            "supports_meta": True,      # Can have custom_attributes
            "supports_activity": True,  # Logs changes to Audit Log
            "admin_route": "/meta/dictionary",
            "entity_icon": "antd:DatabaseOutlined",
            "entity_label": "Data Dictionary", # ⚡ SSOT INJECTION
            "entity_description": "Primary Relational Data Storage",
            "display_weight": 50        # Sorts lower in the tree
        }
    },
    {
        "key": "CONFIG",
        "label": "Configuration Store",
        "description": "Key-Value store backed by SystemConfig table.",
        "properties": {
            "storage_strategy": "KV_STORE",
            "api_strategy": "REFLECT",  # API reflects keys, doesn't allow arbitrary inserts
            "supports_meta": False,
            "supports_activity": True,
            "admin_route": "/meta/dictionary",
            "entity_icon": "antd:HddOutlined",
            "entity_label": "Settings & Config", # ⚡ SSOT INJECTION
            "entity_description": "Key-Value Store Configuration",
            "display_weight": 40
        }
    },
    {
        "key": "SYSTEM",
        "label": "System Internal",
        "description": "Hardcoded Kernel Logic. Read-Only / Monitoring.",
        "properties": {
            "storage_strategy": "NONE", # Logic-only (or hybrid)
            "api_strategy": "READ_ONLY",
            "supports_meta": False,
            "supports_activity": False,
            "admin_route": None,
            "entity_icon": None,
            "entity_label": "System Logic", # ⚡ SSOT INJECTION
            "entity_description": "Internal System Logic",
            "display_weight": 0         # ⚡ ALERTS UI TO ALWAYS SORT TO THE TOP
        }
    },
    {
        "key": "VIRTUAL",
        "label": "Virtual Aggregator",
        "description": "UI-Only container for dashboards or menus. No backend persistence.",
        "properties": {
            "storage_strategy": "NONE",
            "api_strategy": "NONE",
            "supports_meta": False,
            "supports_activity": False,
            "admin_route": None,
            "entity_icon": None,
            "entity_label": "Virtual Node", # ⚡ SSOT INJECTION
            "entity_description": "Virtual Layout Container",
            "display_weight": 10
        }
    },
    # ⚡ CORE INFRASTRUCTURE
    {
        "key": "CORE",
        "label": "Core Infrastructure",
        "description": "Critical system tables (Policies, Views) that support CRUD but forbid custom attributes.",
        "properties": {
            "storage_strategy": "TABLE",
            "api_strategy": "CRUD",
            "supports_meta": False,     # ⚡ PREVENTS RECURSION
            "supports_activity": True,  # ⚡ ENABLES CDC
            "admin_route": "/meta/dictionary",
            "entity_icon": "antd:DatabaseOutlined",
            "entity_label": "Core Tables", # ⚡ SSOT INJECTION
            "entity_description": "Core Infrastructure Table",
            "display_weight": 20
        }
    }
]

async def seed_domain_types(db: AsyncSession):
    """
    @description: Idempotent seeder for Kernel Domain Types.
                  Ensures the OS knows how to handle different module classes.
    @invariant: Updates existing types if properties change (Schema Evolution).
    """
    logger.info("🧬 [Kernel] Seeding Domain DNA (Types)...")
    
    count = 0
    for dtype in CONST_DOMAIN_TYPES:
        # Upsert Logic: Insert or Update if exists
        stmt = insert(KernelDomainType).values(
            key=dtype["key"],
            label=dtype["label"],
            description=dtype["description"],
            properties=dtype["properties"]
        ).on_conflict_do_update(
            index_elements=['key'],
            set_={
                "label": dtype["label"],
                "description": dtype["description"],
                "properties": dtype["properties"]
            }
        )

        await db.execute(stmt)
        count += 1
        
    await db.commit()
    logger.info(f"✅ [Kernel] DNA Synthesized. {count} Types Active.")

