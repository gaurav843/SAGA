# FILEPATH: backend/app/api/v1/system.py
# @file: System API Endpoints (Direct Control Edition)
# @author: ansav8@gmail.com
# @description: Exposes Hypervisor Circuits, System Capabilities, and the Boot Manifest.
# @security-level: LEVEL 9 (Admin Control)
# @updated: /manifest now injects Actor Context for RBAC Navigation filtering.

from fastapi import APIRouter, Depends, HTTPException, Body, Query
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database.session import get_db
from app.core.kernel.system import system_manifest
from app.core.kernel.context.manager import context_manager
from app.core.context import GlobalContext  # ⚡ NEW: Context Accessor

from app.domains.system.logic.state import SystemState
from app.domains.system.logic.governance import GovernanceService
from app.domains.system.logic.hypervisor import SystemHypervisor
from app.domains.system.models import CircuitBreaker

# ⚡ DYNAMIC REGISTRIES (The Brain)
from app.core.meta.features.widgets.service import WidgetService
from app.core.meta.features.widgets.schemas import WidgetRead

import logging
logger = logging.getLogger("api.system")

router = APIRouter()

# --- MANIFEST & PULSE ---

@router.get("/manifest", response_model=Dict[str, Any])
async def get_system_manifest(db: AsyncSession = Depends(get_db)) -> Any:
    """
    BOOTSTRAP ENDPOINT.
    Returns the Operating System configuration, module list, and secured navigation.
    """
    # ⚡ ACQUIRE ACTOR CONTEXT (For RBAC)
    # The ContextMiddleware has already hydrated this from the JWT.
    actor = GlobalContext.get_current_user()
    
    # Pass actor to kernel to filter navigation nodes
    return await system_manifest.generate(db, actor=actor)

@router.get("/capabilities", response_model=Dict[str, Any])
async def get_system_capabilities(db: AsyncSession = Depends(get_db)) -> Any:
    """
    THE AI MANIFEST.
    Returns the complete menu of building blocks available to the OS.
    Merges Static Enums (Kernel) with Dynamic Registries (Database).
    """
    # 1. Fetch Base Capabilities (Static Enums)
    caps = system_manifest.get_capabilities()
    
    # 2. Augment with Context Schema
    if caps.get("version") != "ERROR":
        try:
            caps["context_schema"] = context_manager.get_schema()
        except Exception:
            caps["context_schema"] = {}

    # 3. ⚡ HYDRATE DYNAMIC WIDGETS (The Upgrade)
    # We replace the static enum list with the rich DB definitions if available.
    try:
        live_widgets = await WidgetService.get_widgets(db)
        if live_widgets:
            # Transform to strict schema for AI consumption
            serialized_widgets = [WidgetRead.model_validate(w).model_dump(mode='json') for w in live_widgets]
            caps["widgets"] = serialized_widgets
            logger.debug(f"🧠 [Capabilities] Injected {len(live_widgets)} dynamic widgets.")
        else:
            # Fallback (or empty if none registered)
            # We keep the static enum as a fallback if the DB is empty
            pass
    except Exception as e:
        logger.error(f"⚠️ [Capabilities] Failed to load Dynamic Widgets: {e}")
        # Fail open: Return static caps, don't crash the endpoint

    return caps

@router.get("/pulse", response_model=Dict[str, Any])
async def get_system_pulse(db: AsyncSession = Depends(get_db)) -> Any:
    return await SystemState.get_pulse(db)

# --- DOMAIN GOVERNANCE (Legacy/High-Level) ---

@router.get("/domains", response_model=List[Dict[str, Any]])
async def list_domains(db: AsyncSession = Depends(get_db)) -> Any:
    return await GovernanceService.list_domains(db)

@router.patch("/domains/{key}")
async def patch_domain(
    key: str, 
    payload: Dict[str, Any] = Body(...), 
    db: AsyncSession = Depends(get_db)
) -> Any:
    try:
        return await GovernanceService.patch_domain(db, key, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- HYPERVISOR CIRCUITS (Direct Control) ---

@router.get("/circuits", response_model=List[Dict[str, Any]])
async def list_circuits(
    plane: Optional[str] = Query(None),
    module_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Fetches raw Circuit Breakers.
    Useful for listing 'Screens' or 'Standalone' features.
    """
    stmt = select(CircuitBreaker)
    if plane:
        stmt = stmt.where(CircuitBreaker.plane == plane)
    if module_type:
        stmt = stmt.where(CircuitBreaker.module_type == module_type)
    
    result = await db.execute(stmt.order_by(CircuitBreaker.target))
    circuits = result.scalars().all()

    # Simple serialization
    return [
        {
            "id": c.id,
            "target": c.target,
            "plane": c.plane,
            "status": c.status,
            "module_type": c.module_type,
            "updated_at": c.updated_at
        } 
        for c in circuits
    ]

@router.patch("/circuits")
async def set_circuit_state(
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Directly toggles a switch in the Hypervisor.
    Payload: { target: str, plane: str, status: 'NOMINAL' | 'HALTED' }
    """
    target = payload.get("target")
    plane = payload.get("plane")
    status = payload.get("status")
    
    if not all([target, plane, status]):
        raise HTTPException(status_code=400, detail="Missing required fields: target, plane, status")

    try:
        updated = await SystemHypervisor.set_state(db, target, plane, status, "Admin Console Override")
        return {
            "target": updated.target,
            "plane": updated.plane,
            "status": updated.status,
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- SYSTEM CONFIG ---

@router.get("/config", response_model=List[Dict[str, Any]])
async def list_config(db: AsyncSession = Depends(get_db)) -> Any:
    return await GovernanceService.list_config(db)

@router.patch("/config/{key}")
async def update_config(
    key: str,
    payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db)
) -> Any:
    try:
        value = payload.get("value")
        if value is None:
            raise HTTPException(status_code=400, detail="Missing 'value' field")
        return await GovernanceService.update_config(db, key, str(value))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

