# FILEPATH: backend/app/core/meta/features/simulator/service.py
# @file Runtime Simulation Service (The Sandbox)
# @author The Engineer (ansav8@gmail.com)
# @description Orchestrates the "Load -> Transition -> Intercept -> Rollback" cycle.
#              UPDATED: 'inspect_entity' now FLATTENS custom_attributes to match UI expectations.

import logging
from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.inspection import inspect

# Kernel & Registry
from app.core.kernel.registry import domain_registry
from app.core.kernel.models import SystemOutbox

# Meta Features
from app.core.meta.features.states.service import StateService
from app.core.meta.features.simulator.logic.interpreter import XStateInterpreter
from app.core.meta.features.simulator.schemas import SimulationRequest, SimulationResult

logger = logging.getLogger("core.meta.simulator")

class RuntimeService:

    @staticmethod
    async def inspect_entity(db: AsyncSession, domain: str, entity_id: int) -> Dict[str, Any]:
        """
        FORENSIC PROBE: Fetches the exact database state of an entity.
        ⚡ UPDATE: Flattens 'custom_attributes' so the UI can bind fields correctly.
        """
        # 1. Resolve Domain Model
        domain_ctx = domain_registry.get_domain(domain)
        if not domain_ctx or not domain_ctx.model_class:
            raise ValueError(f"Domain '{domain}' not registered or missing Model Class.")
        
        ModelClass = domain_ctx.model_class

        # 2. Fetch Row
        stmt = select(ModelClass).where(ModelClass.id == entity_id)
        result = await db.execute(stmt)
        entity = result.scalars().first()

        if not entity:
            raise ValueError(f"Entity {domain}:{entity_id} not found in database.")

        # 3. Serialize & Flatten (The Fix)
        data = {}
        inspector = inspect(ModelClass)
        
        # A. Static Columns
        for column in inspector.columns:
            val = getattr(entity, column.name)
            
            # Handle Datetime serialization
            if isinstance(val, datetime):
                val = val.isoformat()
                
            data[column.name] = val
            
        # B. Dynamic Attributes (Flattening)
        # This pulls 'test' out of 'custom_attributes' and puts it at the root.
        if hasattr(entity, 'custom_attributes') and entity.custom_attributes:
            for key, value in entity.custom_attributes.items():
                if key not in data: # Columns take precedence
                    data[key] = value
        
        return data

    @staticmethod
    async def simulate_transaction(db: AsyncSession, request: SimulationRequest) -> SimulationResult:
        """
        Executes a business event in a safe Sandbox Transaction.
        """
        logger.info(f"🧪 [Simulator] Starting Simulation: {request.domain}:{request.entity_id} -> {request.event}")

        # 1. Resolve Domain Model
        domain_ctx = domain_registry.get_domain(request.domain)
        if not domain_ctx or not domain_ctx.model_class:
            raise ValueError(f"Domain '{request.domain}' not registered or missing Model Class.")
        
        ModelClass = domain_ctx.model_class

        # 2. Load Entity
        stmt = select(ModelClass).where(ModelClass.id == request.entity_id)
        result = await db.execute(stmt)
        entity = result.scalars().first()

        if not entity:
            raise ValueError(f"Entity {request.domain}:{request.entity_id} not found.")

        # Capture Pre-State
        current_state = getattr(entity, 'status', 'idle')
        
        # 3. Load State Machine
        machines = await StateService.get_machines(db, request.domain)
        if not machines:
            raise ValueError(f"No State Machine defined for domain '{request.domain}'.")
        
        active_machine_def = machines[0] 
        interpreter = XStateInterpreter(active_machine_def.transitions)

        # 4. Calculate Transition
        next_state = interpreter.transition(current_state, request.event)
        
        simulation_log = {
            "policies": [],
            "violations": [],
            "warnings": [],
            "side_effects": []
        }

        # 5. Apply Changes
        try:
            # A. Apply Payload updates
            for key, value in request.payload.items():
                if hasattr(entity, key):
                    setattr(entity, key, value)
            
            # B. Apply State Transition
            if next_state:
                if hasattr(entity, 'status'):
                    setattr(entity, 'status', next_state)
            else:
                simulation_log["violations"].append(f"Invalid Transition: {current_state} -> {request.event}")

            # 6. Trigger Interceptor
            await db.flush()

            # 7. Inspect Side Effects
            for obj in db.new:
                if isinstance(obj, SystemOutbox):
                    simulation_log["side_effects"].append(f"{obj.event_name} (Status: {obj.status})")

            success = True

        except ValueError as ve:
            success = False
            simulation_log["violations"].append(str(ve))
            logger.info(f"🧪 [Simulator] Logic Interceptor Blocked: {ve}")
        
        except Exception as e:
            success = False
            simulation_log["violations"].append(f"System Error: {str(e)}")
            logger.error(f"🧪 [Simulator] Crash: {e}")

        finally:
            # 8. THE ROLLBACK
            await db.rollback()
            logger.info("🧪 [Simulator] Transaction Rolled Back. System State Preserved.")

        return SimulationResult(
            success=success,
            previous_state=current_state,
            next_state=next_state if success else current_state,
            policies_triggered=simulation_log["policies"], 
            violations=simulation_log["violations"],
            warnings=simulation_log["warnings"],
            side_effects=simulation_log["side_effects"],
            diff=request.payload, 
            timestamp=datetime.utcnow()
        )

