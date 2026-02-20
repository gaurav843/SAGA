# FILEPATH: backend/seed.py
# @file: The Seeding Orchestrator (Wave Protocol v3.0 - Smart Start Edition)
# @author: The Engineer (ansav8@gmail.com)
# @description: The Central Nervous System for Data Population.
# Implements the 3-Phase "Wave Protocol" for deterministic dependency resolution.
# UPDATED: Added Phase 0 (Zero-Touch Bootstrap) to dynamically build missing tables.

import asyncio
import argparse
import logging
import sys
import os
import pkgutil
import importlib
import importlib.util
from typing import List, Callable

# Add backend to path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database.session import AsyncSessionLocal, engine
from app.core.database.base import Base
from app.core.config import settings

# ⚡ KERNEL BOOTSTRAP IMPORTS (The Physical Blueprint)
import app.core.kernel.models
import app.core.meta.models
from app.domains.system.features.domain_types.seeds import seed_domain_types
from app.core.kernel.registry import domain_registry
import app.domains.system.registry # ⚡ SYSTEM REGISTRATION (Awakens GLOBAL)
from app.domains.system.logic.seeder import SystemSeeder

# --- LOGGING SETUP ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("flodock.seed")

# --- WAVE DEFINITIONS ---
WAVES = [
    ("seed_static", "🌊 [Wave 1] Static Definitions (Enums, Types, Config)"),
    ("seed_assets", "🌊 [Wave 2] Core Assets (Users, Inventory, Fleet)"),
    ("seed_history", "🌊 [Wave 3] History & Simulation (Events, Logs)")
]

REVERSE_WAVES = [
    ("undo_history", "🔥 [Undo Wave 3] Cleaning History..."),
    ("undo_assets", "🔥 [Undo Wave 2] Cleaning Assets..."),
    ("undo_static", "🔥 [Undo Wave 1] Cleaning Static Defs...")
]

def get_domain_modules():
    """
    Scans 'app/domains' and returns a list of active modules.
    """
    domains_path = os.path.join(os.path.dirname(__file__), "app/domains")
    modules = []
    
    if not os.path.exists(domains_path):
        logger.error(f"❌ Domains directory not found: {domains_path}")
        return []

    for _, domain_name, ispkg in pkgutil.iter_modules([domains_path]):
        if ispkg:
            try:
                module_name = f"app.domains.{domain_name}.seeds"
                spec = importlib.util.find_spec(module_name)
                
                if spec:
                    module = importlib.import_module(module_name)
                    modules.append((domain_name, module))
                    logger.debug(f"   ✅ Discovered Plugin: [{domain_name}]")
            except Exception as e:
                logger.error(f"   ❌ Failed to load [{domain_name}]: {e}")

    return modules

async def run_wave(wave_func_name: str, wave_desc: str, db, modules):
    """
    Executes a specific wave across ALL domains simultaneously.
    """
    logger.info(f"\n{wave_desc}")
    logger.info("-" * 60)
    
    execution_count = 0
    
    for domain_name, module in modules:
        if hasattr(module, wave_func_name):
            seeder_func = getattr(module, wave_func_name)
            
            if callable(seeder_func):
                try:
                    logger.info(f"   ▶️  Executing [{domain_name}]...")
                    await seeder_func(db)
                    execution_count += 1
                except Exception as e:
                    logger.error(f"   ❌ CRITICAL FAILURE in [{domain_name}]: {e}")
                    raise e
    
    if execution_count == 0:
        logger.info("   (No plugins participated in this wave)")

async def run_seeding_process(target_wave: str = "all", reset: bool = False):
    """
    The Main Execution Flow.
    """
    modules = get_domain_modules()
    logger.info(f"🔌 [Orchestrator] Connected. Found {len(modules)} plugins.\n")

    # ⚡ PHASE 0: ZERO-TOUCH BOOTSTRAP (The "Smart Start")
    logger.info("🧱 [Orchestrator] Phase 0: Synchronizing Physical Schema...")
    
    # Dynamically load all Domain Models into memory so SQLAlchemy knows they exist
    for domain_name, _ in modules:
        try:
            importlib.import_module(f"app.domains.{domain_name}.models")
        except ImportError:
            pass

    try:
        # Force SQLAlchemy to construct the physical tables if they are missing
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("   ✅ Database Tables Synchronized.\n")
    except Exception as e:
        logger.error(f"   ❌ Phase 0 Schema Build Failed: {e}")
        sys.exit(1)


    async with AsyncSessionLocal() as db:
        try:
            # --- RESET MODE (Reverse Waves) ---
            if reset:
                logger.warning("⚠️  [RESET MODE] Destroying data in reverse order...")
                for func, desc in REVERSE_WAVES:
                    await run_wave(func, desc, db, modules)
                logger.info("\n✅ Cleanup Complete. Starting fresh seed...\n")

            # ⚡ PHASE 0.5: KERNEL HYDRATION
            logger.info("🧬 [Kernel] Seeding Domain DNA (Types)...")
            await seed_domain_types(db)
            
            logger.info("🔮 [Kernel] Synchronizing Code Registry to Database...")
            await domain_registry.sync_to_db(db)
            
            logger.info("⚙️ [Kernel] Seeding System Assets (Configs, Widgets, Circuits)...")
            await SystemSeeder.seed(db)
            
            logger.info("✨ [Kernel] Core OS Bootstrapped.\n")

            # --- SEED MODE (Forward Waves) ---
            for func, desc in WAVES:
                if target_wave != "all" and target_wave not in func:
                    continue
                
                # Guard: Don't run History in Prod unless explicit
                if func == "seed_history" and settings.ENVIRONMENT == "PRODUCTION" and target_wave != "seed_history":
                    logger.warning("   🛡️  Skipping [Wave 3] in PRODUCTION (Safety Guard).")
                    continue
                
                await run_wave(func, desc, db, modules)

            await db.commit()
            logger.info("\n✅ [Orchestrator] Seeding Cycle Complete. Database is synced.")

        except Exception as e:
            await db.rollback()
            logger.error(f"\n❌ [Orchestrator] Transaction Aborted: {e}")
            sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Flodock Seeding Orchestrator")
    parser.add_argument("--wave", choices=["1", "2", "3", "static", "assets", "history", "all"], default="all", help="Run a specific wave only.")
    parser.add_argument("--reset", action="store_true", help="Run UNDO waves before seeding (Clean Slate).")
    
    args = parser.parse_args()
    
    wave_map = {
        "1": "seed_static", "static": "seed_static",
        "2": "seed_assets", "assets": "seed_assets",
        "3": "seed_history", "history": "seed_history",
        "all": "all"
    }

    target = wave_map.get(args.wave, "all")
    
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    asyncio.run(run_seeding_process(target_wave=target, reset=args.reset))

if __name__ == "__main__":
    main()

