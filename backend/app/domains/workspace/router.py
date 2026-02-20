# FILEPATH: backend/app/domains/workspace/router.py
# @file: Workspace Router (v2.2 - SemVer Fix)
# @author: The Engineer
# @description: Exposes Release Management endpoints.
# @updated: Fixed FastAPI deprecation warning (regex -> pattern).

from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.session import get_db
from app.domains.workspace.service import WorkspaceService
from app.domains.workspace.schemas import (
    ScreenCreate, ScreenRead, ScreenList,
    ActiveAppCreate, ActiveAppRead, ActiveAppUpdate,
    BrickList, ReleaseCreate, ReleaseRead
)

router = APIRouter()

# --- EXISTING ENDPOINTS (Condensed) ---

@router.post("/screens", response_model=ScreenRead, status_code=201)
async def create_screen(payload: ScreenCreate, db: AsyncSession = Depends(get_db)):
    try: return await WorkspaceService.create_screen(db, payload)
    except ValueError as e: raise HTTPException(409, str(e))

@router.get("/screens", response_model=ScreenList)
async def list_screens(db: AsyncSession = Depends(get_db)):
    screens = await WorkspaceService.list_screens(db)
    return {"items": screens, "count": len(screens)}

@router.get("/bricks", response_model=BrickList)
async def list_bricks(db: AsyncSession = Depends(get_db)):
    return await WorkspaceService.list_available_bricks(db)

@router.post("/apps", response_model=ActiveAppRead, status_code=201)
async def install_app(payload: ActiveAppCreate, db: AsyncSession = Depends(get_db)):
    try: return await WorkspaceService.install_app(db, payload)
    except Exception as e: raise HTTPException(400, str(e))

@router.patch("/apps/{app_id}", response_model=ActiveAppRead)
async def configure_app(app_id: int, payload: ActiveAppUpdate, db: AsyncSession = Depends(get_db)):
    updated = await WorkspaceService.update_app(db, app_id, payload)
    if not updated: raise HTTPException(404, "App not found")
    return updated

@router.delete("/apps/{app_id}", status_code=204)
async def uninstall_app(app_id: int, db: AsyncSession = Depends(get_db)):
    if not await WorkspaceService.uninstall_app(db, app_id): raise HTTPException(404, "App not found")

# ==============================================================================
#  ⚡ NEW: RELEASE MANAGEMENT
# ==============================================================================

@router.post("/screens/{screen_id}/releases", response_model=ReleaseRead, status_code=201)
async def publish_release(
    screen_id: int, 
    payload: ReleaseCreate, 
    db: AsyncSession = Depends(get_db)
):
    """
    Triggers a Snapshot of the current Draft.
    """
    try:
        return await WorkspaceService.publish_release(db, screen_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Publish failed: {str(e)}")

@router.get("/screens/{screen_id}/releases", response_model=List[ReleaseRead])
async def list_releases(screen_id: int, db: AsyncSession = Depends(get_db)):
    return await WorkspaceService.list_releases(db, screen_id)

# ==============================================================================
#  RUNTIME RESOLUTION (Updated)
# ==============================================================================

@router.get("/layout/{route_slug}")
async def resolve_layout(
    route_slug: str, 
    mode: Optional[str] = Query("DRAFT", pattern="^(DRAFT|LIVE)$"),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the layout tree. 
    - mode=DRAFT (Default): Returns mutable workspace.
    - mode=LIVE: Returns the frozen release pointed to by the screen.
    """
    layout = await WorkspaceService.resolve_layout(db, route_slug, mode)
    if not layout:
        raise HTTPException(status_code=404, detail=f"No layout configured for route '/{route_slug}'")
    return layout

