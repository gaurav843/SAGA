# FILEPATH: backend/app/core/meta/features/simulator/logic/interpreter.py
# @file Native XState Interpreter (The Driver)
# @author The Engineer (ansav8@gmail.com)
# @description A pure Python engine that executes XState v5 JSON definitions.
#              Calculates: f(Current State, Event) -> Next State

import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("core.meta.simulator.interpreter")

class XStateInterpreter:
    """
    A lightweight, fault-tolerant interpreter for XState v5 definitions.
    Decouples the 'Definition' (JSON) from the 'Execution' (Python).
    """

    def __init__(self, machine_definition: Dict[str, Any]):
        self.definition = machine_definition
        self.states = machine_definition.get("states", {})
        self.initial_state = machine_definition.get("initial")
        self.id = machine_definition.get("id", "anonymous_machine")

    def get_initial_state(self) -> str:
        """Returns the starting state of the machine."""
        if not self.initial_state:
            raise ValueError(f"Machine '{self.id}' has no initial state defined.")
        return self.initial_state

    def transition(self, current_state: str, event: str) -> Optional[str]:
        """
        Determines the next state based on the current state and the incoming event.
        Returns 'None' if the transition is invalid/impossible.
        """
        # 1. Validate Current State
        state_node = self.states.get(current_state)
        if not state_node:
            logger.error(f"❌ [Interpreter] State '{current_state}' not found in machine '{self.id}'.")
            return None

        # 2. Look for Transitions ('on' block)
        transitions = state_node.get("on", {})
        
        # 3. Match Event
        # XState allows 'on': { "EVENT": "TARGET" } OR 'on': { "EVENT": { "target": "TARGET" } }
        transition_config = transitions.get(event)

        if not transition_config:
            logger.warning(f"⚠️ [Interpreter] No transition found for event '{event}' in state '{current_state}'.")
            return None

        # 4. Resolve Target
        target_state = None
        
        if isinstance(transition_config, str):
            # Short syntax: "EVENT": "TARGET"
            target_state = transition_config
        
        elif isinstance(transition_config, dict):
            # Object syntax: "EVENT": { "target": "TARGET", "actions": [...] }
            target_state = transition_config.get("target")
        
        elif isinstance(transition_config, list):
            # Array syntax (Guards): "EVENT": [{ "target": "T1", "guard": "cond" }]
            # For Phase 1, we just take the first unconditional match or the first one.
            # TODO: Implement Guard Logic evaluation here.
            first_match = transition_config[0]
            if isinstance(first_match, dict):
                target_state = first_match.get("target")

        # 5. Final Validation
        if target_state and target_state in self.states:
            logger.info(f"✅ [Interpreter] Transition: {current_state} + {event} -> {target_state}")
            return target_state
        else:
            logger.error(f"❌ [Interpreter] Invalid Target State '{target_state}' (Not in definition).")
            return None

