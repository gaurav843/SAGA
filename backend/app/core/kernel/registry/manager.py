# FILEPATH: backend/app/core/kernel/registry/manager.py
# @file: Kernel Registry Manager
# @author: The Engineer (ansav8@gmail.com)
# @description: Orchestrates the synchronization between Code (Python) and State (DB).
# Maintains the "Active Registry" of all system capabilities.
# @security-level: LEVEL 9 (System Boot)
# @updated: Implemented 'get_schema' and 'refresh_from_db' to fix System Manifest crash.

import logging
from typing import Dict, List, Optional, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.sql import func
from sqlalchemy.orm import joinedload

from app.core.kernel.registry.base import DomainContext
from app.core.kernel.registry.schemas import DomainSummary
from app.domains.system.models import KernelDomain, KernelScope, KernelEntity

logger = logging.getLogger("core.kernel.registry")

class RegistryManager:
    _instance = None
    _domains: Dict[str, DomainContext] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RegistryManager, cls).__new__(cls)
        return cls._instance

    def register(self, context: DomainContext):
        """Code-First Registration (during boot)."""
        # Validate v3 Contract
        context.validate()
        self._domains[context.domain_key] = context
        logger.debug(f"🔌 [Registry] Mounted Domain: {context.domain_key} ({len(context.entities)} Entities)")

    def get_domain(self, key: str) -> Optional[DomainContext]:
        """Direct access to the Domain Context by key (UPPERCASE)."""
        return self._domains.get(key)

    def get_schema(self, key: str) -> Dict[str, Any]:
        """
        Retrieves the Static Schema for a Domain.
        ⚡ FUSION POINT: This delegates to the Domain's 'schema_provider'.
        This allows complex domains (like Auth) to define exactly what fields are exposed.
        """
        ctx = self.get_domain(key)
        if not ctx:
            logger.warning(f"⚠️ [Registry] Schema requested for unknown domain: {key}")
            return {}

        if not ctx.schema_provider:
            logger.debug(f"ℹ️ [Registry] Domain {key} has no schema provider.")
            return {}

        try:
            # ⚡ EXECUTE CONTRACT
            # We pass the discriminator (default "DEFAULT") to allow polymorphic schemas
            return ctx.schema_provider(ctx.schema_discriminator)
        except Exception as e:
            logger.error(f"🔥 [Registry] Schema Provider failed for {key}: {e}", exc_info=True)
            return {}
        
    async def refresh_from_db(self, db: AsyncSession):
        """
        Syncs the In-Memory Registry with the Database State.
        Updates 'is_active' flags based on Admin overrides in 'kernel_domains'.
        """
        try:
            # Fetch only active keys from the DB to determine current state
            stmt = select(KernelDomain.key).where(KernelDomain.is_active == True)
            result = await db.execute(stmt)
            active_keys = set(result.scalars().all())

            updated_count = 0
            for key, ctx in self._domains.items():
                # If key is in active_keys, it's active. Otherwise, it's disabled.
                new_state = key in active_keys
                
                if ctx.is_active != new_state:
                    ctx.is_active = new_state
                    updated_count += 1
            
            if updated_count > 0:
                logger.info(f"🔄 [Registry] Refreshed state. {updated_count} domains updated.")

        except Exception as e:
            logger.error(f"🔥 [Registry] Refresh Failed: {e}")
            # Fail Open: Don't disable everything if DB fails
            pass

    async def get_all_summaries(self, db: AsyncSession) -> List[DomainSummary]:
        """
        Returns full domain state including Dynamic Type Metadata.
        ⚡ UPDATED: Accepts db session to hydrate definitions from SQL.
        """
        # ⚡ Eager load the 'type_def' and 'scopes' relationships
        stmt = (
            select(KernelDomain)
            .options(
                joinedload(KernelDomain.scopes),
                joinedload(KernelDomain.type_def) 
            )
            .where(KernelDomain.is_active == True)
            .order_by(KernelDomain.system_module, KernelDomain.key)
        )

        result = await db.execute(stmt)
        domains = result.unique().scalars().all()
        
        # Pydantic 'from_attributes=True' handles the mapping automatically
        # (e.g. type_key -> type)
        return [DomainSummary.model_validate(d) for d in domains]

    async def sync_to_db(self, db: AsyncSession):
        """
        Ensures the Database matches the Code.
        Writes Domains -> Entities -> Scopes -> Impacts.
        """
        logger.info("🔮 [Registry] Synchronizing Kernel Topology...")

        try:
            for key, ctx in self._domains.items():
                
                # --- 1. SYNC DOMAIN ---
                # ⚡ FIX: Handle Enum or String for domain_type
                type_val = ctx.domain_type
                if hasattr(type_val, "value"):
                    type_val = type_val.value

                domain_stmt = insert(KernelDomain).values(
                    key=ctx.domain_key,
                    label=ctx.friendly_name,
                    system_module=ctx.system_module,
                    module_label=ctx.module_label,
                    module_icon=ctx.module_icon,
                    parent_domain=ctx.parent_domain,
                    is_active=ctx.is_active,
                    type_key=type_val or "STANDARD" 
                ).on_conflict_do_update(
                    index_elements=['key'],
                    set_={
                        "label": ctx.friendly_name,
                        "system_module": ctx.system_module,
                        "module_label": ctx.module_label,
                        "module_icon": ctx.module_icon,
                        "parent_domain": ctx.parent_domain,
                        "type_key": type_val or "STANDARD",
                        "updated_at": func.now()
                    }
                )
                await db.execute(domain_stmt)

                # --- 2. SYNC ENTITIES (v3) ---
                for entity_key, model_cls in ctx.entities.items():
                    table_name = getattr(model_cls, "__tablename__", "unknown")
                    # Construct full python path if possible
                    model_path = f"{model_cls.__module__}.{model_cls.__name__}"
                    
                    entity_stmt = insert(KernelEntity).values(
                        domain_key=ctx.domain_key,
                        key=entity_key,
                        table_name=table_name,
                        model_path=model_path,
                        is_root=(entity_key == "ROOT"),
                        is_active=True
                    ).on_conflict_do_update(
                        constraint='uq_kernel_entity_domain_key',
                        set_={
                            "table_name": table_name,
                            "model_path": model_path
                        }
                    )
                    await db.execute(entity_stmt)

                # --- 3. SYNC SCOPES ---
                for scope in ctx.supported_scopes:
                    # Handle Tuple Routing (Legacy/v2 shim) or Dict (v3)
                    if isinstance(scope, tuple):
                        # ("DOMAIN", {config})
                        # If routing matches current domain, use it.
                        if scope[0] != ctx.domain_key:
                            continue
                        scope_data = scope[1]
                    else:
                        scope_data = scope

                    scope_key = scope_data.get("key")
                    if not scope_key: continue

                    # v3 Validation: Check Target Entity
                    target_entity = scope_data.get("target_entity")
                    if target_entity and target_entity not in ctx.entities:
                        logger.warning(f"⚠️ [Registry] Integrity Warning: Scope '{scope_key}' targets unknown entity '{target_entity}' in domain '{ctx.domain_key}'.")

                    scope_stmt = insert(KernelScope).values(
                        domain_key=ctx.domain_key,
                        key=scope_key,
                        label=scope_data.get("label", scope_key),
                        type=scope_data.get("type", "GENERIC"),
                        scope_mode=scope_data.get("mode", "VIEW"),
                        target_entity=target_entity,
                        target_field=scope_data.get("target_field"),
                        config=scope_data.get("config", {})
                    ).on_conflict_do_update(
                        constraint='uq_kernel_scope_domain_key', 
                        set_={
                            "label": scope_data.get("label"),
                            "config": scope_data.get("config", {}),
                            "target_entity": target_entity,
                            "updated_at": func.now()
                        }
                    )
                    await db.execute(scope_stmt)

            await db.commit()
            logger.info("✅ [Registry] Kernel Topology Synced.")

        except Exception as e:
            await db.rollback()
            logger.critical(f"🔥 [Registry] Sync Failed: {e}")
            raise e

# Singleton
domain_registry = RegistryManager()

