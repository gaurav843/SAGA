# FILEPATH: backend/app/core/meta/features/states/schemas.py
# @file: State Machine Contracts (XState Guard)
# @author: The Engineer (ansav8@gmail.com)
# @description: Strict Pydantic models for Workflow Engine.
# @security-level: LEVEL 9 (Validation)
# @invariant: Version field must be a SemVer string.
# @updated: Added 'WorkflowTypeRead' for V3 Dynamic Types.

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict, computed_field
from datetime import datetime

# --- VALIDATION LOGIC ---
def validate_xstate_structure(machine: Dict[str, Any]) -> Dict[str, Any]:
    """Forensic audit of the State Machine JSON."""
    if "id" not in machine:
        raise ValueError("XState Machine must have an 'id'.")
    if "initial" not in machine:
        raise ValueError("XState Machine must have an 'initial' state.")
    if "states" not in machine or not isinstance(machine["states"], dict):
        raise ValueError("XState Machine must have a 'states' dictionary.")
    return machine

# --- 0. META-TYPES (V3) ---
class WorkflowTypeRead(BaseModel):
    """
    Exposes the 'Class' definition of a workflow (e.g. WIZARD).
    Used by Frontend to render the correct Icon, Color, and Label dynamically.
    """
    key: str
    label: str
    description: Optional[str] = None
    
    # ⚡ FRONTEND HINTS (Icons, Colors)
    ui_config: Dict[str, Any] = Field(default_factory=dict)
    
    # ⚡ VALIDATION RULES (JSON Schema)
    validation_schema: Dict[str, Any] = Field(default_factory=dict)
    
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- 1. INPUT (Frontend sends this to Save) ---
class StateMachineCreate(BaseModel):
    domain: str = Field(..., description="The Business Object (e.g. USER)")
    scope: str = Field(..., description="The Process Context (e.g. LIFECYCLE)")
    name: str = Field(..., description="Human readable name")
    
    # The Target Column (Defaults to 'status')
    governed_field: str = Field(default="status", description="The DB column this workflow controls")
    
    definition: Dict[str, Any] = Field(..., description="Full XState JSON definition")

    @field_validator('definition')
    @classmethod
    def check_structure(cls, v):
        return validate_xstate_structure(v)

class StateMachineUpdate(BaseModel):
    name: Optional[str] = None
    definition: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

    @field_validator('definition')
    @classmethod
    def check_structure(cls, v):
        if v: return validate_xstate_structure(v)
        return v

# --- 2. OUTPUT (Frontend expects this to Load) ---
class StateMachineRead(BaseModel):
    id: int
    entity_key: str = Field(..., description="Matches DB Column")
    scope: str
    governed_field: str
    name: str
    
    # ⚡ SEMVER FIELDS
    version_major: int
    version_minor: int
    version_patch: int
    
    # ⚡ COMPUTED: Flattened for Frontend Convenience
    @computed_field
    def version(self) -> str:
        return f"{self.version_major}.{self.version_minor}.{self.version_patch}"

    is_active: bool
    is_latest: bool = True 
    
    # MAPPING: DB 'transitions' -> Frontend 'transitions'
    transitions: Dict[str, Any] 
    
    initial_state: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

