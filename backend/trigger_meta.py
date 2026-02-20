# FILEPATH: backend/trigger_meta.py
# @file: Meta-Kernel CDC Trigger
# @author: The Engineer
# @description: Creates a PolicyDefinition to verify CDC on 'CORE' domains.
# Tests the "Meta-Kernel" Coverage.

import asyncio
import logging
import sys
import os

# ⚡ BOOTSTRAP PATH
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database.session import AsyncSessionLocal
from app.core.meta.models import PolicyDefinition
from app.core.meta.constants import PolicyResolutionStrategy, RuleActionType
from app.core.kernel.interceptor import LogicInterceptor
from app.core.kernel.registry import domain_registry
import app.core.meta.registry # Ensure registration

# Setup Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [META-TEST] %(message)s")
logger = logging.getLogger("trigger.meta")

async def fire_meta_event():
    logger.info("🧪 [Meta] Initiating Policy CDC Test...")
    
    # Register Interceptor
    LogicInterceptor.register(Session)
    
    # Verify Registration
    meta_ctx = domain_registry.get_domain("META")
    if not meta_ctx:
        logger.error("❌ META Domain NOT registered in Kernel!")
        return
    logger.info(f"✅ META Domain Registered (Type: {meta_ctx.domain_type})")

    async with AsyncSessionLocal() as db:
        try:
            # 1. Create Policy
            policy_key = "sys_test_cdc_v1"
            
            logger.info(f"   Creating Policy: {policy_key}")
            policy = PolicyDefinition(
                key=policy_key,
                name="CDC Verification Policy",
                description="Temporary policy to test Outbox.",
                resolution=PolicyResolutionStrategy.ALL_MUST_PASS,
                rules=[{
                    "logic": "true == true",
                    "action": RuleActionType.WARN,
                    "message": "CDC Test"
                }],
                is_active=True
            )
            
            db.add(policy)
            
            # 2. Commit (Triggers Interceptor)
            logger.info("💾 [Commit] Saving to DB...")
            await db.commit()
            
            logger.info("✅ [Success] Policy Saved.")
            logger.info("   👉 Run 'probe_diagnostics.py'. Look for 'META:CREATED'.")

        except Exception as e:
            logger.error(f"🔥 [Failure] {e}", exc_info=True)
            await db.rollback()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(fire_meta_event())

