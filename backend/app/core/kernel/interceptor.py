# FILEPATH: backend/app/core/kernel/interceptor.py
# @file: Logic Engine Interceptor (Universal Gateway v4.0)
# @role: 🧠 Logic Orchestrator
# @author: The Engineer (ansav8@gmail.com)
# @description: Decoupled Gateway. No Hardcoded Maps. Resilient Fail-Open Logic.
# @security-level: LEVEL 10 (Fail-Open Resilience)

import logging
from typing import List, Dict, Any
from types import SimpleNamespace
from datetime import datetime, date

from sqlalchemy import event
from sqlalchemy.orm import Session
from sqlalchemy.inspection import inspect
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

from app.core.config import settings
from app.core.kernel.registry import domain_registry
from app.core.meta.constants import RuleEventType
from app.core.kernel.models import SystemOutbox

# 🔌 DECOUPLED ENGINES (Plug & Play)
from app.core.utilities.async_bridge import async_bridge
from app.domains.meta_v2.features.governance.enforcer import GovernanceEnforcer
from app.core.meta.features.states.logic.enforcer import StateEnforcer

logger = logging.getLogger('app.core.kernel.interceptor')

class LogicInterceptor:
    """
    The Universal Gateway.
    1. Emits events.
    2. Queries independent engines.
    3. Fails OPEN if engines are unreachable, preserving DB availability.
    """

    @staticmethod
    def register(session_class_or_factory):
        event.listen(session_class_or_factory, 'before_flush', LogicInterceptor.before_flush)
        logger.info("🛡️ [Interceptor] Universal Gateway & CDC Activated (Decoupled Mode).")

    @staticmethod
    def before_flush(session, flush_context, instances):
        candidates = list(session.new) + list(session.dirty)
        if not candidates:
            return

        for obj in candidates:
            # ⚡ NOISE FILTER: Skip Outbox to prevent infinite loops
            if isinstance(obj, SystemOutbox): 
                continue

            LogicInterceptor._process_object(session, obj)

    @staticmethod
    def _process_object(session: Session, obj: Any):
        model_name = type(obj).__name__.upper()
        
        # 1. ⚡ DYNAMIC DOMAIN RESOLUTION (No more hardcoded dicts)
        # We assume the domain matches the class name, unless overridden by the model itself.
        domain_key = getattr(obj, '__domain__', model_name)
        
        # Fallback for internal Kernel structures (Optional but safe)
        if model_name == "SYSTEMCONFIG": domain_key = "GLOBAL"
        elif model_name == "CIRCUITBREAKER": domain_key = "SYS"

        domain_ctx = domain_registry.get_domain(domain_key)
        container_key = domain_ctx.dynamic_container if domain_ctx else None

        # 2. ⚡ PRE-FLIGHT: Freeze & Calculate Changes
        frozen_obj = LogicInterceptor._freeze_entity(obj)
        changeset = LogicInterceptor._calculate_changeset(obj)
        
        if not changeset and obj not in session.new:
            return

        # Construct default envelope
        meta_data = getattr(obj, container_key, {}) or {} if container_key else {}
        host_data = LogicInterceptor._serialize_entity(obj)

        context_envelope = {
            "host": host_data,
            "meta": meta_data,
            "changeset": changeset,
            "session": { "discriminator": "INTERCEPTOR_SAVE", "event": RuleEventType.SAVE }
        }

        # 3. 🧠 THE BRAIN: GOVERNANCE ENGINE (Decoupled Sidecar)
        try:
            logic_result, enriched_ctx = async_bridge.run_sync(
                GovernanceEnforcer.fetch_and_evaluate(frozen_obj, obj, domain_key, context_envelope)
            )
            context_envelope = enriched_ctx # Use enriched context for Workflow steps

            if not logic_result.is_valid:
                error_msg = f"⛔ Policy Blocked Save: {', '.join(logic_result.blocking_errors)}"
                logger.warning(error_msg)
                raise ValueError(error_msg)

            # Apply mutations if permitted
            if logic_result.mutations:
                LogicInterceptor._apply_mutations(obj, logic_result.mutations, meta_data, container_key)
            if logic_result.side_effects:
                LogicInterceptor._buffer_side_effects(session, obj, logic_result.side_effects)

        except ValueError as ve:
            raise ve # Deliberate Policy Block (Propagate)
        except Exception as e:
            # ⚡ FAIL-OPEN RESILIENCE: If Brain crashes, allow the body to survive.
            logger.error(f"⚠️ [Interceptor] Governance Engine Offline/Crashed. Failing OPEN. Error: {e}")

        # 4. 🏃 THE BODY: WORKFLOW ENGINE (Decoupled)
        try:
            # Need an ephemeral async session just to fetch state defs for the workflow engine
            async def fetch_states():
                engine = create_async_engine(settings.DATABASE_URL, echo=False, pool_pre_ping=True)
                try:
                    async with AsyncSession(engine) as sdb:
                        return await StateEnforcer.fetch_definitions(sdb, domain_key)
                finally:
                    await engine.dispose()

            state_defs = async_bridge.run_sync(fetch_states())
            if state_defs:
                StateEnforcer.enforce_logic(obj, state_defs, session)
        except ValueError as ve:
            raise ve # Propagate deliberate invalid transitions
        except Exception as e:
            logger.error(f"⚠️ [Interceptor] Workflow Engine Error. Failing OPEN. Error: {e}")

        # 5. 🤝 THE HANDSHAKE: Governance checks Workflow's Transition Request
        if hasattr(obj, "_pending_transition"):
            for transition in obj._pending_transition:
                guard_expr = transition.get("guard")
                
                if guard_expr:
                    try:
                        logger.info(f"🛡️ [Interceptor] Handshake: Verifying Guard -> '{transition['to']}'")
                        guard_verdict = GovernanceEnforcer.evaluate_guard_sync(obj, guard_expr, context_envelope)
                        
                        if not guard_verdict.is_valid:
                            raise ValueError(f"⛔ [Governance] Transition Guard Blocked: {', '.join(guard_verdict.blocking_errors)}")
                    except ValueError as ve:
                        raise ve
                    except Exception as e:
                        logger.error(f"⚠️ [Interceptor] Guard evaluation failed. Failing OPEN. Error: {e}")

                # Schedule side-effects (Actions)
                for action in transition.get("actions", []):
                    LogicInterceptor._schedule_workflow_effect(session, obj, f"WORKFLOW:{action.upper()}", transition.get("scope", "LIFECYCLE"))
                    
            delattr(obj, "_pending_transition")

        # 6. ⚡ CHANGE DATA CAPTURE (CDC)
        if changeset or obj in session.new:
            event_type = "CREATED" if obj in session.new else "UPDATED"
            event_name = f"{domain_key}:{event_type}"
            
            safe_changeset = LogicInterceptor._json_friendly(changeset)
            
            cdc_payload = {
                "entity_id": getattr(obj, "id", None),
                "domain": domain_key,
                "model": model_name,
                "changes": safe_changeset,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            p_key = str(getattr(obj, "id", "global"))
            req_id = context_envelope.get("request_id", "system") if isinstance(context_envelope, dict) else "system"

            cdc_event = SystemOutbox(
                event_name=event_name,
                partition_key=p_key,
                trace_id=req_id,
                payload=cdc_payload,
                entity_id=getattr(obj, "id", None),
                status='PENDING',
                created_at=datetime.utcnow()
            )
            session.add(cdc_event)
            logger.info(f"💾 [CDC] Recorded {event_name} for {model_name} #{getattr(obj, 'id', '?')}")

    @staticmethod
    def _schedule_workflow_effect(session: Session, obj: Any, event_name: str, scope: str):
        event = SystemOutbox(
            event_name=event_name,
            partition_key=str(getattr(obj, "id", "global")),
            payload={
                "source": "InterceptorHandshake",
                "scope": scope,
                "entity_id": getattr(obj, 'id', None),
                "timestamp": datetime.utcnow().isoformat()
            },
            entity_id=getattr(obj, 'id', None),
            status='PENDING'
        )
        session.add(event)

    @staticmethod
    def _json_friendly(data: Any) -> Any:
        if isinstance(data, dict):
            return {k: LogicInterceptor._json_friendly(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [LogicInterceptor._json_friendly(v) for v in data]
        elif isinstance(data, (datetime, date)):
            return data.isoformat()
        return data

    @staticmethod
    def _freeze_entity(obj: Any) -> Any:
        try:
            data = {}
            inspector = inspect(obj)
            for col in inspector.mapper.column_attrs:
                data[col.key] = getattr(obj, col.key)
            return SimpleNamespace(**data)
        except Exception:
            return obj

    @staticmethod
    def _serialize_entity(obj: Any) -> Dict[str, Any]:
        try:
            inspector = inspect(obj)
            return {c.key: getattr(obj, c.key) for c in inspector.mapper.column_attrs}
        except Exception:
            return {}

    @staticmethod
    def _apply_mutations(obj, mutations, meta_data, container_key):
        for mutation in mutations:
            target = mutation.get('target')
            value = mutation.get('value')
            if hasattr(obj, target):
                setattr(obj, target, value)

    @staticmethod
    def _buffer_side_effects(session: Session, obj, side_effects: List[Dict]):
        for effect in side_effects:
            if effect.get("type") == "TRIGGER_EVENT":
                value = effect.get("value", {})
                outbox_entry = SystemOutbox(
                    event_name=value.get("event", "UNKNOWN"),
                    partition_key=str(getattr(obj, "id", "global")),
                    trace_id="triggered_effect",
                    payload=LogicInterceptor._json_friendly(value.get("payload", {})),
                    entity_id=getattr(obj, 'id', None),
                    status='PENDING',
                    created_at=datetime.utcnow()
                )
                session.add(outbox_entry)

    @staticmethod
    def _calculate_changeset(obj) -> dict:
        changes = {}
        inspector = inspect(obj)
        for attr in inspector.attrs:
            history = attr.history
            if history.has_changes():
                changes[attr.key] = {
                    "old": history.deleted[0] if history.deleted else None,
                    "new": history.added[0] if history.added else None
                }
        return changes 
