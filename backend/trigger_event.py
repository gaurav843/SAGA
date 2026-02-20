# FILEPATH: backend/trigger_event.py
# @file: Event Trigger Simulation
# @author: The Engineer
# @description: Modifies a User record to force the LogicInterceptor to fire.
# Tests the "Write Path" to the Outbox.

import asyncio
import logging
import sys
import os
from datetime import datetime

# ⚡ BOOTSTRAP
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from app.core.database.session import AsyncSessionLocal
from app.domains.auth.models import User
from app.core.kernel.interceptor import LogicInterceptor
from sqlalchemy.orm import Session

# Setup logging to see Interceptor output
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("trigger")

async def fire_test_event():
    logger.info("🔫 [Trigger] Initiating Test Transaction...")
    
    # ⚡ CRITICAL: We must register the interceptor manually for this script context
    # In the real app, main.py does this.
    LogicInterceptor.register(Session)
    
    async with AsyncSessionLocal() as db:
        try:
            # 1. Fetch User
            stmt = select(User).limit(1)
            result = await db.execute(stmt)
            user = result.scalars().first()
            
            if not user:
                logger.error("❌ No users found. Run 'python seed.py' first.")
                return

            logger.info(f"👤 [Target] Found User: {user.email} (ID: {user.id})")
            
            # 2. Modify State (Trigger Dirty Check)
            # We update a field to force SQLAlchemy to mark it 'dirty'
            old_login = user.last_login
            user.last_login = datetime.utcnow()
            
            logger.info(f"📝 [Mutation] Updating last_login: {old_login} -> {user.last_login}")
            
            # 3. Commit (Triggers Interceptor -> Outbox)
            logger.info("💾 [Commit] Saving to DB...")
            await db.commit()
            
            logger.info("✅ [Success] Transaction Committed.")
            logger.info("   👉 Now run 'probe_diagnostics.py' to verify the Outbox entry.")
            
        except Exception as e:
            logger.error(f"🔥 [Failure] {e}", exc_info=True)
            await db.rollback()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(fire_test_event())

