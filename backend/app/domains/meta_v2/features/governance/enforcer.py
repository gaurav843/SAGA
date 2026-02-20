# FILEPATH: backend/app/domains/meta_v2/features/governance/enforcer.py
# @file: Governance Enforcer (Decoupled v3.0)
# @role: 🧠 Logic Container
# @author: The Engineer (ansav8@gmail.com)
# @description: Decoupled Governance sidecar. Fetches and evaluates policies independently.
# @security-level: LEVEL 9 (Strict Decoupling)

import logging
from typing import Dict, Any, Tuple
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

from app.core.config import settings
from app.core.kernel.context.manager import context_manager
from app.core.meta.engine import policy_engine
from app.core.meta.models import PolicyBinding, PolicyDefinition
from app.core.kernel.actions import LogicResult

logger = logging.getLogger("meta_v2.governance.enforcer")

class GovernanceEnforcer:
    @staticmethod
    async def fetch_and_evaluate(frozen_obj: Any, obj: Any, domain_key: str, context_envelope: Dict[str, Any]) -> Tuple[LogicResult, Dict[str, Any]]:
        """
        ⚡ SIDECAR IO: Spawns an independent DB session to fetch Policies, 
        resolves the context, and executes the Universal Logic Engine.
        """
        ephemeral_engine = create_async_engine(settings.DATABASE_URL, echo=False, pool_pre_ping=True)
        try:
            async with AsyncSession(ephemeral_engine) as sidecar_db:
                # 1. Resolve Environment Context
                env_ctx = await context_manager.resolve(sidecar_db, frozen_obj)
                if env_ctx:
                    context_envelope.update(env_ctx)

                # 2. Fetch Active Bindings
                stmt = select(PolicyBinding).options(
                    selectinload(PolicyBinding.policy),
                    selectinload(PolicyBinding.group)
                ).where(
                    PolicyBinding.target_domain == domain_key,
                    PolicyBinding.is_active == True
                ).order_by(desc(PolicyBinding.priority))

                bindings = (await sidecar_db.execute(stmt)).scalars().all()
                
                policies = []
                for b in bindings:
                    if b.policy_id and b.policy and b.policy.is_active:
                        policies.append(b.policy)

                # 3. Evaluate (Or Pass gracefully if no rules)
                if not policies:
                    return LogicResult(is_valid=True), context_envelope

                result = policy_engine.evaluate(entity=obj, policies=policies, context_override=context_envelope)
                return result, context_envelope
        except Exception as e:
            logger.error(f"🔥 [GovernanceEnforcer] Database or Context Failure: {e}")
            raise e
        finally:
            await ephemeral_engine.dispose()

    @staticmethod
    def evaluate_guard_sync(obj: Any, guard_expr: str, context_envelope: Dict[str, Any]) -> LogicResult:
        """
        Evaluates a single transition guard expression synchronously.
        """
        temp_policy = PolicyDefinition(
            key="transition_guard",
            rules=[{"logic": guard_expr, "action": "BLOCK", "message": "State Guard Failed"}],
            is_active=True
        )
        return policy_engine.evaluate(entity=obj, policies=[temp_policy], context_override=context_envelope)
