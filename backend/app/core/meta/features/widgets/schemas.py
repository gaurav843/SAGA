# FILEPATH: backend/app/core/meta/features/widgets/schemas.py
# @file: Widget Registry Contracts
# @author: The Engineer
# @description: Pydantic models for the UI Library.

from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, computed_field

# --- 1. INPUT ---
class WidgetCreate(BaseModel):
    key: str = Field(..., min_length=3, pattern=r"^[A-Z0-9_]+$", description="UPPERCASE_KEY only")
    name: str
    description: Optional[str] = None
    category: str = "INPUT"
    icon: Optional[str] = None
    
    props_schema: Dict[str, Any] = Field(default_factory=dict, description="JSON Schema for config props")
    events: List[str] = Field(default_factory=list, description="List of emitted events")

class WidgetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    props_schema: Optional[Dict[str, Any]] = None
    events: Optional[List[str]] = None
    is_active: Optional[bool] = None

# --- 2. OUTPUT ---
class WidgetRead(BaseModel):
    id: int
    key: str
    name: str
    description: Optional[str]
    category: str
    icon: Optional[str]
    
    props_schema: Dict[str, Any]
    events: List[str]
    
    @computed_field
    def version(self) -> str:
        return f"{self.version_major}.{self.version_minor}.{self.version_patch}"

    version_major: int
    version_minor: int
    version_patch: int
    
    is_latest: bool
    is_active: bool
    
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

