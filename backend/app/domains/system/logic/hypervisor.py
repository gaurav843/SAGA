# FILEPATH: backend/app/domains/system/logic/hypervisor.py
# @file: System Hypervisor (ORM Edition)
# @author: The Engineer (ansav8@gmail.com)
# @description: The Logic Engine for the Circuit Breaker system.
# UPDATED: Uses ORM patterns to ensure CDC/Outbox integration.
# @security-level: LEVEL 9 (Observable State)

import logging
import time
from typing import Optional, Tuple, Dict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.system.models import CircuitBreaker

logger = logging.getLogger("domains.system.hypervisor")

class SystemHypervisor:
    """
    The Central Logic for Operational State.
    Uses Write-Through Caching and ORM Persistence.
    """
    
    # ⚡ MEMORY CACHE (The Shield)
    # Key: "target::plane" -> Value: "STATUS"
    _circuit_cache: Dict[str, str] = {}
    _cache_timestamps: Dict[str, float] = {}
    
    # Safety Net: Cache expires every 60 seconds to force a re-sync
    CACHE_TTL = 60.0 

    @staticmethod
    async def check_state(db: AsyncSession, target: str, plane: str) -> Tuple[bool, str]:
        """
        Checks if a specific Target is allowed to operate on a specific Plane.
        Uses Memory Cache first, then falls back to DB.
        """
        cache_key = f"{target}::{plane}"
        current_time = time.time()
        
        # 1. READ CACHE (Fast Path)
        cached_status = SystemHypervisor._circuit_cache.get(cache_key)
        last_fetch = SystemHypervisor._cache_timestamps.get(cache_key, 0)
        
        if cached_status and (current_time - last_fetch < SystemHypervisor.CACHE_TTL):
            return SystemHypervisor._interpret_status(cached_status)

        # 2. CACHE MISS -> FETCH DB (Slow Path)
        stmt = select(CircuitBreaker).where(
            CircuitBreaker.target == target,
            CircuitBreaker.plane == plane
        )
        result = await db.execute(stmt)
        circuit = result.scalars().first()

        # 3. POPULATE CACHE
        if not circuit:
            # Default: Implicitly Nominal
            SystemHypervisor._update_local_cache(cache_key, "NOMINAL")
            return True, "Implicitly Nominal"
        
        SystemHypervisor._update_local_cache(cache_key, circuit.status)
        
        # 4. Return Result
        return SystemHypervisor._interpret_status(circuit.status)

    @staticmethod
    def _interpret_status(status: str) -> Tuple[bool, str]:
        """Converts raw status string to Boolean Permission."""
        if status == "NOMINAL":
            return True, "Nominal"
        if status == "HALTED":
            return False, "System Halt: Administrative Lock"
        if status == "MAINTENANCE":
            return False, "Under Maintenance"
        if status == "DEGRADED":
            return True, "Degraded Performance"
        
        return False, "Unknown State"

    @staticmethod
    def _update_local_cache(key: str, status: str):
        """Internal helper to set cache with timestamp."""
        SystemHypervisor._circuit_cache[key] = status
        SystemHypervisor._cache_timestamps[key] = time.time()

    @staticmethod
    async def set_state(
        db: AsyncSession, 
        target: str, 
        plane: str, 
        status: str, 
        reason: Optional[str] = None
    ) -> CircuitBreaker:
        """
        Upserts a Circuit Breaker state.
        ⚡ UPDATED: Uses ORM lookup/update to trigger LogicInterceptor (CDC).
        """
        logger.warning(f"⚡ [Hypervisor] Switching {target}::{plane} -> {status}")

        # 1. ORM Lookup
        stmt = select(CircuitBreaker).where(
            CircuitBreaker.target == target,
            CircuitBreaker.plane == plane
        )
        result = await db.execute(stmt)
        circuit = result.scalars().first()

        # 2. Update or Create
        if circuit:
            circuit.status = status
            circuit.reason = reason
            # SQLAlchemy tracks this as 'dirty'
        else:
            circuit = CircuitBreaker(
                target=target,
                plane=plane,
                status=status,
                reason=reason,
                module_type="DYNAMIC" # Default for ad-hoc switches
            )
            db.add(circuit) # SQLAlchemy tracks this as 'new'

        # 3. Flush to trigger Interceptor
        await db.flush()
        
        # 4. Cache Update
        cache_key = f"{target}::{plane}"
        SystemHypervisor._update_local_cache(cache_key, status)
        
        return circuit

    @staticmethod
    async def ensure_circuit(db: AsyncSession, target: str, plane: str, module_type: Optional[str] = None):
        """
        Idempotent Registration. Ensures a switch exists.
        """
        stmt = select(CircuitBreaker).where(
            CircuitBreaker.target == target,
            CircuitBreaker.plane == plane
        )
        result = await db.execute(stmt)
        existing = result.scalars().first()

        cache_key = f"{target}::{plane}"

        if not existing:
            db_obj = CircuitBreaker(
                target=target,
                plane=plane,
                status="NOMINAL",
                module_type=module_type
            )
            db.add(db_obj)
            SystemHypervisor._update_local_cache(cache_key, "NOMINAL")
        else:
            SystemHypervisor._update_local_cache(cache_key, existing.status)
