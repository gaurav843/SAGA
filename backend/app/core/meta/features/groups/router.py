# FILEPATH: backend/app/core/meta/features/groups/router.py
# @file: Policy Group API
# @author: The Engineer (ansav8@gmail.com)
# @description: REST Controller for Policy Bundles.
# Exposes the 'GroupService' to the Frontend.

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.session import get_db
from app.core.meta.schemas import PolicyGroupCreate, PolicyGroupRead, PolicyGroupUpdate
from app.core.meta.features.groups.service import GroupService

# ⚡ Fractal Router (Isolated)
router = APIRouter()

@router.post(
    "",
    response_model=PolicyGroupRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create Policy Group"
)
async def create_group(
    payload: PolicyGroupCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await GroupService.create_group(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "", # ⚡ FIX: Removed trailing slash to prevent 307 Redirect
    response_model=List[PolicyGroupRead],
    summary="List Groups"
)
async def list_groups(
    active: bool = Query(True, description="Filter active groups"),
    db: AsyncSession = Depends(get_db)
):
    return await GroupService.get_groups(db, active_only=active)

@router.get(
    "/{id}",
    response_model=PolicyGroupRead,
    summary="Get Group Details"
)
async def get_group(
    id: int = Path(..., description="Group ID"),
    db: AsyncSession = Depends(get_db)
):
    group = await GroupService.get_group_by_id(db, id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.patch(
    "/{id}",
    response_model=PolicyGroupRead,
    summary="Update Group"
)
async def update_group(
    id: int = Path(...),
    payload: PolicyGroupUpdate = ...,
    db: AsyncSession = Depends(get_db)
):
    updated = await GroupService.update_group(db, id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Group not found")
    return updated


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deactivate Group"
)
async def delete_group(
    id: int = Path(...),
    db: AsyncSession = Depends(get_db)
):
    success = await GroupService.delete_group(db, id)
    if not success:
        raise HTTPException(status_code=404, detail="Group not found")
    return None

