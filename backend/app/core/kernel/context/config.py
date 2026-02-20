# FILEPATH: backend/app/core/kernel/context/config.py
# @file: Global Config Context Provider
# @author: The Engineer
# @description: Injects 'SystemConfig' values into the Logic Engine (namespace: 'config').
# Includes a High-Performance Read-Through Cache.
# @security-level: LEVEL 9 (Cached Read)

import logging
import time
from typing import Dict, List, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.kernel.context.base import ContextProvider, ContextField
from app.domains.system.models import SystemConfig

logger = logging.getLogger("core.kernel.context.config")

class ConfigProvider(ContextProvider):
    """
    The Bridge between the System Config Database and the Policy Engine.
    Exposes global settings as variables (e.g., 'config.MAINTENANCE_MODE').
    """
    
    # ⚡ SHARED MEMORY CACHE (Read-Through)
    # Stores the entire config map to minimize DB hits during policy evaluation.
    _cache: Dict[str, Any] = {}
    _last_fetch: float = 0
    _ttl: int = 60 # Seconds (Default safety net)

    @property
    def namespace(self) -> str:
        return "config"

    def provide_schema(self) -> List[ContextField]:
        """
        INTROSPECTION: Allows the Frontend Rule Builder to see available Config Keys.
        Note: This is a synchronous schema description. In a real dynamic system,
        we might fetch this list from the DB if we want the dropdown to be 100% live.
        For now, we return a generic definition because keys are user-defined.
        """
        return [
            {
                "key": "*", 
                "label": "Dynamic Config Key", 
                "type": "ANY", 
                "description": "Any key defined in the Global Domain."
            }
        ]

    async def provide_runtime(self, db: AsyncSession, entity: Any) -> Dict[str, Any]:
        """
        EXECUTION: Returns the actual Key-Value pairs for the Logic Engine.
        """
        # 1. Check Cache
        if self._is_cache_valid():
            return self._cache

        # 2. Cache Miss -> Fetch from DB
        try:
            return await self._refresh_cache(db)
        except Exception as e:
            logger.error(f"🔥 [ConfigProvider] Failed to load config: {e}")
            return self._cache # Return stale cache on error (Fail Safe)

    def _is_cache_valid(self) -> bool:
        """Checks if the RAM cache is fresh."""
        if not self._cache: return False
        age = time.time() - self._last_fetch
        return age < self._ttl

    async def _refresh_cache(self, db: AsyncSession) -> Dict[str, Any]:
        """
        Reloads the configuration from the database.
        Optimized to fetch all active keys in one query.
        """
        # ⚡ FETCH ALL ACTIVE CONFIGS
        stmt = select(SystemConfig).where(SystemConfig.is_active == True)
        result = await db.execute(stmt)
        configs = result.scalars().all()
        
        new_cache = {}
        for cfg in configs:
            # key is UPPERCASE by convention in SystemConfig
            new_cache[cfg.key] = cfg.typed_value
            
        # Update State
        self._cache = new_cache
        self._last_fetch = time.time()
        
        logger.debug(f"🔄 [ConfigProvider] Cache Refreshed ({len(new_cache)} keys).")
        return new_cache

    @classmethod
    def invalidate(cls):
        """
        EXTERNAL SIGNAL: Called by SystemOutbox Consumer or API to force a refresh.
        """
        cls._last_fetch = 0
        logger.info("⚡ [ConfigProvider] Cache Invalidated.")

