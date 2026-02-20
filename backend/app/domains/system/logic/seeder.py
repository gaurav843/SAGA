# FILEPATH: backend/app/domains/system/logic/seeder.py
# @file: System Factory Settings (Self-Assembling v4.2)
# @author: The Engineer (ansav8@gmail.com)
# @description: Auto-Seeds Configuration, Widgets, and Circuit Breakers.
# @updated: Integrated 'seed_widgets' to hydrate the Meta-Kernel Library.

import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.system.models import SystemConfig
from app.domains.system.logic.hypervisor import SystemHypervisor
from app.core.kernel.registry import domain_registry
from app.domains.workspace.service import WorkspaceService

# ⚡ META-KERNEL SEEDERS
from app.core.meta.features.widgets.seeds import seed_widgets

logger = logging.getLogger("domains.system.seeder")

DEFAULT_CONFIGS = [
    {
        "key": "MAINTENANCE_MODE",
        "value_raw": "false",
        "value_type": "BOOLEAN",
        "category": "SECURITY",
        "label": "Maintenance Mode",
        "description": "If enabled, blocks all non-admin API traffic with a 503 error."
    },
    {
        "key": "ALLOW_REGISTRATION",
        "value_raw": "true",
        "value_type": "BOOLEAN",
        "category": "ACCESS",
        "label": "Allow Signups",
        "description": "Controls visibility of the 'Sign Up' button on the login screen."
    },
    {
        "key": "SYSTEM_BANNER",
        "value_raw": "",
        "value_type": "STRING",
        "category": "UX",
        "label": "Global Announcement",
        "description": "A message displayed to all users (e.g. 'Scheduled Downtime at 10pm'). Leave empty to hide."
    },
    {
        "key": "SESSION_TIMEOUT_MIN",
        "value_raw": "60",
        "value_type": "NUMBER",
        "category": "SECURITY",
        "label": "Session Timeout",
        "description": "Minutes of inactivity before forced logout."
    },
    {
        "key": "MAX_UPLOAD_MB",
        "value_raw": "10",
        "value_type": "NUMBER",
        "category": "PERFORMANCE",
        "label": "Max Upload Size (MB)",
        "description": "File size limit for attachments and avatars."
    }
]

class SystemSeeder:
    """
    Bootstrapper for the System Domain.
    Ensures the Control Circuit is fully wired up on every boot.
    """
    @staticmethod
    async def seed(db: AsyncSession):
        """
        Idempotent Seeder.
        1. Ensures SystemConfig keys exist.
        2. Hydrates Meta-Kernel (Widgets).
        3. Auto-Discovers Domains & Scopes from Registry.
        4. Wires up Circuit Breakers for all of them.
        """
        logger.info("🌱 [System] Checking Factory Settings...")
        
        # --- PHASE 1: System Config ---
        seeded_count = 0
        for default in DEFAULT_CONFIGS:
            stmt = select(SystemConfig).where(SystemConfig.key == default["key"])
            result = await db.execute(stmt)
            existing = result.scalars().first()
            
            if not existing:
                logger.debug(f"   ↳ ➕ Seeding Missing Key: {default['key']}")
                new_config = SystemConfig(
                    key=default["key"],
                    value_raw=default["value_raw"],
                    value_type=default["value_type"],
                    category=default["category"],
                    label=default["label"],
                    description=default["description"],
                    is_active=True
                )
                db.add(new_config)
                seeded_count += 1
        
        if seeded_count > 0:
            await db.commit()
            logger.info(f"✅ [System] Config Seeding Complete. Added {seeded_count} keys.")

        # --- PHASE 1.5: Meta-Kernel Assets (The Library) ---
        # ⚡ This ensures the Widget Registry is populated before any UI renders
        try:
            await seed_widgets(db)
        except Exception as e:
            logger.error(f"🔥 [System] Widget Seeding Failed (Non-Critical): {e}")

        # --- PHASE 2: Code Registry (Domains & Scopes) ---
        logger.info("🔌 [System] Scanning Code Registry for Circuits...")
        
        # We use the RegistryManager directly to get the latest Code Definitions
        # ⚡ FIX: Passing 'db' to fetch Dynamic Types and awaiting the result
        registry_summaries = await domain_registry.get_all_summaries(db)

        domain_circuit_count = 0
        scope_circuit_count = 0

        for dom in registry_summaries:
            # DomainSummary is a Pydantic model now
            domain_key = dom.key
            domain_target = f"domain:{domain_key}"
            
            # 2.1 Seed DOMAIN Circuits (API, UI, WORKER)
            # ⚡ CACHE UPDATE: ensure_circuit now updates the Hypervisor memory map too
            await SystemHypervisor.ensure_circuit(db, domain_target, "API")
            await SystemHypervisor.ensure_circuit(db, domain_target, "UI")
            await SystemHypervisor.ensure_circuit(db, domain_target, "WORKER")
            domain_circuit_count += 1

            # 2.2 Seed SCOPE Circuits (Recursive)
            scopes = dom.scopes
            for scope in scopes:
                scope_key = scope.key
                scope_type = scope.type
                scope_target = f"scope:{domain_key}:{scope_key}"
                
                # All scopes get API and UI controls
                await SystemHypervisor.ensure_circuit(db, scope_target, "API", module_type=scope_type)
                await SystemHypervisor.ensure_circuit(db, scope_target, "UI", module_type=scope_type)
                
                # Only JOB scopes get a Worker control
                if scope_type == "JOB":
                    await SystemHypervisor.ensure_circuit(db, scope_target, "WORKER", module_type=scope_type)
                
                scope_circuit_count += 1

        # --- PHASE 3: Data Registry (Screens) ---
        logger.info("🖥️ [System] Scanning Workspace Screens...")

        screen_circuit_count = 0
        try:
            # We fetch screens dynamically from the DB
            screens = await WorkspaceService.list_screens(db)
            
            for screen in screens:
                screen_target = f"screen:{screen.route_slug}"
                # Screens are UI Containers, they only have a UI Plane
                await SystemHypervisor.ensure_circuit(db, screen_target, "UI", module_type="SCREEN")
                screen_circuit_count += 1
                
        except Exception as e:
            logger.warning(f"⚠️ [System] Could not seed Screens (Workspace might be empty): {e}")

        # Commit all new circuits
        try:
            await db.commit()
            logger.info(
                f"✅ [System] Hypervisor Grid Online.\n"
                f"   - Domains Wired: {domain_circuit_count}\n"
                f"   - Scopes Wired: {scope_circuit_count}\n"
                f"   - Screens Wired: {screen_circuit_count}"
            )
        except Exception as e:
            logger.error(f"🔥 [System] Circuit Seeding Failed: {e}")
            await db.rollback()

