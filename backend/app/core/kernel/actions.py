# FILEPATH: backend/app/core/kernel/actions.py
# @file Logic Actions & Result Contracts
# @author The Engineer (ansav8@gmail.com)
# @description Defines the output structure of the Logic Engine.
#              This decouples "Calculation" from "Enforcement".
#              UPDATED: Added 'TRIGGER_EVENT' and 'TRANSITION' for Async Event Loop.

from enum import Enum
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

class ActionType(Enum):
    """
    The available effects a Rule can trigger.
    """
    BLOCK = "BLOCK"           # Stop the transaction immediately (Raise Error).
    WARN = "WARN"             # Log a warning but allow the transaction.
    
    # Data Mutation
    MUTATE = "MUTATE"         # Change a value in the payload/entity automatically.
    
    # Async/Event Driven
    NOTIFY = "NOTIFY"         # Send a simple alert (Legacy, moving to TRIGGER_EVENT).
    TRIGGER_EVENT = "TRIGGER_EVENT" # Fire a System Event (e.g. WEBHOOK, WORKFLOW_START).
    
    # State Machine
    TRANSITION = "TRANSITION" # Attempt to move the entity to a new State (XState Guard).

@dataclass
class LogicResult:
    """
    The 'Report Card' returned by the Logic Engine after checking all rules.
    """
    is_valid: bool = True
    blocking_errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    
    # Mutations to apply: [{"target": "field_name", "value": "new_value"}]
    mutations: List[Dict[str, Any]] = field(default_factory=list)
    
    # Async side effects (Notifications, Webhooks, State Transitions)
    # Structure: [{"type": "TRIGGER_EVENT", "value": {...}}, {"type": "TRANSITION", "value": "APPROVED"}]
    side_effects: List[Dict[str, Any]] = field(default_factory=list)

    def merge(self, other: 'LogicResult'):
        """
        Helper to combine results from multiple rule checks.
        """
        if not other.is_valid:
            self.is_valid = False
        
        self.blocking_errors.extend(other.blocking_errors)
        self.warnings.extend(other.warnings)
        self.mutations.extend(other.mutations)
        self.side_effects.extend(other.side_effects)

