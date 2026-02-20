# FILEPATH: backend/app/domains/system/seeds.py
# @file: System Domain Seeder (The Constitution)
# @author: The Engineer (ansav8@gmail.com)
# @description: Seeds the "Immutable Laws", "Core Bricks", and "Navigation" of the OS.
# @security-level: LEVEL 9 (Registry Aligned)
# @invariant: Operations must be idempotent.
# @updated: Wired 'seed_navigation' to ensure UI Shell hydration.

import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Meta Models
from app.core.meta.models import PolicyDefinition
from app.core.meta.constants import PolicyResolutionStrategy, RuleActionType

# System Models (For Brick Registration)
from app.domains.system.models import KernelDomain, KernelScope

# ⚡ META-KERNEL SEEDERS
from app.core.meta.features.states.seeds import seed_workflow_types

# ⚡ FRACTAL SEEDERS (Feature Modules)
from app.domains.system.features.navigation.seeds import seed_navigation

logger = logging.getLogger("flodock.domains.system.seeds")

# ==============================================================================
#  THE LAWS (Policy Definitions)
#  The System defines these, but does NOT bind them to specific domains.
# ==============================================================================
CONST_POLICIES = [
    {
        "key": "sys_root_integrity_v1",
        "name": "Root Account Integrity Protocol",
        "description": "Enforces that all System Users (Bots) must possess Admin privileges.",
        "resolution": PolicyResolutionStrategy.ALL_MUST_PASS,
        "rules": [
            {
                "logic": "host.is_system_user && host.role != 'admin'",
                "action": RuleActionType.BLOCK,
                "message": "[BLOCK] SECURITY VIOLATION: System Service Accounts must have 'admin' role."
            }
        ]
    },
    {
        "key": "sys_data_hygiene_v1",
        "name": "Global Data Hygiene",
        "description": "Ensures no critical entities are created with placeholder text.",
        "resolution": PolicyResolutionStrategy.AT_LEAST_ONE, 
        "rules": [
            {
                "logic": "contains(host.email, '@example.com') || contains(host.email, 'test')",
                "action": RuleActionType.WARN, 
                "message": "[WARN] DATA QUALITY: Please use real corporate email addresses."
            }
        ]
    }
]

# ==============================================================================
#  THE SYSTEM BRICKS (Core Scopes)
# ==============================================================================
CONST_SYSTEM_DOMAIN = {
    "key": "SYS",
    "label": "System Internals",
    "is_virtual": True,
    "module_icon": "antd:SettingOutlined" # ⚡ THE FIX: Ensures DB is populated
}

CONST_SYSTEM_SCOPES = [
    {
        "key": "CONTAINER",
        "label": "Menu Group",
        "type": "CONTAINER",
        "target_field": None,
        "config": {
            "icon": "antd:FolderOutlined",
            "description": "A visual container for grouping other apps."
        }
    }
]

# --- WAVE 1: STATIC DEFINITIONS ---
async def seed_static(db: AsyncSession):
    """
    @description: Writes the Constitution, Core Bricks, and UI Shell to the Meta-Kernel.
    """
    logger.info("   📜 [System] Ratifying the Constitution (Policies)...")
    
    # 1. Seed Policies
    for p_def in CONST_POLICIES:
        stmt = select(PolicyDefinition).where(PolicyDefinition.key == p_def["key"])
        existing = await db.execute(stmt)
        if existing.scalars().first():
            continue

        policy = PolicyDefinition(
            key=p_def["key"],
            name=p_def["name"],
            description=p_def["description"],
            resolution=p_def["resolution"],
            rules=p_def["rules"],
            is_active=True
        )
        db.add(policy)
        logger.info(f"      [LAW] Ratified: {p_def['key']}")

    await db.commit() 
    
    # 2. Seed System Domain & Bricks
    logger.info("   🧱 [System] Registering Core Bricks...")
    
    # Ensure SYS Domain
    stmt_dom = select(KernelDomain).where(KernelDomain.key == CONST_SYSTEM_DOMAIN["key"])
    res_dom = await db.execute(stmt_dom)
    if not res_dom.scalars().first():
        sys_domain = KernelDomain(
            key=CONST_SYSTEM_DOMAIN["key"],
            label=CONST_SYSTEM_DOMAIN["label"],
            is_virtual=CONST_SYSTEM_DOMAIN["is_virtual"],
            module_icon=CONST_SYSTEM_DOMAIN["module_icon"],
            type_key="SYSTEM"
        )
        db.add(sys_domain)
        logger.info(f"      [DOMAIN] Registered: {CONST_SYSTEM_DOMAIN['key']}")
        await db.commit()

    # Ensure SYS Scopes
    for s_def in CONST_SYSTEM_SCOPES:
        stmt_scope = select(KernelScope).where(
            KernelScope.domain_key == CONST_SYSTEM_DOMAIN["key"],
            KernelScope.key == s_def["key"]
        )
        res_scope = await db.execute(stmt_scope)
        if not res_scope.scalars().first():
            scope = KernelScope(
                domain_key=CONST_SYSTEM_DOMAIN["key"],
                key=s_def["key"],
                label=s_def["label"],
                type=s_def["type"],
                target_field=s_def["target_field"],
                config=s_def["config"]
            )
            db.add(scope)
            logger.info(f"      [BRICK] Registered: {s_def['key']}")
    
    await db.commit()

    # 3. ⚡ HYDRATE WORKFLOW TYPES (State Engine V3)
    try:
        await seed_workflow_types(db)
    except Exception as e:
        logger.error(f"🔥 [System] Workflow Type Seeding Failed: {e}")

    # 4. ⚡ HYDRATE NAVIGATION (Fractal UI Shell)
    # This ensures the Sidebar and Avatar Menu are populated on boot.
    try:
        await seed_navigation(db)
    except Exception as e:
        logger.error(f"🔥 [System] Navigation Seeding Failed: {e}")

# --- WAVE 2: ASSETS ---
async def seed_assets(db: AsyncSession):
    pass 

# --- WAVE 3: HISTORY ---
async def seed_history(db: AsyncSession):
    pass

