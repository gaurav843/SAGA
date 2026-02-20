# FILEPATH: backend/app/core/meta/features/views/service.py
# @file View Engine Service (The Resolution Logic)
# @author The Engineer (ansav8@gmail.com)
# @description Manages View Definitions and the "Best Match" Resolution Algorithm.
#              UPDATED: Implements "Auto-Live" Versioning Strategy (Fork & Promote).

import logging
from typing import List, Optional, Dict, Any
from sqlalchemy import select, desc, update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.meta.models import ViewDefinition, ViewBinding
from app.core.meta.features.views.schemas import (
    ViewCreate, ViewUpdate, ViewBindingCreate, ViewBindingUpdate
)

logger = logging.getLogger("core.meta.views")

class ViewService:
    """
    The Orchestrator for the UI Backbone.
    """

    # ==========================================================================
    #  1. DEFINITION MANAGEMENT (CRUD)
    # ==========================================================================

    @staticmethod
    async def create_view_async(db: AsyncSession, payload: ViewCreate) -> ViewDefinition:
        # Check Uniqueness (Only check against LATEST)
        stmt = select(ViewDefinition).where(
            ViewDefinition.key == payload.key,
            ViewDefinition.is_latest == True
        )
        existing = await db.execute(stmt)
        if existing.scalars().first():
            raise ValueError(f"View with key '{payload.key}' already exists.")

        # Serialize - by_alias=True ensures 'schema' key is used for DB
        data = payload.model_dump(by_alias=True, mode='json')
        
        # Initial Version: 1.00
        db_obj = ViewDefinition(
            **data,
            version_major=1,
            version_minor=0,
            is_latest=True
        )
        db.add(db_obj)

        try:
            await db.commit()
            await db.refresh(db_obj)
            logger.info(f"🎨 [ViewEngine] Created Layout: {payload.key} (v1.00)")
            return db_obj
        except Exception as e:
            await db.rollback()
            raise e

    @staticmethod
    async def update_view_async(db: AsyncSession, view_id: int, payload: ViewUpdate) -> ViewDefinition:
        """
        AUTO-LIVE STRATEGY:
        1. Fetch current view (Parent).
        2. Calculate next version (v1.05 -> v1.06).
        3. Fork (Create New).
        4. Deprecate Parent.
        5. Auto-Promote Bindings.
        """
        # 1. Fetch Parent
        parent_view = await db.get(ViewDefinition, view_id)
        if not parent_view:
            raise ValueError(f"View ID {view_id} not found.")

        # 2. Calculate Next Version
        major = parent_view.version_major
        minor = parent_view.version_minor + 1
        
        if minor >= 100: # Rollover Rule
            major += 1
            minor = 0

        # 3. Prepare New Data
        new_data = {
            "key": parent_view.key,
            "name": payload.name or parent_view.name,
            "engine": parent_view.engine,
            "schema": payload.schema_config or parent_view.schema, # Use existing if not updated
            "is_active": payload.is_active if payload.is_active is not None else parent_view.is_active,
            "version_major": major,
            "version_minor": minor,
            "is_latest": True
        }

        try:
            # 4. Create New Head
            new_view = ViewDefinition(**new_data)
            db.add(new_view)
            await db.flush() # Flush to get new_view.id

            # 5. Deprecate Parent (Mark as not latest)
            parent_view.is_latest = False
            
            # 6. AUTO-LIVE: Promote Bindings
            # Find all bindings pointing to the OLD view and move them to the NEW view
            binding_stmt = select(ViewBinding).where(ViewBinding.view_id == parent_view.id)
            binding_result = await db.execute(binding_stmt)
            bindings = binding_result.scalars().all()
            
            promoted_count = 0
            for binding in bindings:
                binding.view_id = new_view.id
                promoted_count += 1

            await db.commit()
            await db.refresh(new_view)
            
            logger.info(f"🎨 [ViewEngine] Forked {parent_view.key}: v{parent_view.version_major}.{parent_view.version_minor} -> v{major}.{minor}")
            logger.info(f"🚀 [Auto-Live] Promoted {promoted_count} bindings to v{major}.{minor}")
            
            return new_view

        except Exception as e:
            await db.rollback()
            raise e

    @staticmethod
    async def get_views(db: AsyncSession, engine: Optional[str] = None) -> List[ViewDefinition]:
        # Only return LATEST versions for the list
        query = select(ViewDefinition).where(ViewDefinition.is_latest == True)
        if engine:
            query = query.where(ViewDefinition.engine == engine)
        
        result = await db.execute(query.order_by(ViewDefinition.key))
        return result.scalars().all()

    # ==========================================================================
    #  2. BINDING MANAGEMENT (Association)
    # ==========================================================================

    @staticmethod
    async def create_binding(db: AsyncSession, payload: ViewBindingCreate) -> ViewBinding:
        view = await db.get(ViewDefinition, payload.view_id)
        if not view:
            raise ValueError(f"View ID {payload.view_id} not found.")

        data = payload.model_dump(mode='json')
        db_obj = ViewBinding(**data)
        db.add(db_obj)
        
        await db.commit()
        
        # ⚡ FIX: Eager load the relationship
        stmt = select(ViewBinding).options(selectinload(ViewBinding.view)).where(ViewBinding.id == db_obj.id)
        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def get_bindings(db: AsyncSession, domain: str, state: Optional[str] = None) -> List[ViewBinding]:
        """Retrieves all View Bindings for a given Domain."""
        stmt = select(ViewBinding).options(selectinload(ViewBinding.view))\
            .where(ViewBinding.target_domain == domain)

        if state:
            stmt = stmt.where(ViewBinding.target_state == state)
            
        stmt = stmt.order_by(desc(ViewBinding.priority), ViewBinding.target_state)
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def delete_binding(db: AsyncSession, binding_id: int) -> Optional[str]:
        """
        SMART UNBIND:
        1. If Active -> Set Inactive (Soft Delete / Safety Latch).
        2. If Inactive -> Hard Delete (Clean up).
        """
        query = select(ViewBinding).where(ViewBinding.id == binding_id)
        result = await db.execute(query)
        db_obj = result.scalars().first()

        if not db_obj:
            return None

        status_action = ""

        if db_obj.is_active:
            # PHASE 1: DEACTIVATE
            db_obj.is_active = False
            status_action = "DEACTIVATED"
            logger.info(f"🔌 [ViewEngine] Binding #{binding_id} Deactivated (Safety Latch).")
        else:
            # PHASE 2: HARD DELETE
            await db.delete(db_obj)
            status_action = "DELETED"
            logger.info(f"🗑️ [ViewEngine] Binding #{binding_id} Permanently Removed.")

        await db.commit()
        return status_action

    # ==========================================================================
    #  3. THE RESOLUTION ALGORITHM (The Intelligence)
    # ==========================================================================

    @staticmethod
    async def resolve_view(
        db: AsyncSession, 
        domain: str, 
        state: Optional[str] = None, 
        role: Optional[str] = None
    ) -> Optional[ViewDefinition]:
        """Determines the BEST view for a given context using 'Weighted Specificity'."""
        logger.debug(f"🔍 [ViewResolver] Resolving for Domain={domain}, State={state}, Role={role}")

        # 1. Fetch Candidates (All active bindings for this domain)
        stmt = select(ViewBinding).options(selectinload(ViewBinding.view))\
            .where(ViewBinding.target_domain == domain)\
            .where(ViewBinding.is_active == True)
            
        result = await db.execute(stmt)
        candidates = result.scalars().all()

        if not candidates:
            logger.warning(f"⚠️ [ViewResolver] No bindings found for {domain}")
            return None

        # 2. Score Candidates
        scored_candidates = []
        for binding in candidates:
            # Only consider bindings where the View itself is active
            if not binding.view or not binding.view.is_active:
                continue

            score = 0
            # A. Role Check
            if binding.target_role:
                if binding.target_role == role:
                    score += 1000
                else:
                    continue
            else:
                score += 1

            # B. State Check
            if binding.target_state:
                if binding.target_state == state:
                    score += 100
                else:
                    continue
            else:
                score += 1 

            # C. Priority
            score += (binding.priority or 0)

            scored_candidates.append({"binding": binding, "score": score})

        if not scored_candidates:
            return None

        scored_candidates.sort(key=lambda x: x["score"], reverse=True)
        winner = scored_candidates[0]

        logger.info(f"✅ [ViewResolver] Winner: {winner['binding'].view.key} (Score: {winner['score']})")
        return winner["binding"].view

