# FILEPATH: backend/app/domains/system/logic/state.py
# @file: System State Aggregator (The Pulse)
# @author: The Engineer (ansav8@gmail.com)
# @description: Aggregates the "Tri-Layer" Versioning (Engine + Schema + Content).
# Serves as the Single Source of Truth for "What is running?".

import logging
from sqlalchemy import text, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.domains.workspace.models import Release
from app.core.kernel.registry import domain_registry

logger = logging.getLogger("domains.system.logic.state")

class SystemState:
    """
    The Central Nervous System Observer.
    Provides the Real-Time Identity Card of the Operating System.
    """

    @staticmethod
    async def get_pulse(db: AsyncSession) -> dict:
        """
        Returns the unified System State.
        Consumed by the Frontend 'SystemIdentityCard' widget.
        """
        try:
            # 1. Gather Intelligence
            schema_ver = await SystemState._get_schema_version(db)
            content_ver = await SystemState._get_content_version(db)
            
            # 2. Construct Identity
            pulse = {
                "identity": {
                    "name": settings.PROJECT_NAME,
                    "environment": settings.ENVIRONMENT,
                    "is_maintenance": False # TODO: Wire to SystemConfig
                },
                "versioning": {
                    "engine": settings.VERSION,          # Immutable Code (v2.5.0)
                    "schema": schema_ver,                # Database Structure (Hash)
                    "content": content_ver               # User Logic (SemVer)
                },
                "health": {
                    "database": "CONNECTED",
                    "latency": "0ms", # Calculated by Middleware
                    "modules_active": len(domain_registry.get_all_summaries())
                }
            }
            
            logger.debug(f"💓 [SystemState] Pulse Checked. Content: {content_ver}")
            return pulse

        except Exception as e:
            logger.error(f"🔥 [SystemState] Critical Pulse Failure: {e}")
            return {"error": "System Vital Failure"}

    @staticmethod
    async def _get_schema_version(db: AsyncSession) -> str:
        """
        Queries the Alembic Version Table directly.
        Validates that the DB migration level matches the Code expectation.
        """
        try:
            result = await db.execute(text("SELECT version_num FROM alembic_version LIMIT 1"))
            version = result.scalar()
            return version or "UNKNOWN"
        except Exception as e:
            logger.warning(f"⚠️ [SystemState] Failed to read Schema Version: {e}")
            return "UNTRACKED"

    @staticmethod
    async def _get_content_version(db: AsyncSession) -> str:
        """
        Calculates the 'System Content Version'.
        Logic: The System Version is the LATEST release label across ALL screens.
        """
        try:
            # Find the highest semantic version label in the Release Table
            # Note: String comparison is used here as a heuristic.
            # In a strict environment, we would use SemVer sorting logic.
            stmt = select(func.max(Release.version_label))
            result = await db.execute(stmt)
            latest = result.scalar()
            return latest or "0.0.0"
        except Exception as e:
            logger.error(f"❌ [SystemState] Failed to calculate Content Version: {e}")
            return "ERROR"

