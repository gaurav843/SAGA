# FILEPATH: backend/app/api/v1/meta.py
# @file: Meta-Kernel API Endpoints
# @author: The Engineer (ansav8@gmail.com)
# @description: Exposes the Definition & Binding Management API.
# @security-level: LEVEL 1 (Domain Access)

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, distinct

from app.core.database.session import get_db
from app.core.meta.service import MetaService
from app.core.meta.schemas import (
    PolicyCreate, PolicyRead, PolicyUpdate,
    PolicyBindingCreate, PolicyBindingRead, PolicyBindingUpdate,
    AttributeCreate, AttributeRead, AttributeUpdate,
    RuleCreate, RuleRead,
    DryRunRequest, DryRunResult
)
from app.core.kernel.registry import domain_registry
from app.core.meta.models import AttributeDefinition

# ⚡ IMPORT FEATURE ROUTERS
from app.core.meta.features.groups.router import router as groups_router
from app.core.meta.features.states.router import router as states_router
from app.core.meta.features.topology.router import router as topology_router # ⚡ NEW

router = APIRouter()

# ⚡ MOUNT FEATURE ROUTERS
router.include_router(groups_router, prefix="/groups", tags=["Policy Groups"])
router.include_router(states_router, prefix="/states", tags=["Workflows"])
router.include_router(topology_router, prefix="/topology", tags=["System Topology"]) # ⚡ MOUNT

# ==============================================================================
#  1. POLICIES (GOVERNANCE)
# ==============================================================================

@router.get("/policies", response_model=List[PolicyRead])
async def list_policies(db: AsyncSession = Depends(get_db)):
    return await MetaService.get_policies(db)

@router.post("/policies", response_model=PolicyRead, status_code=201)
async def create_policy(payload: PolicyCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await MetaService.create_policy(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/policies/{id}", response_model=PolicyRead)
async def update_policy(id: int, payload: PolicyUpdate, db: AsyncSession = Depends(get_db)):
    try:
        updated = await MetaService.update_policy(db, id, payload)
        if not updated:
            raise HTTPException(status_code=404, detail="Policy not found")
        return updated
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/policies/dry-run", response_model=DryRunResult)
async def dry_run_policy(payload: DryRunRequest, db: AsyncSession = Depends(get_db)):
    return MetaService.dry_run_policy(
        policy_data={"rules": [r.model_dump() for r in payload.policy.rules]},
        context=payload.context
    )

@router.get("/policies/{key}/history", response_model=List[PolicyRead])
async def get_policy_history(key: str, db: AsyncSession = Depends(get_db)):
    return await MetaService.get_policy_history(db, key)

@router.post("/policies/{version_id}/restore", response_model=PolicyRead)
async def restore_policy_version(version_id: int, db: AsyncSession = Depends(get_db)):
    try:
        return await MetaService.restore_policy(db, version_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==============================================================================
#  2. BINDINGS (SWITCHBOARD)
# ==============================================================================

@router.get("/bindings", response_model=List[PolicyBindingRead])
async def list_bindings(
    domain: Optional[str] = Query(None, description="Filter by Domain Key"),
    scope: Optional[str] = Query(None, description="Filter by Scope"),
    search: Optional[str] = Query(None, description="Search by Name or Tag"),
    db: AsyncSession = Depends(get_db)
):
    return await MetaService.get_bindings(db, domain=domain, scope=scope, search=search)

@router.post("/bindings", response_model=PolicyBindingRead, status_code=201)
async def create_binding(payload: PolicyBindingCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await MetaService.create_binding(db, payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/bindings/{id}", response_model=PolicyBindingRead)
async def update_binding(id: int, payload: PolicyBindingUpdate, db: AsyncSession = Depends(get_db)):
    updated = await MetaService.update_binding(db, id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Binding not found")
    return updated

@router.delete("/bindings/{id}")
async def delete_binding(id: int, db: AsyncSession = Depends(get_db)):
    status = await MetaService.delete_binding(db, id)
    if not status:
        raise HTTPException(status_code=404, detail="Binding not found")
    return {"message": "Binding removed", "status": status}

# ==============================================================================
#  3. ATTRIBUTES (DICTIONARY)
# ==============================================================================

@router.post("/attributes", response_model=AttributeRead, status_code=201)
async def create_attribute(payload: AttributeCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await MetaService.create_attribute(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/attributes/{id}", response_model=AttributeRead)
async def update_attribute(id: int, payload: AttributeUpdate, db: AsyncSession = Depends(get_db)):
    updated = await MetaService.update_attribute(db, id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Attribute not found")
    return updated

@router.delete("/attributes/{id}")
async def delete_attribute(id: int, db: AsyncSession = Depends(get_db)):
    try:
        success = await MetaService.delete_attribute(db, id)
        if not success:
            raise HTTPException(status_code=404, detail="Attribute not found")
        return {"status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==============================================================================
#  4. RULES (LEGACY / SIMPLE)
# ==============================================================================

@router.get("/rules", response_model=List[RuleRead])
async def list_rules(
    domain: str, 
    event_type: Optional[str] = None,
    scope: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    return await MetaService.get_rules(db, domain, event_type, scope)

@router.post("/rules", response_model=RuleRead, status_code=201)
async def create_rule(payload: RuleCreate, db: AsyncSession = Depends(get_db)):
    return await MetaService.create_rule(db, payload)

# ==============================================================================
#  5. SYSTEM & REFLECTION
# ==============================================================================

@router.get("/schema/{domain}")
async def get_domain_schema(
    domain: str, 
    active_only: bool = Query(True), 
    db: AsyncSession = Depends(get_db)
):
    """
    SCHEMA FUSION ENDPOINT.
    Delegates all logic to MetaService.get_fused_schema.
    """
    return await MetaService.get_fused_schema(db, domain, active_only=active_only)

@router.get("/domains")
async def list_domains(db: AsyncSession = Depends(get_db)):
    # 1. Dynamic Domains from DB (The "Wild" Ones)
    # Allows discovery of domains that exist only via custom attributes
    result = await db.execute(select(distinct(AttributeDefinition.domain)))
    dynamic_domains = result.scalars().all()
    
    # 2. System Domains from Registry (The "Official" Ones)
    # ⚡ FIX: Passing 'db' session as required by the new Manager to fetch Type Defs
    registered_domains = await domain_registry.get_all_summaries(db)
    
    # 3. Merge Strategy
    domain_map = {}
    
    # A. Add Registered Domains (Source of Truth)
    for d in registered_domains:
        # Pydantic model dump to dictionary for mutability
        data = d.model_dump()
        domain_map[data["key"]] = {
            "key": data["key"],
            "label": data["label"],
            "type": data["type"],
            "type_def": data["type_def"], # ⚡ Handshake Payload (Color/Icon)
            "system_module": data.get("system_module", "GENERAL"),
            "module_label": data.get("module_label", "General"),
            "module_icon": data.get("module_icon", "antd:AppstoreOutlined"),
            "icon": data.get("icon"),
            "parent": data.get("parent_domain"),
            "scopes": data["scopes"]
        }
        
    # B. Add Dynamic Domains (if any found that aren't registered)
    for d_key in dynamic_domains:
        if d_key not in domain_map:
            domain_map[d_key] = {
                "key": d_key,
                "label": d_key.replace('_', ' ').title(),
                "type": "STANDARD", # Default assumption for wild domains
                "system_module": "DYNAMIC", 
                "module_label": "Dynamic Data",
                "module_icon": "antd:DatabaseOutlined",
                "icon": "antd:DatabaseOutlined",
                "parent": None,
                "scopes": [{"key": "DEFAULT", "label": "Default Scope", "type": "CONTAINER"}]
            }

    return list(domain_map.values())

