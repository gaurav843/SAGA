# FILEPATH: backend/scripts/kafka/consume.py
# @file: Kafka Event Viewer
# @description: Connects to the 'flodock.events' topic and prints messages.

import asyncio
import logging
import json
import sys
import os
from aiokafka import AIOKafkaConsumer

# ⚡ PATH INJECTION (ROBUST)
# File: .../backend/scripts/kafka/consume.py
current_file = os.path.abspath(__file__)
kafka_dir = os.path.dirname(current_file)     # .../kafka
scripts_dir = os.path.dirname(kafka_dir)      # .../scripts
backend_dir = os.path.dirname(scripts_dir)    # .../backend

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from app.core.config import settings
except ImportError:
    print(f"❌ Python Import Error. Could not find 'app' module.")
    print(f"   Checked Path: {backend_dir}")
    sys.exit(1)

# Setup Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [CONSUMER] %(message)s")
logger = logging.getLogger("kafka.consumer")

async def consume():
    servers = getattr(settings, "KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    prefix = getattr(settings, "KAFKA_TOPIC_PREFIX", "flodock")
    topic = f"{prefix}.events"
    
    logger.info(f"👂 [Consumer] Connecting to {servers}...")
    
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
        logger.info("-" * 40)

        async for msg in consumer:
            payload = msg.value
            event_name = payload.get('event_name', 'UNKNOWN')
            inner = payload.get('payload', {})
            domain = inner.get('domain', '?') if isinstance(inner, dict) else '?'
            
            logger.info(f"📨 [{msg.offset}] {event_name} ({domain})")
            print(json.dumps(payload, indent=2))
            print("-" * 40)

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
        pass

