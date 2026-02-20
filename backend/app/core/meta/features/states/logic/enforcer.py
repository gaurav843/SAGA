# FILEPATH: backend/app/core/meta/features/states/logic/enforcer.py
# @file: State Enforcer (Decoupled v3.0)
# @role: 🧠 Logic Container
# @author: The Engineer (ansav8@gmail.com)
# @description: Decoupled Workflow Enforcer. No longer imports Governance directly.
# @security-level: LEVEL 9 (Strict Decoupling)

import logging
from typing import List, Any, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy.inspection import inspect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.meta.models import StateDefinition
from app.core.kernel.models import SystemOutbox
from app.core.meta.features.states.logic.machine import StateMachine

logger = logging.getLogger("core.meta.states.enforcer")

class StateEnforcer:
    @staticmethod
    async def fetch_definitions(db: AsyncSession, domain: str) -> List[StateDefinition]:
        """⚡ SIDECAR IO: Fetches active state machines for a domain."""
        stmt = select(StateDefinition).where(
            StateDefinition.entity_key == domain,
            StateDefinition.is_active == True
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    def enforce_logic(obj: Any, definitions: List[StateDefinition], session_for_side_effects: Session):
        """
        @description: CPU LOGIC: Evaluates transitions. 
        Emits transition data into the object context for Signal Interception.
        """
        if not definitions:
            return 

        inspector = inspect(obj)
        domain = type(obj).__name__.upper()

        for definition in definitions:
            target_field = getattr(definition, 'governed_field', 'status')
            if not hasattr(obj, target_field):
                continue

            attr = getattr(inspector.attrs, target_field)
            hist = attr.history
            if not hist.has_changes():
                continue

            old_value = hist.deleted[0] if hist.deleted else None
            new_value = hist.added[0] if hist.added else None
            if old_value == new_value:
                continue

            logger.info(f"🔄 [Enforcer] Transition Request {domain} | {target_field}: '{old_value}' -> '{new_value}'")

            machine = StateMachine(definition.transitions)
            config = machine.get_transition_config(old_value, new_value)
            
            if not config:
                raise ValueError(f"❌ [Workflow] Path '{old_value}' -> '{new_value}' is illegal in '{definition.name}'.")

            # ⚡ DECOUPLING POINT:
            # We no longer evaluate the guard here. 
            # We attach the 'guard' and 'actions' to the object sidecar.
            # The Interceptor will see this and trigger the Governance Signal.
            if not hasattr(obj, "_pending_transition"):
                obj._pending_transition = []
            
            obj._pending_transition.append({
                "workflow": definition.name,
                "scope": definition.scope,
                "from": old_value,
                "to": new_value,
                "guard": config.get("guard"),
                "actions": config.get("actions", [])
            })
