# FILEPATH: backend/app/domains/system/features/navigation/service.py
# @file: Navigation Logic Service
# @role: 🧠 Logic Container
# @author: The Engineer (ansav8@gmail.com)
# @description: Generates secured, structured navigation payloads for the Shell.
# @security-level: LEVEL 9 (Governance-Aware)

import logging
from typing import Dict, List, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import SystemMenuNode
from app.core.meta.engine import policy_engine
from app.core.meta.models import PolicyDefinition

logger = logging.getLogger("system.navigation.service")

class NavigationService:
    """
    The Architect of the UI Shell.
    Filters the navigation topology based on active Governance Policies.
    """

    @staticmethod
    async def get_secured_navigation(db: AsyncSession, eval_context: Dict[str, Any]) -> Dict[str, List[Dict[str, Any]]]:
        """
        @description: Fetches all active nodes and filters them via the Policy Engine.
        @invariant: Unauthorized nodes must never enter the returned payload.
        """
        # 1. Fetch all active nodes
        stmt = select(SystemMenuNode).where(SystemMenuNode.is_active == True).order_by(SystemMenuNode.weight)
        result = await db.execute(stmt)
        menu_nodes = result.scalars().all()

        # 2. Extract unique policy requirements to minimize DB hits
        required_policy_keys = list(set([m.required_policy for m in menu_nodes if m.required_policy]))
        
        policies_map = {}
        if required_policy_keys:
            stmt_pol = select(PolicyDefinition).where(
                PolicyDefinition.key.in_(required_policy_keys),
                PolicyDefinition.is_latest == True
            )
            pol_res = await db.execute(stmt_pol)
            policies_map = {p.key: p for p in pol_res.scalars().all()}

        # 3. Assemble filtered structure
        navigation = {
            "sidebar": [],
            "user_menu": [],
            "top_bar": []
        }

        for node in menu_nodes:
            # 🛡️ SECURITY GATE
            if node.required_policy:
                policy = policies_map.get(node.required_policy)
                if policy:
                    eval_result = policy_engine.evaluate(entity={}, policies=[policy], context_override=eval_context)
                    if not eval_result.is_valid:
                        logger.debug(f"🛡️ [Navigation] Cloaking Node '{node.key}': Policy Check Failed")
                        continue

            # 📦 SERIALIZE
            node_payload = {
                "key": node.key,
                "label": node.label,
                "icon": node.icon,
                "path": node.path,
                "component_path": node.component_path,
                "api_endpoint": node.api_endpoint,
                "search_tags": node.search_tags, # ⚡ DISCOVERY
                "config": node.config,
                "parent_key": node.parent_key
            }

            if node.zone == "MAIN_SIDEBAR":
                navigation["sidebar"].append(node_payload)
            elif node.zone == "AVATAR_DROPDOWN":
                navigation["user_menu"].append(node_payload)
            elif node.zone == "TOP_BAR":
                navigation["top_bar"].append(node_payload)

        return navigation

