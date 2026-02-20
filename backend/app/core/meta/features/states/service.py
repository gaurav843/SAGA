# FILEPATH: backend/app/core/meta/features/states/service.py
# @file: State Engine Service
# @author: The Engineer
# @description: Manages Lifecycle Flows.
# @security-level: LEVEL 9 (Safety Interlocks)
# @updated: Restored 'get_workflow_types' and wired 'ScopeValidator.validate'.

import logging
from typing import List, Optional
from sqlalchemy import select, update, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.meta.models import StateDefinition
from app.core.meta.features.states.models import WorkflowType # ⚡ RESTORED IMPORT
from app.domains.system.models import KernelScope 
from app.core.meta.features.states.schemas import StateMachineCreate
from app.core.meta.features.states.logic.validator import ScopeValidator

logger = logging.getLogger("core.meta.states")

class StateService:

    @staticmethod
    async def get_workflow_types(db: AsyncSession) -> List[WorkflowType]:
        """
        Retrieves the catalogue of available Workflow "Animals" (e.g. WIZARD, JOB).
        Used by the Frontend to dynamically render the "Create New" menu.
        """
        # Order by key for consistent UI rendering
        stmt = select(WorkflowType).order_by(WorkflowType.key)
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def create_machine(db: AsyncSession, payload: StateMachineCreate) -> StateDefinition:
        """
        Registers a State Machine (Ledger Strategy).
        1. Validate against Kernel Registry (Level 7) - NOW DYNAMIC.
        2. Archive Old Versions.
        3. Insert New Version (Auto-SemVer).
        """
        logger.info(f"🧬 [StateEngine] Ratifying Process: {payload.domain}/{payload.scope}")

        try:
            # --- 0. LEVEL 7 INTEGRITY CHECK ---
            scope_stmt = select(KernelScope).where(
                KernelScope.domain_key == payload.domain,
                KernelScope.key == payload.scope
            )
            scope_result = await db.execute(scope_stmt)
            kernel_scope = scope_result.scalars().first()

            if not kernel_scope:
                logger.warning(f"⚠️ [StateEngine] Scope '{payload.scope}' not found in Registry. Skipping strict validation.")
            else:
                logger.info(f"⚖️ [StateEngine] Validating against Scope Type: {kernel_scope.type}")
                
                # ⚡ UPDATE: Pass 'db' to allow dynamic rule lookup
                await ScopeValidator.validate(db, payload.definition, kernel_scope.type)
                
                if kernel_scope.target_field and kernel_scope.target_field != payload.governed_field:
                    logger.warning(f"⚠️ [StateEngine] Payload target '{payload.governed_field}' differs from Registry '{kernel_scope.target_field}'.")

            # --- 1. Determine Next Version (SemVer + Legacy) ---
            # We fetch the absolute latest version to calculate the increment
            stmt = select(StateDefinition).where(
                StateDefinition.entity_key == payload.domain,
                StateDefinition.scope == payload.scope
            ).order_by(
                desc(StateDefinition.version_major),
                desc(StateDefinition.version_minor),
                desc(StateDefinition.version_patch)
            ).limit(1)
            
            result = await db.execute(stmt)
            latest = result.scalars().first()
            
            if latest:
                # Patch Increment Strategy (1.0.0 -> 1.0.1)
                new_major = latest.version_major
                new_minor = latest.version_minor
                new_patch = latest.version_patch + 1
                next_legacy_ver = (latest.version or 0) + 1
            else:
                # Initialize at 1.0.0
                new_major = 1
                new_minor = 0
                new_patch = 0
                next_legacy_ver = 1

            # --- 2. Archive Old Versions ---
            if latest:
                archive_stmt = update(StateDefinition).where(
                    StateDefinition.entity_key == payload.domain,
                    StateDefinition.scope == payload.scope,
                    StateDefinition.is_active == True
                ).values(is_active=False)
                await db.execute(archive_stmt)

            # --- 3. Create New Version ---
            db_obj = StateDefinition(
                entity_key=payload.domain,
                scope=payload.scope,
                name=payload.name,
                initial_state=payload.definition.get("initial"),
                transitions=payload.definition, 
                
                # SemVer
                version_major=new_major,
                version_minor=new_minor,
                version_patch=new_patch,
                
                # Legacy
                version=next_legacy_ver,
                
                is_active=True,   
                governed_field=payload.governed_field
            )
            
            db.add(db_obj)
            await db.commit()
            await db.refresh(db_obj)
            
            logger.info(f"✅ [StateEngine] Ratified Version {new_major}.{new_minor}.{new_patch}: {payload.domain}/{payload.scope}")
            return db_obj

        except Exception as e:
            await db.rollback()
            logger.error(f"🔥 [StateEngine] Ratification Failed: {str(e)}")
            raise e

    @staticmethod
    async def get_machines(db: AsyncSession, domain: Optional[str] = None) -> List[StateDefinition]:
        query = select(StateDefinition).where(StateDefinition.is_active == True)
        if domain:
            query = query.where(StateDefinition.entity_key == domain)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_machine_by_scope(db: AsyncSession, domain: str, scope: str, version: Optional[int] = None) -> Optional[StateDefinition]:
        stmt = select(StateDefinition).where(
            StateDefinition.entity_key == domain,
            StateDefinition.scope == scope
        )
        if version:
            stmt = stmt.where(StateDefinition.version == version)
        else:
            stmt = stmt.where(StateDefinition.is_active == True)

        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def get_machine_history(db: AsyncSession, domain: str, scope: str) -> List[StateDefinition]:
        stmt = select(StateDefinition).where(
            StateDefinition.entity_key == domain,
            StateDefinition.scope == scope
        ).order_by(
            desc(StateDefinition.version_major),
            desc(StateDefinition.version_minor),
            desc(StateDefinition.version_patch)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def delete_machine(db: AsyncSession, id: int) -> bool:
        """
        Safe Deletion Protocol.
        """
        workflow = await db.get(StateDefinition, id)
        if not workflow: 
            return False

        logger.info(f"🗑️ [StateEngine] Requesting deletion of {workflow.entity_key}/{workflow.scope}...")

        try:
            from app.domains.workspace.models import ActiveApp
            
            scope_stmt = select(KernelScope.id).where(
                KernelScope.domain_key == workflow.entity_key,
                KernelScope.key == workflow.scope
            )
            scope_id_res = await db.execute(scope_stmt)
            scope_id = scope_id_res.scalar()

            if scope_id:
                usage_stmt = select(ActiveApp).where(
                    ActiveApp.scope_id == scope_id,
                    ActiveApp.is_active == True
                )
                usage_res = await db.execute(usage_stmt)
                active_app = usage_res.scalars().first()

                if active_app:
                    msg = f"⛔ Blocked: Workflow is used by App #{active_app.id} on Screen #{active_app.screen_id}."
                    logger.warning(msg)
                    raise ValueError(msg)
            
        except ValueError as ve:
            raise ve
        except ImportError:
            pass
        except Exception as e:
            logger.error(f"🔥 [StateEngine] Dependency Check Failed: {e}")
            raise ValueError("System Error during dependency check.")

        await db.delete(workflow)
        await db.commit()
        return True

