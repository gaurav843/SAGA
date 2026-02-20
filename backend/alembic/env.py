# FILEPATH: backend/alembic/env.py
# @file Alembic Environment Config (DYNAMIC LOADER v2.2)
# @author The Engineer
# @description Configures the migration environment with AUTO-DISCOVERY.
#              UPDATED: Explicitly registers Meta-Kernel models to prevent data loss.

import asyncio
from logging.config import fileConfig
import logging
import sys
import os
import pkgutil
import importlib
import importlib.util

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# 1. Add 'backend' to python path to allow imports
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# 2. Import System Configuration
from app.core.config import settings

# 👈 CHANGED: Import the Shared Base instead of Auth-specific Base
from app.core.database.base import Base

# 👈 NEW: Explicitly import Kernel Models to ensure they are registered with Base.metadata
#    Dynamic loader only scans 'domains', so Core Infra must be imported manually.
import app.core.kernel.models 
import app.core.meta.models # ⚡ FIX: Added Meta Models so Alembic sees them!

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# 3. Overwrite the SQLAlchemy URL with our Pydantic Setting
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

logger = logging.getLogger("alembic.env")

# --- 4. DYNAMIC MODEL DISCOVERY (The "Plugin Host") ---
def load_all_domain_models():
    """
    Scans the 'app/domains' directory.
    If a domain has a 'models.py', it is imported.
    This registers the models with SQLAlchemy's Base.metadata.
    """
    logger.info("🔌 [Alembic] Scanning for Domain Models...")
    
    domains_path = os.path.join(os.path.dirname(__file__), "../app/domains")
    domains_path = os.path.abspath(domains_path)

    if not os.path.exists(domains_path):
        logger.warning(f"⚠️ [Alembic] Domains directory not found: {domains_path}")
        return

    count = 0
    # pkgutil.iter_modules returns (module_loader, name, ispkg)
    for _, domain_name, ispkg in pkgutil.iter_modules([domains_path]):
        if ispkg:
            # Construct the potential module path (e.g., app.domains.shipping.models)
            model_module_name = f"app.domains.{domain_name}.models"
            
            # Check if models.py physically exists (Prevent Import Errors)
            spec = importlib.util.find_spec(model_module_name)
            
            if spec is None:
                # This is fine. Not every domain needs a database table.
                logger.debug(f"   ℹ️  [{domain_name}] No models.py found. Skipping.")
                continue

            try:
                # Import the module. This executes the Class definitions,
                # registering them with the global Base.metadata.
                importlib.import_module(model_module_name)
                logger.info(f"   ✅ [Alembic] Registered models for: [{domain_name}]")
                count += 1
                
            except Exception as e:
                # CRITICAL: If a model file exists but crashes, we must stop migrations.
                logger.error(f"   ❌ [Alembic] Failed to load models for [{domain_name}]: {e}")
                raise e

    logger.info(f"🔌 [Alembic] Discovery Complete. {count} Domains registered.")

# Execute Discovery
load_all_domain_models()

# 5. Set Metadata for Autogenerate
# Alembic compares this (Python Code) vs the Database to find changes.
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())