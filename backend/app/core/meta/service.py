# FILEPATH: backend/app/core/meta/service.py
# @file: Meta-Kernel Service (The Librarian)
# @author: The Engineer (ansav8@gmail.com)
# @description: Orchestrates the Lifecycle of Definitions.
# @security-level: LEVEL 9 (Safety Interlocks)
# @updated: Added Tag-Driven Filtering to `get_policies`.

import logging
import jmespath
from typing import List, Optional, Dict, Any

from sqlalchemy import select, delete, or_, desc, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

# ⚡ CORE MODELS
from app.core.meta.models import (
    AttributeDefinition, 
    RuleDefinition, 
    PolicyDefinition, 
    PolicyGroup, 
    PolicyBinding
)
from app.core.meta.schemas import (
    AttributeCreate, AttributeUpdate, RuleCreate,
    PolicyCreate, PolicyUpdate, 
    PolicyGroupCreate, PolicyGroupUpdate, 
    PolicyBindingCreate, PolicyBindingUpdate
)
from app.core.meta.constants import ScopeType
from app.core.meta.engine import policy_engine
from app.core.kernel.registry import domain_registry 

# ⚡ SYSTEM MODELS
from app.domains.system.models import KernelDomain

logger = logging.getLogger("core.meta.service")

class MetaService:
    
    @staticmethod
    def validate_rule_syntax(rules: List[Dict[str, Any]]):
        for i, rule in enumerate(rules):
            logic = rule.get("logic", "")
            if not logic: continue 
            try:
                jmespath.compile(logic)
            except Exception as e:
                raise ValueError(f"Rule #{i+1} has invalid syntax: {logic}. Error: {str(e)}")

    # ==============================================================================
    #  1. POLICY DEFINITIONS
    # ==============================================================================

    @staticmethod
    async def create_policy(db: AsyncSession, payload: PolicyCreate) -> PolicyDefinition:
        query = select(PolicyDefinition).where(
            PolicyDefinition.key == payload.key,
            PolicyDefinition.is_latest == True
        )
        result = await db.execute(query)
        if result.scalars().first():
            raise ValueError(f"Policy with key '{payload.key}' already exists.")

        rules_data = [r.model_dump(mode='json') for r in payload.rules]
        MetaService.validate_rule_syntax(rules_data)

        db_obj = PolicyDefinition(
            key=payload.key,
            name=payload.name,
            description=payload.description,
            resolution=payload.resolution,
            rules=rules_data,
            tags=payload.tags, 
            is_active=payload.is_active,
            version_major=1,
            version_minor=0,
            is_latest=True
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    @staticmethod
    async def update_policy(db: AsyncSession, id: int, payload: PolicyUpdate) -> Optional[PolicyDefinition]:
        parent_policy = await db.get(PolicyDefinition, id)
        if not parent_policy: return None

        new_major = parent_policy.version_major
        new_minor = parent_policy.version_minor + 1
        
        if new_minor >= 100:
            new_major += 1
            new_minor = 0

        update_data = payload.model_dump(exclude_unset=True, mode='json')
        if "rules" in update_data:
            MetaService.validate_rule_syntax(update_data["rules"])

        new_policy = PolicyDefinition(
            key=parent_policy.key,
            name=update_data.get("name", parent_policy.name),
            description=update_data.get("description", parent_policy.description),
            resolution=update_data.get("resolution", parent_policy.resolution),
            rules=update_data.get("rules", parent_policy.rules),
            tags=update_data.get("tags", parent_policy.tags),
            is_active=update_data.get("is_active", parent_policy.is_active),
            version_major=new_major,
            version_minor=new_minor,
            is_latest=True
        )

        try:
            db.add(new_policy)
            await db.flush() 

            parent_policy.is_latest = False

            stmt_promote = update(PolicyBinding).\
                where(PolicyBinding.policy_id == parent_policy.id).\
                values(policy_id=new_policy.id)
            
            await db.execute(stmt_promote)
            
            await db.commit()
            await db.refresh(new_policy)
            await MetaService.invalidate_cache("ALL") 
            return new_policy
        except Exception as e:
            await db.rollback()
            raise e

    @staticmethod
    def dry_run_policy(policy_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        temp_policy = PolicyDefinition(
            key="dry_run_temp",
            rules=policy_data.get("rules", []),
            is_active=True
        )
        result = policy_engine.evaluate(entity={}, policies=[temp_policy], context_override=context)
        return {
            "is_valid": result.is_valid,
            "blocking_errors": result.blocking_errors,
            "warnings": result.warnings,
            "mutations": result.mutations,
            "side_effects": result.side_effects
        }

    @staticmethod
    async def get_policy_history(db: AsyncSession, key: str) -> List[PolicyDefinition]:
        stmt = select(PolicyDefinition).where(
            PolicyDefinition.key == key
        ).order_by(
            desc(PolicyDefinition.version_major), 
            desc(PolicyDefinition.version_minor)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def restore_policy(db: AsyncSession, version_id: int) -> Optional[PolicyDefinition]:
        target_version = await db.get(PolicyDefinition, version_id)
        if not target_version: return None

        stmt_head = select(PolicyDefinition).where(
            PolicyDefinition.key == target_version.key,
            PolicyDefinition.is_latest == True
        )
        result = await db.execute(stmt_head)
        current_head = result.scalars().first()

        if not current_head:
            raise ValueError("Corrupt Timeline: No active head found for this policy.")

        restore_payload = PolicyUpdate(
            name=target_version.name,
            description=f"Restored from v{target_version.version_major}.{target_version.version_minor:02d}. {target_version.description}",
            resolution=target_version.resolution,
            rules=target_version.rules, 
            tags=target_version.tags,
            is_active=True
        )

        return await MetaService.update_policy(db, current_head.id, restore_payload)

    @staticmethod
    async def get_policies(db: AsyncSession, domain: Optional[str] = None) -> List[PolicyDefinition]:
        """
        ⚡ TAG-DRIVEN ARCHITECTURE: Filters policies by their domain tag.
        """
        query = select(PolicyDefinition).where(PolicyDefinition.is_latest == True)
        
        if domain and domain != "ALL":
            # JSONB contains check: tags @> '["domain:XYZ"]'
            query = query.where(PolicyDefinition.tags.contains([f"domain:{domain}"]))
            
        query = query.order_by(PolicyDefinition.key)
        result = await db.execute(query)
        return result.scalars().all()

    # ==============================================================================
    #  2. BINDINGS (SWITCHBOARD)
    # ==============================================================================
    
    @staticmethod
    async def create_binding(db: AsyncSession, payload: PolicyBindingCreate) -> PolicyBinding:
        if payload.policy_id:
            policy = await db.get(PolicyDefinition, payload.policy_id)
            if not policy: raise ValueError("Policy ID not found.")
        
        if payload.policy_group_id:
             group = await db.get(PolicyGroup, payload.policy_group_id)
             if not group: raise ValueError("Group ID not found.")

        binding_data = payload.model_dump(mode='json')
        db_obj = PolicyBinding(**binding_data)
        db.add(db_obj)
        try:
            await db.commit()
            
            stmt = select(PolicyBinding)\
                .options(selectinload(PolicyBinding.policy))\
                .options(selectinload(PolicyBinding.group))\
                .where(PolicyBinding.id == db_obj.id)
                
            result = await db.execute(stmt)
            loaded_obj = result.scalars().first()
            
            await MetaService.invalidate_cache(payload.target_domain)
            return loaded_obj

        except Exception as e:
            await db.rollback()
            raise e

    @staticmethod
    async def update_binding(db: AsyncSession, binding_id: int, payload: PolicyBindingUpdate) -> Optional[PolicyBinding]:
        query = select(PolicyBinding).where(PolicyBinding.id == binding_id)
        result = await db.execute(query)
        db_obj = result.scalars().first()
        if not db_obj: return None

        update_data = payload.model_dump(exclude_unset=True, mode='json')
        for field, value in update_data.items(): setattr(db_obj, field, value)
        await db.commit()
        
        query = select(PolicyBinding)\
            .options(selectinload(PolicyBinding.policy))\
            .options(selectinload(PolicyBinding.group))\
            .where(PolicyBinding.id == binding_id)
            
        result = await db.execute(query)
        loaded_obj = result.scalars().first()
        
        await MetaService.invalidate_cache(db_obj.target_domain)
        return loaded_obj

    @staticmethod
    async def delete_binding(db: AsyncSession, binding_id: int) -> Optional[str]:
        query = select(PolicyBinding).where(PolicyBinding.id == binding_id)
        result = await db.execute(query)
        db_obj = result.scalars().first()
        if not db_obj: return None

        status_action = ""
        if db_obj.is_active:
            db_obj.is_active = False
            status_action = "DEACTIVATED"
        else:
            await db.delete(db_obj)
            status_action = "DELETED"
        await db.commit()
        await MetaService.invalidate_cache(db_obj.target_domain)
        return status_action

    @staticmethod
    async def get_bindings(db: AsyncSession, domain: Optional[str] = None, scope: Optional[str] = None, search: Optional[str] = None) -> List[PolicyBinding]:
        stmt = select(PolicyBinding)\
            .options(selectinload(PolicyBinding.policy))\
            .options(selectinload(PolicyBinding.group))
        
        if domain and domain != "ALL": 
            stmt = stmt.where(PolicyBinding.target_domain == domain)
        if scope and scope != "ALL": 
            stmt = stmt.where(PolicyBinding.target_scope == scope)
            
        if search:
            stmt = stmt.join(PolicyDefinition, isouter=True) 
            stmt = stmt.where(PolicyDefinition.name.ilike(f"%{search}%"))
            
        result = await db.execute(stmt.order_by(desc(PolicyBinding.priority)))
        return result.scalars().all()

    # ==============================================================================
    #  3. ATTRIBUTES (DICTIONARY)
    # ==============================================================================
    
    @staticmethod
    async def create_attribute(db: AsyncSession, payload: AttributeCreate) -> AttributeDefinition:
        domain_query = select(KernelDomain).options(selectinload(KernelDomain.type_def)).where(KernelDomain.key == payload.domain)
        domain_result = await db.execute(domain_query)
        domain_obj = domain_result.scalars().first()

        if domain_obj:
            props = domain_obj.type_def.properties if domain_obj.type_def and domain_obj.type_def.properties else {}
            if not props.get("supports_meta", True): 
                 logger.warning(f"⛔ [Meta] Blocked attribute creation on locked domain: {payload.domain}")
                 raise ValueError(f"Domain '{payload.domain}' ({domain_obj.type_key}) is LOCKED. Custom attributes are forbidden.")

        query = select(AttributeDefinition).where(AttributeDefinition.domain == payload.domain, AttributeDefinition.key == payload.key)
        result = await db.execute(query)
        if result.scalars().first(): raise ValueError(f"Attribute '{payload.key}' already exists.")
        
        db_obj = AttributeDefinition(**payload.model_dump(mode='json'))
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        await MetaService.invalidate_cache(payload.domain)
        return db_obj

    @staticmethod
    async def get_attributes(db: AsyncSession, domain: str, active_only: bool = False) -> List[AttributeDefinition]:
        query = select(AttributeDefinition).where(AttributeDefinition.domain == domain)
        if active_only: query = query.where(AttributeDefinition.is_active == True)
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def update_attribute(db: AsyncSession, id: int, payload: AttributeUpdate) -> Optional[AttributeDefinition]:
        query = select(AttributeDefinition).where(AttributeDefinition.id == id)
        result = await db.execute(query)
        db_obj = result.scalars().first()
        if not db_obj: return None

        update_data = payload.model_dump(exclude_unset=True, mode='json')
        for field, value in update_data.items(): setattr(db_obj, field, value)
        await db.commit()
        await db.refresh(db_obj)
        await MetaService.invalidate_cache(db_obj.domain)
        return db_obj

    @staticmethod
    async def delete_attribute(db: AsyncSession, id: int) -> bool:
        query = select(AttributeDefinition).where(AttributeDefinition.id == id)
        result = await db.execute(query)
        db_obj = result.scalars().first()
        if not db_obj: return False

        if db_obj.is_system: raise ValueError("⛔ System Attributes cannot be deleted.")
        await db.delete(db_obj)
        await db.commit()
        await MetaService.invalidate_cache(db_obj.domain)
        return True

    # ==============================================================================
    #  4. RULES (SIMPLE)
    # ==============================================================================

    @staticmethod
    async def create_rule(db: AsyncSession, payload: RuleCreate) -> RuleDefinition:
        db_obj = RuleDefinition(**payload.model_dump(mode='json'))
        db.add(db_obj)
        await db.commit()
        return db_obj

    @staticmethod
    async def get_rules(db: AsyncSession, domain: str, event_type: Optional[str] = None, scope: Optional[str] = None) -> List[RuleDefinition]:
        query = select(RuleDefinition).where(RuleDefinition.target_domain == domain, RuleDefinition.is_active == True)
        if event_type: query = query.where(RuleDefinition.event_type == event_type)
        if scope: query = query.where(or_(RuleDefinition.scope == scope, RuleDefinition.scope == None))
        result = await db.execute(query.order_by(desc(RuleDefinition.priority)))
        return result.scalars().all()

    # ==============================================================================
    #  5. SYSTEM & REFLECTION (THE FIX)
    # ==============================================================================

    @staticmethod
    async def get_fused_schema(db: AsyncSession, domain: str, active_only: bool = True) -> Dict[str, Any]:
        """
        The Brain: Combines Immutable Code (Registry) with Flexible Data (DB).
        Returns a Frontend-Ready Schema Object.
        """
        try:
            # ⚡ LOGGING: Trace the Fusion Step
            logger.info(f"🧩 [Schema] Fusing domain: {domain}")

            fields = {}

            # 1. FETCH STATIC SCHEMA (The Bedrock)
            logger.debug(f"   ↳ [Schema] Fetching Static Registry for {domain}...")
            static_schema = domain_registry.get_schema(domain)
            
            if static_schema:
                for key, def_ in static_schema.items():
                    fields[key] = {
                        "id": 0, # Static fields don't have a DB ID
                        "key": key,
                        "label": def_.get("label", key),
                        "description": def_.get("description", "System Field"),
                        "data_type": def_.get("data_type", "TEXT"),
                        "widget_type": def_.get("widget_type", "INPUT"),
                        "is_required": def_.get("is_required", False),
                        "is_unique": def_.get("is_unique", False),
                        "is_system": True, # Always system
                        "is_active": True,
                        "read_only": True, # Immutable
                        "configuration": def_.get("configuration", {}),
                        "is_dynamic": False
                    }
                logger.debug(f"   ↳ [Schema] Static Fields Loaded: {len(fields)}")

            # 2. FETCH DYNAMIC SCHEMA (The Overlay)
            logger.debug(f"   ↳ [Schema] Querying Dynamic Attributes...")

            # Use local method to avoid circular dependency issues
            dynamic_attributes = await MetaService.get_attributes(db, domain, active_only=active_only)
            
            for attr in dynamic_attributes:
                # Dynamic overrides Static if key matches
                fields[attr.key] = {
                    "id": attr.id,
                    "key": attr.key,
                    "label": attr.label,
                    "description": attr.description,
                    "data_type": attr.data_type,
                    "widget_type": attr.widget_type,
                    "is_required": attr.is_required,
                    "is_unique": attr.is_unique,
                    "is_system": attr.is_system,
                    "is_active": attr.is_active,
                    "read_only": attr.is_system, 
                    "configuration": attr.configuration,
                    "is_dynamic": True
                }
            logger.debug(f"   ↳ [Schema] Dynamic Attributes Merged: {len(dynamic_attributes)}")
                
            return {"domain": domain, "fields": fields}

        except Exception as e:
            logger.error(f"🔥 [Schema] CRASH in get_fused_schema({domain}): {e}", exc_info=True)
            # Return empty schema instead of crashing, allowing UI to recover
            return {"domain": domain, "fields": {}, "error": str(e)}

    @staticmethod
    async def invalidate_cache(domain: str):
        logger.info(f"🔥 [CACHE] Invalidated for Domain: {domain}")

