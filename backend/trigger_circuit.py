# FILEPATH: backend/trigger_circuit.py
# @file: Circuit Breaker Trigger Simulation
# @author: The Engineer
# @description: Toggles a System Circuit Breaker to verify CDC on Internal components.
# Tests the "Zone 2" Coverage (System Internals).

import asyncio
import logging
import sys
import os

# ⚡ BOOTSTRAP PATH
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database.session import AsyncSessionLocal
from app.domains.system.logic.hypervisor import SystemHypervisor
from app.core.kernel.interceptor import LogicInterceptor

# Setup Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [TRIGGER] %(message)s")
logger = logging.getLogger("trigger.circuit")

async def fire_circuit_event():
    logger.info("⚡ [Trigger] Initiating Hypervisor Test...")
    
    # ⚡ MANUALLY REGISTER INTERCEPTOR (Required for standalone scripts)
    LogicInterceptor.register(Session)
    
    async with AsyncSessionLocal() as db:
        try:
            target = "domain:TEST_ZONE"
            plane = "API"
            
            # 1. Ensure it exists (Prime the cache/db)
            logger.info(f"   Ensure Circuit: {target}::{plane}")
            await SystemHypervisor.ensure_circuit(db, target, plane, "TEST")
            await db.commit() # Commit first to establish baseline
            
            # 2. Toggle State (The Mutation)
            logger.info("   🔴 Flipping Switch to HALTED...")
            
            # This calls the refactored ORM method
            await SystemHypervisor.set_state(
                db=db,
                target=target,
                plane=plane,
                status="HALTED",
                reason="Automated CDC Verification"
            )
            
            # 3. Commit (Triggers Interceptor)
            logger.info("💾 [Commit] Saving to DB...")
            await db.commit()
            
            logger.info("✅ [Success] Transaction Committed.")
            logger.info("   👉 Run 'probe_diagnostics.py'. Expected Events: +1 (Total > 1)")

        except Exception as e:
            logger.error(f"🔥 [Failure] {e}", exc_info=True)
            await db.rollback()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(fire_circuit_event())
