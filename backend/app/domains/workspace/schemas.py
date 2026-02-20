# FILEPATH: backend/app/domains/workspace/schemas.py
# @file: Workspace API Contracts (v2.3 - SemVer Fix)
# @author: The Engineer
# @description: Pydantic models.
# CRITICAL: Ensures 'version_label' is accepted by the API.

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime

# --- SCREEN ---
class ScreenBase(BaseModel):
    title: str = Field(..., min_length=3)
    route_slug: str = Field(..., pattern=r"^[a-z0-9-_]+$")
    security_policy: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True

class ScreenCreate(ScreenBase): pass
class ScreenUpdate(BaseModel):
    title: Optional[str] = None
    route_slug: Optional[str] = None
    security_policy: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    live_release_id: Optional[int] = None

class ScreenRead(ScreenBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    live_release_id: Optional[int] = None
    class Config: from_attributes = True

class ScreenList(BaseModel):
    items: List[ScreenRead]
    count: int

# --- APP ---
class ActiveAppBase(BaseModel):
    screen_id: int
    scope_id: int 
    parent_app_id: Optional[int] = None
    config: Dict[str, Any] = Field(default_factory=dict) 
    placement: Dict[str, Any] = Field(default_factory=dict)
    security_policy: Dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True

class ActiveAppCreate(ActiveAppBase): pass
class ActiveAppUpdate(BaseModel):
    config: Optional[Dict[str, Any]] = None
    placement: Optional[Dict[str, Any]] = None
    security_policy: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    parent_app_id: Optional[int] = None

class ActiveAppRead(ActiveAppBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    scope_key: Optional[str] = None 
    scope_type: Optional[str] = None
    class Config: from_attributes = True

class BrickList(BaseModel):
    items: List[Dict[str, Any]]
    count: int

# --- RELEASE (CRITICAL UPDATE) ---
class ReleaseCreate(BaseModel):
    version_label: str = Field(..., min_length=1, description="Semantic Version (e.g. 1.0.0)")
    description: Optional[str] = "Manual Publish"

class ReleaseRead(BaseModel):
    id: int
    version: int
    version_label: Optional[str] # ⚡ MUST BE HERE
    description: Optional[str]
    created_at: datetime
    screen_id: int
    class Config: from_attributes = True

