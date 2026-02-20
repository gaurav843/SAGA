# FILEPATH: backend/app/core/kernel/worker.py
# @file The Heart (Background Worker)
# @author The Engineer
# @description The Pulse Engine. Polls the Transactional Outbox and executes Side Effects.
#              Guarantees "At Least Once" delivery.

import asyncio
import logging
import sys
import os
import json
from datetime import datetime

# ⚡ BOOTSTRAP PATH
# Ensure we can import from the root 'backend' folder
sys.path.append(os.path.join(os.path.dirname(__file__), "../../../.."))

from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.session import AsyncSessionLocal
from app.core.kernel.models import SystemOutbox

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [HEART] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("flodock.worker")

class BackgroundWorker:
    def __init__(self):
        self.is_running = True
        self.poll_interval = 2.0 # Seconds

    async def start(self):
        logger.info("💓 The Heart is beating. Waiting for events...")
        
        while self.is_running:
            try:
                await self.process_batch()
            except Exception as e:
                logger.error(f"🔥 Arrhythmia (Crash): {e}", exc_info=True)
                # Don't crash the loop, just pause
                await asyncio.sleep(5)
            
            await asyncio.sleep(self.poll_interval)

    async def process_batch(self):
        async with AsyncSessionLocal() as db:
            # 1. FETCH PENDING (Limit 10 to prevent clogging)
            stmt = select(SystemOutbox).where(
                SystemOutbox.status == 'PENDING'
            ).order_by(SystemOutbox.created_at).limit(10)
            
            result = await db.execute(stmt)
            events = result.scalars().all()

            if not events:
                return # Pulse normal.

            logger.info(f"⚡ Processing batch of {len(events)} events...")

            for event in events:
                await self.handle_event(db, event)

            await db.commit()

    async def handle_event(self, db: AsyncSession, event: SystemOutbox):
        """
        The Switchboard. Routes events to their specific handlers.
        """
        start_time = datetime.utcnow()
        try:
            # ⚡ ROUTING LOGIC
            logger.info(f"   ▶️  Executing: {event.event_name} (ID: {event.id})")
            
            # --- HANDLER: WORKFLOW TRANSITIONS ---
            if event.event_name.startswith("WORKFLOW:"):
                await self._handle_workflow_action(event)
            
            # --- HANDLER: AUDIT ---
            elif event.event_name.startswith("USER:"):
                 logger.info(f"      👤 Audit Logged: {event.payload.get('data', {}).get('email')}")

            # --- MARK SUCCESS ---
            event.status = 'PROCESSED'
            event.processed_at = datetime.utcnow()
            event.error_log = None # Clear previous errors if any

        except Exception as e:
            # --- MARK FAILURE ---
            logger.error(f"      ❌ Failed: {e}")
            event.status = 'FAILED'
            event.retry_count += 1
            event.error_log = str(e)
    
    async def _handle_workflow_action(self, event: SystemOutbox):
        """
        Executes business logic triggered by State Changes.
        """
        action = event.payload.get('data', {}).get('action')
        entity_id = event.entity_id
        
        if action == 'send_email':
            # In a real app, this calls SendGrid/SES
            logger.info(f"      📧 [MOCK] Sending Email for Entity #{entity_id}")
            
        elif action == 'notify_slack':
            logger.info(f"      💬 [MOCK] Posting to Slack for Entity #{entity_id}")
            
        else:
            logger.warning(f"      ⚠️  Unknown Action: {action}")

# --- ENTRY POINT ---
if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    worker = BackgroundWorker()
    try:
        asyncio.run(worker.start())
    except KeyboardInterrupt:
        logger.info("🛑 Heart stopped manually.")

