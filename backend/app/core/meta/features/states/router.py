# FILEPATH: backend/app/core/meta/features/states/router.py
# @file: State Engine API
# @author: The Engineer
# @description: Endpoints for defining and retrieving Process Flows.
# VERIFIED: Includes all original endpoints + Delete. Fixed duplicate prefix bug.
# @updated: Added GET /types to expose V3 Workflow Definitions.

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.session import get_db
from app.core.meta.features.states.service import StateService
from app.core.meta.features.states.schemas import StateMachineCreate, StateMachineRead, WorkflowTypeRead # ⚡ NEW IMPORT

# ⚡ PREFIX REMOVED: Controlled by meta.py to prevent /api/v1/meta/states/meta/states
router = APIRouter(tags=["Workflow Engine"])

# ==============================================================================
#  ⚡ V3 METADATA (Types)
# ==============================================================================

@router.get(
    "/types", 
    response_model=List[WorkflowTypeRead],
    summary="List Workflow Types",
    description="Returns the available 'Animals' (Wizard, Job, etc.) from the DB."
)
async def list_workflow_types(db: AsyncSession = Depends(get_db)):
    """
    Fetches the Dynamic Workflow Registry (V3).
    Used by the Frontend to render icons, colors, and labels dynamically.
    """
    return await StateService.get_workflow_types(db)

# ==============================================================================
#  WORKFLOW DEFINITIONS
# ==============================================================================

@router.post("", response_model=StateMachineRead, status_code=status.HTTP_201_CREATED)
async def create_state_machine(
    payload: StateMachineCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await StateService.create_machine(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("", response_model=List[StateMachineRead])
async def list_state_machines(
    domain: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    return await StateService.get_machines(db, domain)

@router.get("/{domain}/{scope}", response_model=StateMachineRead)
async def get_flow_definition(
    domain: str = Path(...),
    scope: str = Path(...),
    db: AsyncSession = Depends(get_db)
):
    result = await StateService.get_machine_by_scope(db, domain, scope)
    if not result:
        raise HTTPException(status_code=404, detail="Active Flow not found")
    return result

@router.get("/{domain}/{scope}/history", response_model=List[StateMachineRead])
async def get_flow_history(
    domain: str = Path(...),
    scope: str = Path(...),
    db: AsyncSession = Depends(get_db)
):
    return await StateService.get_machine_history(db, domain, scope)

@router.get("/{domain}/{scope}/{version}", response_model=StateMachineRead)
async def get_flow_version(
    domain: str = Path(...),
    scope: str = Path(...),
    version: int = Path(...),
    db: AsyncSession = Depends(get_db)
):
    result = await StateService.get_machine_by_scope(db, domain, scope, version)
    if not result:
        raise HTTPException(status_code=404, detail="Version not found")
    return result

@router.delete("/{id}")
async def delete_workflow(id: int, db: AsyncSession = Depends(get_db)):
    success = await StateService.delete_machine(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {"status": "deleted"}

