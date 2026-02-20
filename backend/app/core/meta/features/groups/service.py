# FILEPATH: backend/app/core/meta/features/groups/service.py
# @file Policy Group Service
# @author The Engineer (ansav8@gmail.com)
# @description Business Logic for managing Policy Groups (Bundles).
#              Handles Creation, Member Management (Ordering), and Lifecycle.

import logging
from typing import List, Optional
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.meta.models import PolicyGroup, PolicyDefinition
from app.core.meta.schemas import PolicyGroupCreate, PolicyGroupUpdate

logger = logging.getLogger("core.meta.groups")

class GroupService:
    """
    The Librarian. Manages collections of Policies.
    """

    @staticmethod
    def _generate_key(name: str) -> str:
        """Auto-generates a system key from a human name if not provided."""
        return name.upper().replace(" ", "_").replace("-", "_")

    @staticmethod
    async def create_group(db: AsyncSession, payload: PolicyGroupCreate) -> PolicyGroup:
        """
        Creates a new Policy Group.
        Enforces Key Uniqueness.
        """
        # 1. Validate Key Uniqueness
        stmt = select(PolicyGroup).where(PolicyGroup.key == payload.key)
        existing = await db.execute(stmt)
        if existing.scalars().first():
            raise ValueError(f"Group with key '{payload.key}' already exists.")

        # 2. Validate Policy Keys (Optional but recommended)
        # We trust the user provided valid keys, or we could verify them here.
        
        # 3. Create Entity
        db_obj = PolicyGroup(
            key=payload.key,
            name=payload.name,
            description=payload.description,
            policy_keys=payload.policy_keys, # Stores order: ["SECURITY_V1", "LOGGING_V2"]
            is_active=payload.is_active
        )
        
        db.add(db_obj)
        
        try:
            await db.commit()
            await db.refresh(db_obj)
            logger.info(f"📦 [GroupService] Created Bundle: {db_obj.key}")
            return db_obj
        except Exception as e:
            await db.rollback()
            logger.error(f"🔥 [GroupService] Creation Failed: {e}")
            raise e

    @staticmethod
    async def get_groups(db: AsyncSession, active_only: bool = True) -> List[PolicyGroup]:
        """
        Lists all Policy Groups.
        """
        query = select(PolicyGroup)
        if active_only:
            query = query.where(PolicyGroup.is_active == True)
            
        query = query.order_by(PolicyGroup.key)
        
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_group_by_id(db: AsyncSession, group_id: int) -> Optional[PolicyGroup]:
        """
        Fetches a single group.
        """
        return await db.get(PolicyGroup, group_id)

    @staticmethod
    async def update_group(db: AsyncSession, group_id: int, payload: PolicyGroupUpdate) -> Optional[PolicyGroup]:
        """
        Updates metadata or membership order.
        """
        group = await db.get(PolicyGroup, group_id)
        if not group:
            return None

        # Apply Updates
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(group, key, value)

        try:
            await db.commit()
            await db.refresh(group)
            logger.info(f"📝 [GroupService] Updated Group: {group.key}")
            return group
        except Exception as e:
            await db.rollback()
            raise e

    @staticmethod
    async def delete_group(db: AsyncSession, group_id: int) -> bool:
        """
        Soft Delete (Deactivate) or Hard Delete if no dependencies.
        For now, we enforce Soft Delete to protect history.
        """
        group = await db.get(PolicyGroup, group_id)
        if not group:
            return False

        # TODO: Check if bound to any active PolicyBinding before deleting?
        # For Level 5 safety, we just Deactivate.
        group.is_active = False
        
        try:
            await db.commit()
            logger.info(f"🚫 [GroupService] Deactivated Group: {group.key}")
            return True
        except Exception as e:
            await db.rollback()
            raise e

