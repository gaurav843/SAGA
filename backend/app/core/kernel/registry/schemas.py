# FILEPATH: backend/app/core/kernel/registry/schemas.py
# @file: Registry Data Contracts
# @author: The Engineer (ansav8@gmail.com)
# @description: Pydantic models for the Kernel Registry.
# @security-level: LEVEL 0 (Kernel Core)
# @updated: Added 'properties' to DomainTypeRead for Capability-Driven UI.

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

# ⚡ LEVEL 7: DYNAMIC TYPE DEFINITION
class DomainTypeRead(BaseModel):
    """
    Metadata about the Domain Classification.
    Example: { "key": "CONFIG", "properties": { "supports_meta": false } }
    """
    key: str
    label: str
    icon: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    
    # ⚡ CAPABILITY TRANSMISSION (The Payload)
    # Carries the behavioral flags (CRUD, READ_ONLY, KV_STORE) to the frontend.
    properties: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)

class ScopeSummary(BaseModel):
    key: str
    label: str
    type: str
    target_field: Optional[str] = None
    mode: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

    # ⚡ FIX: Enable ORM mode so it can read SQLAlchemy objects
    model_config = ConfigDict(from_attributes=True)

class DomainSummary(BaseModel):
    """
    The High-Level Manifest of a System Module.
    """
    key: str
    label: str
    
    # ⚡ DATA FLOW: This ensures the Frontend gets the Color/Icon info
    # ⚡ FIX: Map 'type_key' from DB to 'type' in Schema
    type: str = Field(validation_alias="type_key")
    
    # ⚡ THE INTELLIGENCE PACKET
    # Contains the Icon, Color, and Capabilities (properties)
    type_def: Optional[DomainTypeRead] = None 
    
    system_module: str
    module_label: str
    module_icon: str
    parent_domain: Optional[str] = None

    icon: Optional[str] = None
    description: Optional[str] = None
    
    scopes: List[ScopeSummary] = []

    model_config = ConfigDict(from_attributes=True)

