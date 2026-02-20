# FILEPATH: backend/app/api/v1/workflow.py
# @file: Universal Workflow API (Dumb UI Controller v2.0)
# @role: 🔌 API Controller
# @author: The Engineer (ansav8@gmail.com)
# @description: The "Smart Backend" router. Evaluates UI Options via Governance and executes Transitions.
# @security-level: LEVEL 9 (Dynamic Protected Fields & Preliminary Dry Runs)
# @invariant: Must evaluate Transition Guards BEFORE returning options AND BEFORE committing transactions.
# @narrator: Logs API requests, payload applications, and transition outcomes.

import logging
from typing import Dict, Any, Optional, List
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, Path, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.inspection import inspect

from app.core.database.session import get_db
from app.core.kernel.registry import domain_registry
from app.core.meta.models import StateDefinition
from app.core.meta.features.states.logic.machine import StateMachine

# ⚡ THE DECOUPLED ENGINES
from app.core.kernel.interceptor import LogicInterceptor
from app.domains.meta_v2.features.governance.enforcer import GovernanceEnforcer
from app.core.meta.constants import RuleEventType

logger = logging.getLogger("api.workflow")

router = APIRouter()

# --- SCHEMAS (The Dumb UI Contract) ---
class UIConfig(BaseModel):
    icon: Optional[str] = None
    type: Optional[str] = "default"
    danger: Optional[bool] = False

class TransitionOption(BaseModel):
    name: str
    target: str
    allowed: bool = True
    reason: Optional[str] = None
    ui_config: Optional[UIConfig] = None

class TransitionRequest(BaseModel):
    event: str
    context_data: Dict[str, Any] = {}

class TransitionResponse(BaseModel):
    success: bool
    previous_state: Optional[str]
    new_state: str
    message: str


# --- HELPER ---
async def _load_machine_and_entity(db: AsyncSession, domain: str, scope: str, id: int):
    """Shared logic to hydrate context with Scope support."""
    domain_key = domain.upper()
    scope_key = scope.upper()
    
    # 1. Resolve Model
    domain_ctx = domain_registry.get_domain(domain_key)
    if not domain_ctx or not domain_ctx.model_class:
        raise HTTPException(status_code=404, detail=f"Domain '{domain_key}' not registered.")
    
    # 2. Fetch Entity
    entity = await db.get(domain_ctx.model_class, id)
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found.")

    # 3. Fetch Definition
    stmt = select(StateDefinition).where(
        StateDefinition.entity_key == domain_key,
        StateDefinition.scope == scope_key,
        StateDefinition.is_active == True
    )
    result = await db.execute(stmt)
    definition = result.scalars().first()

    if not definition:
        raise HTTPException(status_code=400, detail=f"No active workflow found for {domain_key}:{scope_key}.")

    return entity, StateMachine(definition.transitions), domain_ctx


# --- ENDPOINTS ---

@router.get("/workflow/{domain}/{scope}/{id}/options", response_model=List[TransitionOption])
async def get_transition_options(
    domain: str = Path(...),
    scope: str = Path(...),
    id: int = Path(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Menu Builder. Evaluates Governance Rules and returns the strictly formatted Dumb UI manifest.
    """
    logger.info(f"🔍 [Workflow API] Calculating UI Options for {domain}:{id} in scope {scope}")
    entity, machine, domain_ctx = await _load_machine_and_entity(db, domain, scope, id)
    
    current_state = getattr(entity, "status", None)
    if not current_state:
        return []

    possible_moves = machine._transition_map.get(current_state, {})
    options = []

    # Prepare Context Envelope for Governance Check
    container_key = domain_ctx.dynamic_container if domain_ctx else None
    meta_data = getattr(entity, container_key, {}) if container_key and hasattr(entity, container_key) else {}
    
    context_envelope = {
        "host": LogicInterceptor._serialize_entity(entity),
        "meta": meta_data,
        "session": { "discriminator": "OPTIONS_CHECK", "event": RuleEventType.LOAD }
    }

    for event_name, config in possible_moves.items():
        allowed = True
        reason = None
        
        # 1. 🛡️ GOVERNANCE CHECK (The Handshake)
        guard_expr = config.get("guard")
        if guard_expr:
            try:
                verdict = GovernanceEnforcer.evaluate_guard_sync(entity, guard_expr, context_envelope)
                if not verdict.is_valid:
                    allowed = False
                    reason = ", ".join(verdict.blocking_errors)
            except Exception as e:
                logger.error(f"⚠️ [Workflow API] Governance crash on guard '{guard_expr}': {e}")
                allowed = False
                reason = "Governance Engine Error"

        # 2. 🎨 VISUAL HEURISTICS (Backend drives the UI)
        ui_config = {}
        lower_name = event_name.lower()
        if "approve" in lower_name or "pass" in lower_name:
            ui_config = {"icon": "antd:CheckCircleOutlined", "type": "primary", "danger": False}
        elif "reject" in lower_name or "cancel" in lower_name:
            ui_config = {"icon": "antd:CloseCircleOutlined", "type": "default", "danger": True}
        elif "publish" in lower_name or "activate" in lower_name:
            ui_config = {"icon": "antd:RocketOutlined", "type": "primary", "danger": False}
        else:
            ui_config = {"icon": "antd:ArrowRightOutlined", "type": "default", "danger": False}
            
        # Override with explicit XState metadata if available
        xstate_meta = config.get("meta", {}).get("ui", {})
        if xstate_meta:
            ui_config.update(xstate_meta)

        # 3. BUILD OPTION
        options.append(TransitionOption(
            name=event_name,
            target=config.get("target"),
            allowed=allowed,
            reason=reason,
            ui_config=UIConfig(**ui_config)
        ))

    return options


@router.post("/workflow/{domain}/{scope}/{id}/transition", response_model=TransitionResponse)
async def execute_transition(
    domain: str = Path(...),
    scope: str = Path(...),
    id: int = Path(...),
    body: TransitionRequest = Body(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Executes a State Transition with Context.
    Features: Dynamic Protected Fields & Preliminary Governance Dry-Run.
    """
    logger.info(f"⚡ [Workflow API] Execution requested: {body.event} on {domain}:{id}")
    entity, machine, domain_ctx = await _load_machine_and_entity(db, domain, scope, id)
    
    current_state = getattr(entity, "status", None)
    state_transitions = machine._transition_map.get(current_state, {})
    transition_config = state_transitions.get(body.event)

    if not transition_config:
        raise HTTPException(status_code=400, detail=f"Event '{body.event}' not valid from '{current_state}'.")

    next_state = transition_config.get("target")

    # 1. 🛡️ PRELIMINARY DRY RUN (Governance Validation before DB touch)
    guard_expr = transition_config.get("guard")
    if guard_expr:
        container_key = domain_ctx.dynamic_container if domain_ctx else None
        meta_data = getattr(entity, container_key, {}) if container_key and hasattr(entity, container_key) else {}
        
        # Simulate the payload being applied to the context envelope for evaluation
        simulated_host = LogicInterceptor._serialize_entity(entity)
        simulated_host.update(body.context_data) 

        context_envelope = {
            "host": simulated_host,
            "meta": meta_data,
            "session": { "discriminator": "TRANSITION_EXECUTE", "event": RuleEventType.TRANSITION }
        }
        
        try:
            verdict = GovernanceEnforcer.evaluate_guard_sync(entity, guard_expr, context_envelope)
            if not verdict.is_valid:
                logger.warning(f"⛔ [Workflow API] Preliminary Guard Failed: {verdict.blocking_errors}")
                # We return a List of errors so the frontend Array.isArray(detail) parsing works
                raise HTTPException(status_code=422, detail=verdict.blocking_errors)
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"💥 [Workflow API] Governance Engine Failure during execution: {e}")
            raise HTTPException(status_code=500, detail=["Internal Governance Error."])

    # 2. 💾 DYNAMIC DATA PERSISTENCE LAYER
    if body.context_data:
        # A. Dynamically fetch Primary Keys
        mapper = inspect(domain_ctx.model_class)
        pk_columns = {column.key for column in mapper.primary_key}
        
        # B. Combine PKs with standard system fields
        PROTECTED_FIELDS = pk_columns.union({"created_at", "updated_at", "hashed_password", "salt", "password"})
        
        updated_count = 0
        for key, value in body.context_data.items():
            if key not in PROTECTED_FIELDS and hasattr(entity, key):
                setattr(entity, key, value)
                updated_count += 1
        
        if updated_count > 0:
            logger.info(f"💾 [Workflow API] Applied {updated_count} field updates from payload.")

    # 3. 🛡️ ATTACH SIDECAR (For Interceptor & CDC Events)
    setattr(entity, "_runtime_context", body.context_data)

    try:
        # Trigger the status change (marks object as dirty for SQLAlchemy)
        entity.status = next_state
        
        # ⚡ COMMITTING THE DB TRIGGERS THE INTERCEPTOR (Final Logic Pass & Outbox)
        await db.commit()
        await db.refresh(entity)
        
        logger.info(f"✅ [Workflow API] Transition Success: {current_state} -> {next_state}")
        return TransitionResponse(
            success=True,
            previous_state=current_state,
            new_state=next_state,
            message="Transition successful."
        )

    except ValueError as ve:
        await db.rollback()
        error_str = str(ve).replace("⛔ Policy Blocked Save: ", "").replace("⛔ [Governance] Guard Blocked Transition: ", "")
        raise HTTPException(status_code=422, detail=error_str.split(", "))
    except Exception as e:
        await db.rollback()
        logger.error(f"💥 [Workflow API] System Error during DB commit: {e}")
        raise HTTPException(status_code=500, detail=["Internal Database Engine Failure"])
