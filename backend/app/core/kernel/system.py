# FILEPATH: backend/app/core/kernel/system.py
# @file: System Kernel Logic
# @role: 🧠 System Brain
# @author: The Engineer
# @description: Aggregates System Capabilities, Context, and Manifest.
# @security-level: LEVEL 0 (Kernel)
# @updated: Integrated NavigationService to inject secured menu structure into the Manifest.

import logging
from typing import Dict, List, Any, Optional
from enum import Enum
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.kernel.registry.manager import RegistryManager
from app.core.kernel.context.manager import context_manager 
from app.domains.system.logic.hypervisor import SystemHypervisor
from app.domains.system.models import CircuitBreaker 

# ⚡ DYNAMIC REGISTRIES (The Brain)
from app.core.meta.features.widgets.service import WidgetService
from app.core.meta.features.widgets.schemas import WidgetRead

# ⚡ NAVIGATION ENGINE (Fractal Feature)
from app.domains.system.features.navigation.service import NavigationService

logger = logging.getLogger(__name__)

class SystemManifest:
    """
    The Single Source of Truth for the System's capabilities.
    """
    async def generate(self, db: AsyncSession, actor: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generates the full system manifest including modules, routes, circuit states, AND navigation.
        ⚡ UPDATED: Accepts 'actor' context to filter navigation nodes via Policy Engine.
        """
        registry = RegistryManager()
        # Ensure RAM cache is up to date with DB
        await registry.refresh_from_db(db)
        
        # 1. Fetch Domains
        domains = await registry.get_all_summaries(db)

        # 2. Apply Circuit Breaker Logic (Hypervisor)
        stmt = select(CircuitBreaker).where(CircuitBreaker.plane == "UI")
        result = await db.execute(stmt)
        circuits = {c.target: c for c in result.scalars().all()}
        
        modules = []
        for d in domains:
            domain_key = d.key
            
            # 1. Determine Kernel State (Physical)
            is_physically_active = True 
            
            # 2. Determine UI Plane State (Hypervisor)
            target_uri = f"domain:{domain_key}"
            circuit = circuits.get(target_uri)
            
            is_ui_nominal = True
            if circuit:
                if circuit.status != "NOMINAL":
                    is_ui_nominal = False
                    logger.debug(f"🛡️ [Manifest] Cloaking UI for {domain_key}: {circuit.status}")
            
            # 3. Merge Logic
            is_effectively_active = is_physically_active and is_ui_nominal

            # 4. Inject State into Config for Frontend Awareness
            effective_config = {"ui_enabled": is_ui_nominal}

            module_def = {
                "key": domain_key,
                "label": d.label, 
                "icon": d.icon or d.module_icon or "📦",
                "is_active": is_effectively_active,
                "config": effective_config, # ⚡ Hypervisor-Enriched Config
                "processes": [s.model_dump() for s in d.scopes], # Registry returns scopes directly
                # ⚡ HIERARCHY INJECTION
                "parent_domain": d.parent_domain
            }
            modules.append(module_def)

        # 5. ⚡ GENERATE SECURED NAVIGATION
        # We pass the actor context (e.g. {"role": "admin"}) to the NavigationService.
        # It will evaluate any 'required_policy' hooks on the menu nodes.
        # If no actor is provided, we pass an empty context (Guest Mode).
        nav_context = actor or {}
        secured_navigation = await NavigationService.get_secured_navigation(db, nav_context)

        return {
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "modules": modules,
            "navigation": secured_navigation # ⚡ THE NEW PAYLOAD
        }

    def get_capabilities(self) -> Dict[str, Any]:
        """
        Returns the Meta-Kernel capabilities (Widgets, Actions, Context).
        Used by the Frontend to hydrate the Omni-Picker.
        """
        # ⚡ LAZY ACTIVATION: Context Defaults
        import app.core.kernel.context.defaults  # noqa

        from app.core.meta.constants import (
            RuleActionType, RuleEventType, WidgetType, AttributeType
        )

        return {
            "version": "1.1",
            "actions": self._build_action_capabilities(), # ⚡ NEW: Rich Metadata Grouping
            "triggers": self._scan_enum(RuleEventType),
            # ⚡ OPTIMIZATION: We do NOT load dynamic widgets here anymore.
            "widgets": self._scan_enum(WidgetType), 
            "data_types": self._scan_enum(AttributeType),
            # ⚡ DYNAMIC CONTEXT SCHEMA
            "context_schema": context_manager.get_schema()
        }

    def _scan_enum(self, enum_class: Enum) -> List[Dict[str, str]]:
        return [
            {"value": e.value, "label": e.name.replace("_", " ").title(), "key": e.name}
            for e in enum_class
        ]

    def _build_action_capabilities(self) -> List[Dict[str, Any]]:
        """
        ⚡ NEW: Constructs a Frontend-Ready grouped list of Action Capabilities.
        Returns: [{ label: "Group", options: [ { value, label, icon, desc, color } ] }]
        """
        from app.core.meta.constants import ACTION_METADATA, RuleActionType
        
        groups = {}
        for action_type in RuleActionType:
            meta = ACTION_METADATA.get(action_type, {})
            group_label = meta.get("group", "Uncategorized")
            
            if group_label not in groups:
                groups[group_label] = {"label": group_label, "options": []}
                
            groups[group_label]["options"].append({
                "value": action_type.value,
                "label": meta.get("label", action_type.name.replace("_", " ").title()),
                "icon": meta.get("icon"),
                "color": meta.get("color"),
                "desc": meta.get("desc")
            })

        return list(groups.values())

# Singleton Instance
system_manifest = SystemManifest()

