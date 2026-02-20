# FILEPATH: backend/app/core/meta/features/simulator/schemas.py
# @file Simulation Contracts (The Protocol)
# @author The Engineer (ansav8@gmail.com)
# @description Pydantic models for the Simulation Cycle (Request/Response).

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class SimulationRequest(BaseModel):
    """
    The Input Vector.
    Describes the hypothetical scenario to run.
    """
    domain: str = Field(..., description="Target Domain (e.g. USER)")
    entity_id: int = Field(..., description="ID of the record to simulate against")
    
    event: str = Field(..., description="The Business Event (e.g. SUBMIT_PROFILE)")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Form Data / Changeset")

class SimulationResult(BaseModel):
    """
    The Output Report.
    What WOULD have happened if this was real.
    """
    success: bool
    
    # State Transition
    previous_state: str
    next_state: Optional[str] = None
    
    # Governance
    policies_triggered: List[str] = [] # Names of policies that ran
    violations: List[str] = []         # Blocking errors
    warnings: List[str] = []           # Non-blocking warnings
    
    # Data Impact
    diff: Dict[str, Any] = {}          # What fields changed in the DB
    side_effects: List[str] = []       # Emails, Webhooks, etc.
    
    timestamp: datetime = Field(default_factory=datetime.utcnow)

