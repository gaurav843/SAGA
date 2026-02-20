# FILEPATH: backend/app/core/meta/features/states/logic/machine.py
# @file State Machine Logic (Lightweight Interpreter)
# @author The Engineer (ansav8@gmail.com)
# @description A pure Python implementation of XState transition logic.
#              UPDATED: Added 'get_state_node' to support Node Entry Actions (Jobs).

import logging
from typing import Dict, List, Optional, Any, Union

logger = logging.getLogger("core.meta.states.machine")

class StateMachine:
    """
    A Read-Only engine that validates transitions against an XState definition.
    Now supports Guards, Action extraction, and State Inspection.
    """
    def __init__(self, definition: Dict[str, Any]):
        """
        Args:
            definition: The XState JSON object stored in the DB.
        """
        self.id = definition.get("id", "unknown_machine")
        self.initial_state = definition.get("initial")
        self.states = definition.get("states", {})
        
        # Cache strict transitions for O(1) lookup
        self._transition_map: Dict[str, Dict[str, Dict[str, Any]]] = {}
        self._build_lookup_table()

    def _normalize_transition(self, target: Union[str, Dict[str, Any]]) -> Dict[str, Any]:
        """
        SAFEGUARD: Converts legacy string targets into object definitions.
        "ACTIVE" -> { "target": "ACTIVE" }
        """
        if isinstance(target, str):
            return {"target": target, "guard": None, "actions": []}
        return target

    def _build_lookup_table(self):
        """Parses the nested XState structure into a flat lookup map."""
        for state_key, state_def in self.states.items():
            self._transition_map[state_key] = {}
            
            transitions = state_def.get("on", {})
            for event, raw_target in transitions.items():
                config = self._normalize_transition(raw_target)
                self._transition_map[state_key][event] = config

    def get_transition_config(self, current_state: str, next_state: str) -> Optional[Dict[str, Any]]:
        """
        Finds the configuration (Rules/Actions) for moving A -> B.
        """
        if not current_state:
            if next_state == self.initial_state:
                return {"target": next_state, "guard": None, "actions": []}
            return None

        possible_events = self._transition_map.get(current_state, {})
        for event, config in possible_events.items():
            if config.get("target") == next_state:
                return config 
        return None

    def validate_transition_structure(self, current_state: str, next_state: str) -> bool:
        config = self.get_transition_config(current_state, next_state)
        return config is not None

    def get_side_effects(self, current_state: str, next_state: str) -> List[str]:
        """Retrieves 'actions' defined in the transition (Edge)."""
        config = self.get_transition_config(current_state, next_state)
        if not config:
            return []
            
        found_actions = config.get("actions", [])
        if isinstance(found_actions, list):
            return found_actions
        elif isinstance(found_actions, str):
            return [found_actions]
        return []

    # ⚡ NEW: Node Inspection (The missing piece for Jobs)
    def get_state_node(self, state_key: str) -> Optional[Dict[str, Any]]:
        """
        Returns the full definition of a specific state node.
        Used to check for 'meta.job_config' or 'meta.form_schema'.
        """
        return self.states.get(state_key)

