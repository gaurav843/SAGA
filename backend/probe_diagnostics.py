# FILEPATH: backend/probe_diagnostics.py
# @file: Database Diagnostic Probe (v2.0)
# @author: The Engineer
# @description: Deep inspection of Table Schema and Row Counts.
# Verifies that 'partition_key' exists in the DB.

import asyncio
import logging
import sys
import os

# ⚡ BOOTSTRAP PATH
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text, inspect
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [PROBE] %(message)s")
logger = logging.getLogger("flodock.probe")

async def run_diagnostics():
    logger.info("🕵️  SYSTEM PROBE v2.0 (Schema Inspector)")
    logger.info("=" * 60)

    db_url = settings.DATABASE_URL
    logger.info(f"📋 [Target] {db_url}")

    try:
        engine = create_async_engine(db_url, echo=False)
        async with engine.connect() as conn:
            logger.info("✅ [Network] Connected.")
            
            # 1. INSPECT COLUMNS (The Truth)
            # We use `run_sync` to use the standard SQLAlchemy inspector
            def get_columns(connection):
                inspector = inspect(connection)
                return [c['name'] for c in inspector.get_columns('system_outbox')]

            columns = await conn.run_sync(get_columns)
            
            logger.info(f"📜 [Schema] 'system_outbox' columns: {columns}")
            
            if 'partition_key' in columns and 'trace_id' in columns:
                logger.info("✅ [Migration] SUCCESS. Kafka columns detected.")
            else:
                logger.error("❌ [Migration] FAILURE. 'partition_key' missing. Run 'alembic upgrade head'.")

            # 2. CHECK DATA
            count = (await conn.execute(text("SELECT count(*) FROM system_outbox"))).scalar()
            logger.info(f"📬 [Data] Total Events: {count}")
            
            if count > 0:
                # Show the latest event
                latest = (await conn.execute(text("SELECT event_name, partition_key, status FROM system_outbox ORDER BY id DESC LIMIT 1"))).fetchone()
                logger.info(f"   ↳ Latest: {latest}")

    except Exception as e:
        logger.error(f"🔥 [Probe] Error: {e}")
    finally:
        await engine.dispose()
    
    logger.info("=" * 60)

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run_diagnostics())

