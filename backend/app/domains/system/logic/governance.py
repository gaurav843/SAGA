# FILEPATH: backend/app/domains/system/logic/governance.py
# @file: System Governance Logic (State-Aware Edition)
# @author: ansav8@gmail.com
# @description: Manages Domain state and now injects real-time Circuit Breaker status into Scopes.
# @updated: Eager-loads and serializes type_def to prevent Frontend data starvation.

import logging
from typing import List, Optional, Any, Dict
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.inspection import inspect
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.system.models import KernelDomain, SystemConfig, CircuitBreaker
from app.domains.system.logic.hypervisor import SystemHypervisor

logger = logging.getLogger("domains.system.governance")

class GovernanceService:
    @staticmethod
    def _serialize(obj: Any) -> Dict[str, Any]:
        """
        Converts SQLAlchemy models to Dictionary.
        ⚡ LEVEL 9 FIX: Explicitly serialize specific relationships to prevent frontend starvation.
        """
        if not obj: return {}
        data = {c.key: getattr(obj, c.key) for c in inspect(obj).mapper.column_attrs}
        
        # Handle 'scopes' relationship manually
        if hasattr(obj, 'scopes'):
            try:
                scopes = getattr(obj, 'scopes', [])
                if scopes:
                    data['scopes'] = [
                        {c.key: getattr(s, c.key) for c in inspect(s).mapper.column_attrs}
                        for s in scopes
                    ]
            except Exception:
                pass
                
        # ⚡ FIX: Handle 'type_def' relationship manually so UI receives api_strategy
        if hasattr(obj, 'type_def'):
            try:
                type_def = getattr(obj, 'type_def', None)
                if type_def:
                    data['type_def'] = {c.key: getattr(type_def, c.key) for c in inspect(type_def).mapper.column_attrs}
            except Exception:
                pass
                
        return data

    @staticmethod
    async def list_domains(db: AsyncSession) -> List[Dict[str, Any]]:
        """
        Fetches Domains + Scopes + Circuit States.
        ⚡ LEVEL 9 UPDATE: Merges 'sys_circuit_breakers' and eagerly loads 'type_def'.
        """
        # 1. Fetch Hierarchy (Now including type_def)
        stmt = select(KernelDomain).options(
            selectinload(KernelDomain.scopes),
            selectinload(KernelDomain.type_def)
        ).order_by(KernelDomain.key)
        
        result = await db.execute(stmt)
        domains_raw = result.scalars().all()
        
        domains_data = [GovernanceService._serialize(d) for d in domains_raw]

        # 2. Fetch All Circuits (Optimization: Single Query instead of N+1)
        stmt_circuits = select(CircuitBreaker)
        result_circuits = await db.execute(stmt_circuits)
        all_circuits = result_circuits.scalars().all()

        # 3. Create Lookup Map
        # Key: "scope:USER:SIGNUP_FLOW::UI" -> "HALTED"
        circuit_map = {}
        for c in all_circuits:
            key = f"{c.target}::{c.plane}" 
            circuit_map[key] = c.status

        # 4. Inject State into Scopes
        for dom in domains_data:
            if 'scopes' in dom:
                for scope in dom['scopes']:
                    # Reconstruct Target URI
                    target_uri = f"scope:{dom['key']}:{scope['key']}"

                    # Lookup UI State
                    ui_status = circuit_map.get(f"{target_uri}::UI", "NOMINAL")
                    # Lookup API State
                    api_status = circuit_map.get(f"{target_uri}::API", "NOMINAL")
                    
                    # Attach to Scope Object
                    scope['circuit_state'] = {
                        "ui": ui_status,
                        "api": api_status
                    }

        return domains_data

    @staticmethod
    async def patch_domain(db: AsyncSession, key: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        stmt = select(KernelDomain).options(
            selectinload(KernelDomain.scopes),
            selectinload(KernelDomain.type_def)
        ).where(KernelDomain.key == key)
        result = await db.execute(stmt)
        domain = result.scalars().first()
        
        if not domain:
            raise ValueError(f"Domain '{key}' not found.")

        target_uri = f"domain:{key}"

        if "is_active" in payload:
            is_active = payload["is_active"]
            if key == "SYS" and not is_active:
                raise ValueError("⛔ CRITICAL: Cannot disable the System Kernel.")

            domain.is_active = is_active
            
            status = "NOMINAL" if is_active else "HALTED"
            await SystemHypervisor.set_state(db, target_uri, "API", status, "Master Switch Toggle")
            await SystemHypervisor.set_state(db, target_uri, "UI", status, "Master Switch Toggle")
            await SystemHypervisor.set_state(db, target_uri, "WORKER", status, "Master Switch Toggle")
            
            logger.warning(f"🛡️ [Governance] Domain '{key}' Master Status: {status}")

        if "config" in payload and isinstance(payload["config"], dict):
            current_config = dict(domain.config or {})
            new_config = payload["config"]
            updated_config = {**current_config, **new_config}
            domain.config = updated_config
            
            if "ui_enabled" in new_config:
                ui_status = "NOMINAL" if new_config["ui_enabled"] else "HALTED"
                await SystemHypervisor.set_state(db, target_uri, "UI", ui_status, "Manual Override")
                
            if "api_enabled" in new_config:
                api_status = "NOMINAL" if new_config["api_enabled"] else "HALTED"
                await SystemHypervisor.set_state(db, target_uri, "API", api_status, "Manual Override")

            logger.info(f"🔧 [Governance] Domain '{key}' Config Updated.")

        try:
            await db.commit()
            return GovernanceService._serialize(domain)
        except Exception as e:
            await db.rollback()
            raise e

    @staticmethod
    async def list_config(db: AsyncSession) -> List[Dict[str, Any]]:
        result = await db.execute(select(SystemConfig).order_by(SystemConfig.category, SystemConfig.key))
        objects = result.scalars().all()
        return [GovernanceService._serialize(obj) for obj in objects]

    @staticmethod
    async def update_config(db: AsyncSession, key: str, value: str) -> Optional[Dict[str, Any]]:
        result = await db.execute(select(SystemConfig).where(SystemConfig.key == key))
        item = result.scalars().first()
        if not item:
            raise ValueError(f"Config '{key}' not found.")
        
        item.value_raw = str(value)
        
        try:
            await db.commit()
            await db.refresh(item)
            return GovernanceService._serialize(item)
        except Exception as e:
            await db.rollback()
            raise e

