# @file The Smart Nuclear Option
# @author The Engineer
# @description A robust developer tool to REBUILD the Database from scratch.
#              1. Connects to system 'postgres' DB.
#              2. Kills active connections.
#              3. DROPS and RECREATES the 'flodock' database.

import asyncio
import logging
import sys
import os
from urllib.parse import urlparse

# Ensure we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("flodock.nuke")

async def smart_nuke():
    """
    Connects to the Maintenance DB (postgres) to drop/create the Target DB (flodock).
    """
    # 1. Parse Config to get target DB name
    db_url = settings.DATABASE_URL
    if "sqlite" in db_url:
        logger.error("❌ Nuke script is optimized for Postgres. For SQLite, delete the file.")
        return

    parsed = urlparse(db_url)
    target_db = parsed.path.lstrip('/')
    
    # 2. Construct Maintenance Connection (Connect to 'postgres' instead of target)
    # We replace the path (database name) with 'postgres'
    maintenance_url = db_url.replace(f"/{target_db}", "/postgres")
    
    logger.warning(f"☢️  INITIATING SMART NUCLEAR SEQUENCE on [{target_db}]...")
    
    # Isolation level AUTOCOMMIT is required to run DROP DATABASE
    engine = create_async_engine(maintenance_url, isolation_level="AUTOCOMMIT")

    try:
        async with engine.connect() as conn:
            # 3. Kill Active Connections (The "Force" move)
            logger.info(f"    🔫 Terminating existing connections to '{target_db}'...")
            kill_query = text(f"""
                SELECT pg_terminate_backend(pg_stat_activity.pid)
                FROM pg_stat_activity
                WHERE pg_stat_activity.datname = '{target_db}'
                  AND pid <> pg_backend_pid();
            """)
            await conn.execute(kill_query)

            # 4. Drop Database
            logger.info(f"    TZ  Dropping Database '{target_db}'...")
            await conn.execute(text(f"DROP DATABASE IF EXISTS {target_db};"))
            
            # 5. Create Database
            logger.info(f"    cV  Creating Database '{target_db}'...")
            await conn.execute(text(f"CREATE DATABASE {target_db};"))
            
            # 6. Grant Permissions (Optional but good practice)
            # await conn.execute(text(f"GRANT ALL PRIVILEGES ON DATABASE {target_db} TO {parsed.username};"))

        logger.info("✅ DATABASE REBUILT SUCCESSFULLY.")
        logger.info("   Ready for migrations.")

    except Exception as e:
        logger.error(f"❌ Nuke Failed: {e}")
        # If we failed to connect to 'postgres', maybe the credentials only allow connecting to specific DBs?
        logger.error("   Tip: Ensure your DB user has permission to connect to 'postgres' table.")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    asyncio.run(smart_nuke())

