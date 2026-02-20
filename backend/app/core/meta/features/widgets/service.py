# FILEPATH: backend/app/core/meta/features/widgets/service.py
# @file: Widget Registry Service
# @author: The Engineer
# @description: Manages the Catalog of UI Components.

import logging
from typing import List, Optional
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.meta.features.widgets.models import WidgetDefinition
from app.core.meta.features.widgets.schemas import WidgetCreate, WidgetUpdate

logger = logging.getLogger("core.meta.widgets")

class WidgetService:
    
    @staticmethod
    async def register_widget(db: AsyncSession, payload: WidgetCreate) -> WidgetDefinition:
        """
        Creates a new Widget Definition (v1.0.0).
        """
        # Uniqueness Check (Key only)
        stmt = select(WidgetDefinition).where(
            WidgetDefinition.key == payload.key,
            WidgetDefinition.is_latest == True
        )
        existing = await db.execute(stmt)
        if existing.scalars().first():
            raise ValueError(f"Widget '{payload.key}' already exists.")

        db_obj = WidgetDefinition(
            **payload.model_dump(),
            version_major=1,
            version_minor=0,
            version_patch=0,
            is_latest=True,
            is_active=True
        )
        
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        logger.info(f"🧱 [WidgetRegistry] Registered: {payload.key}")
        return db_obj

    @staticmethod
    async def get_widgets(db: AsyncSession, category: Optional[str] = None) -> List[WidgetDefinition]:
        """
        Lists all LATEST widgets.
        """
        query = select(WidgetDefinition).where(WidgetDefinition.is_latest == True)
        
        if category:
            query = query.where(WidgetDefinition.category == category)
            
        result = await db.execute(query.order_by(WidgetDefinition.category, WidgetDefinition.key))
        return result.scalars().all()

    @staticmethod
    async def get_widget_by_key(db: AsyncSession, key: str) -> Optional[WidgetDefinition]:
        stmt = select(WidgetDefinition).where(
            WidgetDefinition.key == key,
            WidgetDefinition.is_latest == True
        )
        result = await db.execute(stmt)
        return result.scalars().first()

