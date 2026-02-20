# FILEPATH: backend/app/core/meta/schemas.py
# @file: Meta-Kernel Contracts
# @author: The Engineer (ansav8@gmail.com)
# @description: Pydantic Schemas for the Adaptive Data Engine.
# UPDATED: Added Manifest-Driven UI contracts for the Switchboard.
# @security-level: LEVEL 9 (Type Safety)

from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict, computed_field
import re

from app.core.meta.constants import (
    AttributeType, WidgetType, RuleEventType, RuleActionType,
    PolicyResolutionStrategy, ViewEngineType, ScopeType, BindingType
)

class SelectOption(BaseModel):
    label: str
    value: str
    color: Optional[str] = None
    is_active: bool = True

class AttributeConfig(BaseModel):
    model_config = ConfigDict(extra='allow')
    min_length: Optional[int] = None
    max_length: Optional[int] = None
    regex_pattern: Optional[str] = None
    min: Optional[float] = None
    max: Optional[float] = None
    step: Optional[float] = None
    precision: Optional[int] = None
    currency_symbol: Optional[str] = None
    min_date: Optional[str] = None
    max_date: Optional[str] = None
    date_format: Optional[str] = None
    placeholder: Optional[str] = None
    rows: Optional[int] = None
    read_only: Optional[bool] = None
    options: Optional[List[SelectOption]] = None
    target_domain: Optional[str] = None
    allowed_extensions: Optional[List[str]] = None
    json_schema: Optional[Dict[str, Any]] = None
    default_value: Optional[Any] = None
    help_text: Optional[str] = None

class AttributeBase(BaseModel):
    domain: str
    key: str
    label: str
    description: Optional[str] = None
    data_type: AttributeType = AttributeType.TEXT
    widget_type: WidgetType = WidgetType.INPUT
    is_required: bool = False
    is_unique: bool = False
    is_system: bool = False
    is_active: bool = False
    configuration: AttributeConfig = Field(default_factory=AttributeConfig)

class AttributeCreate(AttributeBase): pass
class AttributeUpdate(BaseModel):
    label: Optional[str] = None
    description: Optional[str] = None
    widget_type: Optional[WidgetType] = None
    is_required: Optional[bool] = None
    is_active: Optional[bool] = None
    configuration: Optional[AttributeConfig] = None
class AttributeRead(AttributeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    class Config: from_attributes = True

# ==============================================================================
#  2. POLICY SCHEMAS
# ==============================================================================

class PolicyRule(BaseModel):
    logic: str
    action: RuleActionType = RuleActionType.BLOCK
    message: str = "Policy Violation"
    target: Optional[str] = None
    value: Optional[Any] = None

class PolicyBase(BaseModel):
    key: str
    name: str
    description: Optional[str] = None
    resolution: PolicyResolutionStrategy = PolicyResolutionStrategy.ALL_MUST_PASS
    rules: List[PolicyRule]
    tags: List[str] = []
    is_active: bool = True

class PolicyCreate(PolicyBase): pass
class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    resolution: Optional[PolicyResolutionStrategy] = None
    rules: Optional[List[PolicyRule]] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None

class PolicyRead(PolicyBase):
    id: int
    version_major: int
    version_minor: int
    is_latest: bool
    created_at: datetime
    updated_at: Optional[datetime]
    @computed_field
    @property
    def version_display(self) -> str:
        return f"{self.version_major}.{self.version_minor:02d}"
    class Config: from_attributes = True

# ==============================================================================
#  3. POLICY GROUPS (Enterprise)
# ==============================================================================

class PolicyGroupBase(BaseModel):
    key: str
    name: str
    description: Optional[str] = None
    policy_keys: List[str] = []
    is_active: bool = True
    
    @field_validator('key')
    @classmethod
    def validate_key(cls, v: str) -> str:
        if not re.match(r'^[A-Z0-9_]+$', v):
            raise ValueError("Group Key must be UPPERCASE_WITH_UNDERSCORES")
        return v

class PolicyGroupCreate(PolicyGroupBase): pass
class PolicyGroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    policy_keys: Optional[List[str]] = None
    is_active: Optional[bool] = None

class PolicyGroupRead(PolicyGroupBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    class Config: from_attributes = True

# ==============================================================================
#  4. BINDINGS (The Jurisdiction)
# ==============================================================================

class PolicyBindingBase(BaseModel):
    policy_id: Optional[int] = None
    policy_group_id: Optional[int] = None
    
    binding_type: BindingType = BindingType.ENTITY
    target_domain: str
    target_scope: ScopeType = ScopeType.DOMAIN
    target_context: Optional[str] = None
    priority: int = 0
    is_active: bool = True

    @model_validator(mode='after')
    def check_source(self):
        if not self.policy_id and not self.policy_group_id:
            raise ValueError("Must provide either 'policy_id' OR 'policy_group_id'.")
        return self

class PolicyBindingCreate(PolicyBindingBase): pass
class PolicyBindingUpdate(BaseModel):
    priority: Optional[int] = None
    is_active: Optional[bool] = None

class PolicyBindingRead(PolicyBindingBase):
    id: int
    policy: Optional[PolicyRead] = None
    group: Optional[PolicyGroupRead] = None
    class Config: from_attributes = True

class RuleEffect(BaseModel):
    type: RuleActionType
    message: Optional[str] = None
    target: Optional[str] = None
    value: Optional[Any] = None

class RuleCreate(BaseModel):
    target_domain: str
    scope: Optional[str] = None
    name: str
    description: Optional[str] = None
    event_type: RuleEventType = RuleEventType.SAVE
    logic: Dict[str, Any]
    effect: RuleEffect
    priority: int = 0
    is_active: bool = True

class RuleRead(RuleCreate):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    class Config: from_attributes = True

class DryRunRequest(BaseModel):
    policy: PolicyBase
    context: Dict[str, Any] = Field(default_factory=dict)

class DryRunResult(BaseModel):
    is_valid: bool
    blocking_errors: List[str] = []
    warnings: List[str] = []
    mutations: List[Dict[str, Any]] = []
    side_effects: List[Dict[str, Any]] = []

# ==============================================================================
#  5. DUMB UI MANIFEST (Switchboard V2)
# ==============================================================================

class SwitchboardUIColumn(BaseModel):
    key: str
    label: str
    data_type: str = "TEXT"
    icon: Optional[str] = None
    color: Optional[str] = None

class SwitchboardUIAction(BaseModel):
    key: str
    label: str
    icon: Optional[str] = None
    danger: bool = False
    requires_confirmation: bool = False
    confirmation_text: Optional[str] = None

class SwitchboardManifest(BaseModel):
    columns: List[SwitchboardUIColumn]
    actions: List[SwitchboardUIAction]
    data: List[Dict[str, Any]]
