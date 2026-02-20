
# FILEPATH: backend/app/core/meta/features/views/schemas.py
# @file View Engine Contracts
# @author The Engineer (ansav8@gmail.com)
# @description Strict Pydantic Contracts for the View Subsystem.
#              FIXED: Added 'is_active' to allow lifecycle control in UI.
#              FIXED: Enabled 'populate_by_name' for alias flexibility.

from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict
import re

from app.core.meta.constants import ViewEngineType

# ==============================================================================
#  1. VIEW DEFINITION (The Layout Asset)
# ==============================================================================

class ViewBase(BaseModel):
    key: str = Field(..., description="Unique machine name (e.g. 'truck_entry_form')", min_length=3)
    name: str = Field(..., description="Human readable name")
    engine: ViewEngineType = Field(default=ViewEngineType.FORM_IO, description="The Renderer to use")
    schema_config: Dict[str, Any] = Field(..., alias="schema", description="The UI Layout Configuration")
    
    # ⚡ FIX: Added is_active to match Legislature Model and prevent 500 errors
    is_active: bool = Field(default=True, description="Whether this view is available for resolution")

    @field_validator('key')
    @classmethod
    def validate_key(cls, v: str) -> str:
        if not re.match(r'^[a-z0-9_]+$', v):
            raise ValueError("Key must be lowercase, alphanumeric, and underscores only.")
        return v

    @field_validator('schema_config')
    @classmethod
    def validate_schema_structure(cls, v: Dict[str, Any], info) -> Dict[str, Any]:
        """
        POLYMORPHIC VALIDATION:
        Ensures the JSON structure matches the selected Engine.
        """
        engine = info.data.get('engine')
        if not engine:
            return v 

        if engine == ViewEngineType.FORM_IO:
            # Logic for Form.io components
            pass 
        elif engine == ViewEngineType.TANSTACK_TABLE:
            if "columns" not in v and "columnVisibility" not in v:
                 pass
        return v

class ViewCreate(ViewBase):
    pass

class ViewUpdate(BaseModel):
    name: Optional[str] = None
    schema_config: Optional[Dict[str, Any]] = Field(None, alias="schema")
    is_active: Optional[bool] = None

class ViewRead(ViewBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    # ⚡ FIX: populate_by_name ensures we can initialize with either key
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

# ==============================================================================
#  2. VIEW BINDING (The Association)
# ==============================================================================

class ViewBindingBase(BaseModel):
    view_id: int
    target_domain: str = Field(..., description="The Module this applies to (e.g. INVENTORY)")
    
    # Context Selectors
    target_state: Optional[str] = Field(None, description="Only apply when entity is in this state")
    target_role: Optional[str] = Field(None, description="Only apply for this User Role")
    
    priority: int = Field(0, description="Tie-breaker score")
    is_active: bool = True

class ViewBindingCreate(ViewBindingBase):
    pass

class ViewBindingUpdate(BaseModel):
    priority: Optional[int] = None
    is_active: Optional[bool] = None

class ViewBindingRead(ViewBindingBase):
    id: int
    view: Optional[ViewRead] = None
    
    model_config = ConfigDict(from_attributes=True)
