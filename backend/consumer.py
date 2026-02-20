# FILEPATH: backend/consumer.py
# @file: Kafka Event Viewer
# @author: The Engineer
# @description: Connects to the 'flodock.events' topic and prints messages.

import asyncio
import logging
import json
import sys
import os
from aiokafka import AIOKafkaConsumer

# ⚡ BOOTSTRAP PATH (FIXED)
# Use the directory of this script (backend/) as the root for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings

# Setup Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [CONSUMER] %(message)s")
logger = logging.getLogger("kafka.consumer")

async def consume():
    servers = getattr(settings, "KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    prefix = getattr(settings, "KAFKA_TOPIC_PREFIX", "flodock")
    topic = f"{prefix}.events"
    
    logger.info(f"👂 [Consumer] Connecting to {servers}...")
    logger.info(f"   Topic: {topic}")

    consumer = AIOKafkaConsumer(
        topic,
        bootstrap_servers=servers,
        group_id="flodock-cli-viewer-v1",
        value_deserializer=lambda x: json.loads(x.decode('utf-8')),
        auto_offset_reset="earliest"
    )

    try:
        await consumer.start()
        logger.info("✅ [Consumer] Connected. Waiting for events...")
        logger.info("------------------------------------------------")

        async for msg in consumer:
            payload = msg.value
            event_name = payload.get('event_name', 'UNKNOWN')
            
            inner = payload.get('payload', {})
            domain = inner.get('domain', '?') if isinstance(inner, dict) else '?'
            
            logger.info(f"📨 [{msg.offset}] {event_name} ({domain})")
            print(json.dumps(payload, indent=2))
            print("-" * 50)

    except Exception as e:
        logger.error(f"🔥 [Consumer] Error: {e}")
    finally:
        await consumer.stop()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    try:
        asyncio.run(consume())
    except KeyboardInterrupt:
        logger.info("👋 [Consumer] Stopping...")

