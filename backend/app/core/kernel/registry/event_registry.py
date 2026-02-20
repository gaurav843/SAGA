# FILEPATH: backend/app/core/kernel/registry/event_registry.py
# @file: System Event Registry
# @role: ⚙️ System Tool
# @author: The Engineer (ansav8@gmail.com)
# @description: Defines the canonical signals for the decoupled Meta-Kernel.
# @security-level: LEVEL 0 (Kernel)

class Signals:
    """
    Static container for all System Events.
    Standard: DOMAIN:VERB (UPPERCASE)
    """
    # --- ASSET SIGNALS ---
    USER_CREATED = "USER:CREATED"
    USER_UPDATED = "USER:UPDATED"

    # --- KERNEL DECOUPLING SIGNALS ---
    # Fired by Workflow Engine to ask if a transition is legal.
    SIG_WORKFLOW_TRANSITION_REQ = "KERNEL:TRANSITION_REQUEST"
    
    # Fired by Governance Engine to report validation results.
    SIG_GOVERNANCE_VERDICT = "KERNEL:GOVERNANCE_VERDICT"

    # --- SYSTEM SIGNALS ---
    SYS_MAINTENANCE_START = "SYS:MAINTENANCE_START"
    SYS_CIRCUIT_FLIP = "SYS:CIRCUIT_FLIP"
