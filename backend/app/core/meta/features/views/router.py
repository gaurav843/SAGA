# FILEPATH: backend/app/core/meta/features/views/router.py
# @file View Engine Controller
# @author The Engineer
# @description Dedicated API Router for the View Subsystem.
#              Lives INSIDE the Feature Module (Fractal Design).
#              UPDATED: Added DELETE /bindings/{id} endpoint for Smart Unbind.

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.session import get_db
from app.core.meta.features.views.service import ViewService
from app.core.meta.features.views.schemas import (
    ViewCreate, ViewUpdate, ViewRead, ViewBindingCreate, ViewBindingRead
)

# ⚡ The Router is isolated to this Feature
router = APIRouter()

# ==============================================================================
#  VIEW DEFINITIONS
# ==============================================================================

@router.post(
    "/",
    response_model=ViewRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register View Layout"
)
async def create_view(
    payload: ViewCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await ViewService.create_view_async(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get(
    "/",
    response_model=List[ViewRead],
    summary="List Layouts"
)
async def list_views(
    engine: Optional[str] = Query(None, description="Filter by Engine (FORM_IO, TANSTACK_TABLE)"),
    db: AsyncSession = Depends(get_db)
):
    return await ViewService.get_views(db, engine)

@router.patch(
    "/{view_id}",
    response_model=ViewRead,
    summary="Update View Layout"
)
async def update_view(
    view_id: int = Path(..., description="ID of the View to update"),
    payload: ViewUpdate = ...,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await ViewService.update_view_async(db, view_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# ==============================================================================
#  VIEW BINDINGS
# ==============================================================================

@router.post(
    "/bindings",
    response_model=ViewBindingRead,
    status_code=status.HTTP_201_CREATED,
    summary="Bind View to Context"
)
async def bind_view(
    payload: ViewBindingCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await ViewService.create_binding(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get(
    "/bindings",
    response_model=List[ViewBindingRead],
    summary="List View Bindings"
)
async def list_bindings(
    domain: str = Query(..., description="Filter by Domain"),
    state: Optional[str] = Query(None, description="Filter by State (Optional)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the routing table for UI views.
    Used by the Switchboard to show which screens are active.
    """
    return await ViewService.get_bindings(db, domain, state)

@router.delete(
    "/bindings/{binding_id}",
    status_code=status.HTTP_200_OK,
    summary="Unbind View (Smart Delete)"
)
async def delete_binding(
    binding_id: int = Path(...),
    db: AsyncSession = Depends(get_db)
):
    try:
        result_status = await ViewService.delete_binding(db, binding_id)
        if not result_status:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Binding not found")
        
        return {
            "status": result_status,
            "message": f"Binding successfully {result_status.lower()}."
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# ==============================================================================
#  RUNTIME RESOLUTION (The Brain)
# ==============================================================================

@router.get(
    "/resolve",
    response_model=ViewRead,
    summary="Resolve Best View (Runtime)",
    description="Determines the optimal Layout based on User Role and Entity State."
)
async def resolve_view(
    domain: str = Query(..., description="Target Module"),
    state: Optional[str] = Query(None, description="Current Entity State (e.g. GATED_IN)"),
    # In a real app, role comes from the JWT Token. 
    # We allow explicit override here for testing/simulation.
    role: Optional[str] = Query(None, description="User Role override"),
    db: AsyncSession = Depends(get_db)
):
    result = await ViewService.resolve_view(db, domain, state, role)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No matching view found for this context.")
    return result

