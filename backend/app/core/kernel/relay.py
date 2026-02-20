# FILEPATH: backend/app/core/kernel/relay.py
# @file: The Kafka Relay (Transactional Outbox Pump)
# @author: The Engineer
# @description: Polls the Database Outbox and pushes events to Kafka.

import asyncio
import logging
import json
import sys
import os
from datetime import datetime
from aiokafka import AIOKafkaProducer
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

# ⚡ BOOTSTRAP PATH (FIXED)
# We need to add 'backend' to sys.path, not 'Flodock'.
# Current: backend/app/core/kernel/relay.py
# Dir:     backend/app/core/kernel
current_dir = os.path.dirname(os.path.abspath(__file__))
# 1. core
# 2. app
# 3. backend
backend_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
sys.path.append(backend_root)

# Now we can import 'app'
from app.core.database.session import AsyncSessionLocal
from app.core.config import settings
from app.core.kernel.models import SystemOutbox

# Setup dedicated logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s [RELAY] %(message)s")
logger = logging.getLogger("kernel.relay")

class KafkaRelay:
    def __init__(self):
        self.is_running = True
        self.producer = None
        self.poll_interval = 2.0
        self.batch_size = 100

    async def connect_kafka(self):
        while self.is_running:
            try:
                servers = getattr(settings, "KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
                logger.info(f"🔌 [Relay] Connecting to Kafka at {servers}...")
                
                self.producer = AIOKafkaProducer(
                    bootstrap_servers=servers,
                    value_serializer=lambda v: json.dumps(v).encode('utf-8')
                )
                await self.producer.start()
                logger.info("✅ [Relay] Kafka Connection ESTABLISHED.")
                return True
            except Exception as e:
                logger.warning(f"⚠️ [Relay] Connection Failed: {e}. Retrying in 5s...")
                await asyncio.sleep(5)
        return False

    async def start(self):
        print("-" * 40)
        print("🚀 STARTING DATA RELAY (Outbox -> Kafka)")
        print("-" * 40)
        
        if not await self.connect_kafka():
            return

        try:
            while self.is_running:
                await self.process_batch()
                await asyncio.sleep(self.poll_interval)
                
        except Exception as e:
            logger.critical(f"🔥 [Relay] CRASH: {e}", exc_info=True)
        finally:
            if self.producer:
                await self.producer.stop()
            logger.info("🛑 [Relay] Shutdown complete.")

    async def process_batch(self):
        async with AsyncSessionLocal() as db:
            try:
                # Poll Pending
                stmt = select(SystemOutbox).where(
                    SystemOutbox.status == 'PENDING'
                ).order_by(SystemOutbox.created_at).limit(self.batch_size)
                
                result = await db.execute(stmt)
                events = result.scalars().all()

                if not events:
                    return

                logger.info(f"⚡ [Relay] Processing batch of {len(events)} events...")
                success_ids = []
                fail_ids = []

                for event in events:
                    try:
                        prefix = getattr(settings, "KAFKA_TOPIC_PREFIX", "flodock")
                        topic = f"{prefix}.events"
                        
                        payload = event.to_dict()
                        key_str = event.partition_key or "global"
                        
                        await self.producer.send_and_wait(
                            topic, 
                            value=payload, 
                            key=key_str.encode('utf-8')
                        )
                        success_ids.append(event.id)
                        logger.debug(f"   -> Sent {event.event_name} (ID: {event.id})")
                        
                    except Exception as e:
                        logger.error(f"   ❌ Failed to send Event {event.id}: {e}")
                        fail_ids.append(event.id)

                if success_ids:
                    await db.execute(
                        update(SystemOutbox)
                        .where(SystemOutbox.id.in_(success_ids))
                        .values(status='PUBLISHED', processed_at=datetime.utcnow())
                    )
                
                if fail_ids:
                    await db.execute(
                        update(SystemOutbox)
                        .where(SystemOutbox.id.in_(fail_ids))
                        .values(status='FAILED', retry_count=SystemOutbox.retry_count + 1)
                    )

                await db.commit()
                if success_ids:
                    logger.info(f"✅ [Relay] Batch Complete. {len(success_ids)} Published.")

            except Exception as e:
                logger.error(f"⚠️ [Relay] DB Error: {e}")
                await db.rollback()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    relay = KafkaRelay()
    try:
        asyncio.run(relay.start())
    except KeyboardInterrupt:
        pass

