# FILEPATH: backend/app/domains/workspace/service.py
# @file: Workspace Service (v3.2 - SSOT Enums)
# @author: The Engineer
# @description: Manages snapshots and layout resolution.
# @updated: Replaced hardcoded strings with ScopeType Enum for Brick filtering.

import logging
from typing import List, Optional, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import selectinload

from app.domains.workspace.models import Screen, ActiveApp, Release, ReleaseItem
from app.domains.workspace.schemas import (
    ScreenCreate, ScreenUpdate, 
    ActiveAppCreate, ActiveAppUpdate,
    ReleaseCreate
)
from app.domains.system.models import KernelScope
from app.core.meta.constants import ScopeType # ⚡ SSOT IMPORT

logger = logging.getLogger("domains.workspace.service")

class WorkspaceService:
    
    # --- 1. SCREEN CRUD ---
    @staticmethod
    async def create_screen(db: AsyncSession, payload: ScreenCreate) -> Screen:
        stmt = select(Screen).where(Screen.route_slug == payload.route_slug)
        if (await db.execute(stmt)).scalars().first():
            raise ValueError(f"Screen with route '/{payload.route_slug}' already exists.")

        screen = Screen(**payload.model_dump())
        db.add(screen)
        try:
            await db.commit()
            await db.refresh(screen)
            return screen
        except Exception as e:
            await db.rollback()
            raise e

    @staticmethod
    async def list_screens(db: AsyncSession) -> List[Screen]:
        # ⚡ ENRICHMENT: Eager load live_release to show version info in Lobby
        # ⚡ SORTING: Show most recently updated screens first
        stmt = (
            select(Screen)
            .options(selectinload(Screen.live_release))
            .order_by(Screen.updated_at.desc())
        )
        return (await db.execute(stmt)).scalars().all()

    # --- 2. APP REGISTRY ---
    @staticmethod
    async def list_available_bricks(db: AsyncSession) -> Dict[str, Any]:
        # ⚡ FILTER: Only UI-compatible bricks (Use Enum SSOT)
        # We explicitly exclude ScopeType.JOB as it's a backend-only construct
        stmt = select(KernelScope).where(
            KernelScope.type.in_([
                ScopeType.WIZARD, 
                ScopeType.VIEW, 
                ScopeType.CONTAINER,
                ScopeType.DASHBOARD
            ])
        ).order_by(KernelScope.domain_key, KernelScope.label)
        
        result = await db.execute(stmt)
        bricks = result.scalars().all()
        items = [{
            "id": b.id, "key": b.key, "label": b.label, 
            "type": b.type, "domain": b.domain_key, "config": b.config
        } for b in bricks]
        return {"items": items, "count": len(items)}

    @staticmethod
    async def install_app(db: AsyncSession, payload: ActiveAppCreate) -> ActiveApp:
        if not await db.get(Screen, payload.screen_id): raise ValueError("Screen not found")
        if not await db.get(KernelScope, payload.scope_id): raise ValueError("Scope not found")
        app = ActiveApp(**payload.model_dump())
        db.add(app)
        
        # ⚡ TOUCH PARENT: Update screen.updated_at so it moves to top of list
        await db.execute(
            update(Screen)
            .where(Screen.id == payload.screen_id)
            .values(updated_at=func.now())
        )

        await db.commit(); await db.refresh(app); return app

    @staticmethod
    async def update_app(db: AsyncSession, app_id: int, payload: ActiveAppUpdate) -> Optional[ActiveApp]:
        app = await db.get(ActiveApp, app_id)
        if not app: return None
        for k, v in payload.model_dump(exclude_unset=True).items(): setattr(app, k, v)
        
        # ⚡ TOUCH PARENT
        await db.execute(
            update(Screen)
            .where(Screen.id == app.screen_id)
            .values(updated_at=func.now())
        )

        await db.commit(); await db.refresh(app); return app

    @staticmethod
    async def uninstall_app(db: AsyncSession, app_id: int) -> bool:
        app = await db.get(ActiveApp, app_id)
        if not app: return False
        
        screen_id = app.screen_id
        await db.delete(app)
        
        # ⚡ TOUCH PARENT
        await db.execute(
            update(Screen)
            .where(Screen.id == screen_id)
            .values(updated_at=func.now())
        )
        
        await db.commit(); return True

    # --- 3. VERSION CONTROL ---
    @staticmethod
    async def publish_release(db: AsyncSession, screen_id: int, payload: ReleaseCreate) -> Release:
        screen = await db.get(Screen, screen_id)
        if not screen: raise ValueError(f"Screen ID {screen_id} not found.")

        # Auto-increment internal counter
        stmt_ver = select(func.max(Release.version)).where(Release.screen_id == screen_id)
        current_max = (await db.execute(stmt_ver)).scalar() or 0
        new_version = current_max + 1

        release = Release(
            screen_id=screen_id,
            version=new_version,
            version_label=payload.version_label, 
            description=payload.description
        )
        db.add(release)
        await db.flush()

        # Snapshot Logic
        stmt_apps = select(ActiveApp).where(ActiveApp.screen_id == screen_id, ActiveApp.is_active == True)
        draft_apps = (await db.execute(stmt_apps)).scalars().all()

        snapshot_count = 0
        for draft in draft_apps:
            item = ReleaseItem(
                release_id=release.id,
                original_app_id=draft.id,
                scope_key="UNKNOWN", scope_type="UNKNOWN",
                config=draft.config, placement=draft.placement,
                parent_context_id=draft.parent_app_id 
            )
            scope = await db.get(KernelScope, draft.scope_id)
            if scope:
                item.scope_key = scope.key
                item.scope_type = scope.type
            db.add(item)
            snapshot_count += 1

        screen.live_release_id = release.id
        screen.updated_at = func.now() # Update timestamp

        try:
            await db.commit()
            await db.refresh(release)
            logger.info(f"🎉 [Workspace] Published {payload.version_label} (v{new_version})")
            return release
        except Exception as e:
            await db.rollback()
            logger.error(f"Publish Failed: {e}")
            raise e

    @staticmethod
    async def list_releases(db: AsyncSession, screen_id: int) -> List[Release]:
        return (await db.execute(select(Release).where(Release.screen_id == screen_id).order_by(Release.version.desc()))).scalars().all()

    @staticmethod
    async def resolve_layout(db: AsyncSession, route_slug: str, mode: str = "DRAFT") -> Dict[str, Any]:
        stmt_screen = select(Screen).where(Screen.route_slug == route_slug)
        screen = (await db.execute(stmt_screen)).scalars().first()
        if not screen: return None

        layout = {}
        # ⚡ HISTORY LOOKUP: Fetch the absolute latest release to inform the UI
        stmt_latest = select(Release).where(Release.screen_id == screen.id).order_by(Release.version.desc()).limit(1)
        latest_release = (await db.execute(stmt_latest)).scalar_one_or_none()

        meta = {
            "mode": mode, 
            "version": "DRAFT", 
            "release_id": None,
            "latest_version": latest_release.version_label if latest_release else "0.0.0",
            "latest_description": latest_release.description if latest_release else "Initial Draft"
        }

        # MODE: LIVE (Render from Snapshot)
        if mode == "LIVE" and screen.live_release_id:
            release = await db.get(Release, screen.live_release_id)
            if release:
                meta["version"] = release.version_label or f"v{release.version}"
                meta["release_id"] = release.id
            
            stmt_items = select(ReleaseItem).where(ReleaseItem.release_id == screen.live_release_id)
            items = (await db.execute(stmt_items)).scalars().all()
            for item in items:
                zone = item.placement.get("zone", "UNASSIGNED")
                if zone not in layout: layout[zone] = []
                layout[zone].append({
                    "id": item.original_app_id, 
                    "key": f"APP_{item.original_app_id}",
                    "label": item.config.get("label"),
                    "icon": item.config.get("icon"),
                    "type": item.scope_type,
                    "scope_key": item.scope_key,
                    "intent": item.config.get("intent", {}),
                    "order": item.placement.get("order", 0),
                    "parent_app_id": item.parent_context_id
                })

        # MODE: DRAFT (Render from ActiveApps)
        else:
            stmt_apps = select(ActiveApp).options(selectinload(ActiveApp.scope_def)).where(
                ActiveApp.screen_id == screen.id, ActiveApp.is_active == True
            )
            apps = (await db.execute(stmt_apps)).scalars().all()
            for app in apps:
                zone = app.placement.get("zone", "UNASSIGNED")
                if zone not in layout: layout[zone] = []
                layout[zone].append({
                    "id": app.id,
                    "key": f"APP_{app.id}",
                    "label": app.config.get("label") or app.scope_def.label,
                    "icon": app.config.get("icon") or "AppstoreOutlined",
                    "type": app.scope_def.type,
                    "scope_key": app.scope_def.key,
                    "intent": app.config.get("intent", {}),
                    "order": app.placement.get("order", 0),
                    "parent_app_id": app.parent_app_id 
                })

        for zone in layout:
            layout[zone].sort(key=lambda x: x['order'])
        
        return {
            "screen": {"title": screen.title, "policy": screen.security_policy},
            "meta": meta,
            "layout": layout
        }

