# FILEPATH: backend/app/core/meta/models.py
# @file: Meta-Kernel Database Models (The Legislature)
# @author: The Engineer (ansav8@gmail.com)
# @description: Defines the Schema for Definitions (Classes) and Policies (Logic).
# @security-level: LEVEL 9 (Strict Schema)
# @invariant: Unique Constraints must enforce Version Integrity.
# @updated: Added 'WorkflowType' to Fractal Imports.

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Index, text, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database.base import Base
from app.core.meta.constants import AttributeType, WidgetType, RuleEventType, PolicyResolutionStrategy, ViewEngineType, ScopeType, BindingType

# ⚡ FRACTAL IMPORTS (The Bridge)
# We import new Feature Models here so Alembic and the App can find them via 'app.core.meta.models'
from app.core.meta.features.widgets.models import WidgetDefinition
from app.core.meta.features.states.models import WorkflowType # ⚡ NEW: State Engine v3

# ==============================================================================
#  1. ATTRIBUTE DEFINITION (The Data Shape)
# ==============================================================================
class AttributeDefinition(Base):
    __tablename__ = "meta_attribute_definitions"

    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String(50), nullable=False, index=True)
    key = Column(String(100), nullable=False, index=True)
    label = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    
    data_type = Column(String(50), nullable=False, default=AttributeType.TEXT)
    widget_type = Column(String(50), nullable=False, default=WidgetType.INPUT)
    
    is_required = Column(Boolean, default=False)
    is_unique = Column(Boolean, default=False) 
    is_system = Column(Boolean, default=False) 
    is_active = Column(Boolean, default=True)  
    
    configuration = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('idx_meta_attr_domain_key', 'domain', 'key', unique=True),
        Index('idx_meta_attr_domain_active', 'domain', 'is_active'),
    )

    def __repr__(self):
        return f"<AttributeDef(domain={self.domain}, key={self.key}, type={self.data_type})>"


# ==============================================================================
#  2. POLICY ENGINE (The Law)
# ==============================================================================
class PolicyDefinition(Base):
    __tablename__ = "meta_policy_definitions"

    id = Column(Integer, primary_key=True, index=True)
    
    # IDENTITY
    key = Column(String(100), nullable=False, index=True) 
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    
    # GOVERNANCE
    resolution = Column(String(50), default=PolicyResolutionStrategy.ALL_MUST_PASS)
    rules = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    
    # METADATA
    tags = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"), index=True)

    # LEDGER METADATA (SemVer)
    version_major = Column(Integer, default=1, nullable=False, server_default=text("1"))
    version_minor = Column(Integer, default=0, nullable=False, server_default=text("0"))
    version_patch = Column(Integer, default=0, nullable=False, server_default=text("0"))
    
    is_latest = Column(Boolean, default=True, index=True) 
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('key', 'version_major', 'version_minor', 'version_patch', name='uq_policy_key_version_full'),
    )

    @property
    def version_display(self):
        return f"{self.version_major}.{self.version_minor}.{self.version_patch}"


class PolicyGroup(Base):
    """
    ⚡ ENTERPRISE FEATURE: Explicit Policy Grouping.
    """
    __tablename__ = "meta_policy_groups"

    id = Column(Integer, primary_key=True, index=True)
    
    key = Column(String(100), nullable=False, unique=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    
    # Stores ordered list of Policy Keys: ["SECURITY_V1", "LOGGING_V2"]
    policy_keys = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class PolicyBinding(Base):
    """
    The Switchboard. Connects a Policy OR a Group to a Context.
    """
    __tablename__ = "meta_policy_bindings"

    id = Column(Integer, primary_key=True, index=True)
    
    # ⚡ The Discriminator
    binding_type = Column(String(20), default=BindingType.ENTITY, nullable=False, index=True)

    # ⚡ STRICT SOURCE POLYMORPHISM
    policy_id = Column(Integer, ForeignKey("meta_policy_definitions.id"), nullable=True)
    policy_group_id = Column(Integer, ForeignKey("meta_policy_groups.id"), nullable=True)

    # TARGET POLYMORPHISM
    target_domain = Column(String(50), nullable=False, index=True)
    target_scope = Column(String(50), default=ScopeType.DOMAIN)
    target_context = Column(String(100), nullable=True)

    priority = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    policy = relationship("PolicyDefinition")
    group = relationship("PolicyGroup")

    __table_args__ = (
        Index('idx_policy_binding_target', 'target_domain', 'target_scope', 'target_context'),
        CheckConstraint(
            '(policy_id IS NOT NULL) OR (policy_group_id IS NOT NULL)',
            name='check_binding_source'
        ),
    )


# ==============================================================================
#  3. STATE KERNEL (Process Flows)
# ==============================================================================
class StateDefinition(Base):
    __tablename__ = "meta_state_definitions"

    id = Column(Integer, primary_key=True, index=True)
    entity_key = Column(String(50), nullable=False)
    scope = Column(String(50), nullable=False, default="LIFECYCLE")

    # The Composite Column Target
    governed_field = Column(String(50), nullable=False, default="status", server_default="status", index=True)
    
    name = Column(String(255), nullable=True)
    initial_state = Column(String(50), nullable=False, default="DRAFT")
    transitions = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    # ⚡ SEMVER UPGRADE (Option B Implementation)
    version_major = Column(Integer, default=1, nullable=False, server_default=text("1"))
    version_minor = Column(Integer, default=0, nullable=False, server_default=text("0"))
    version_patch = Column(Integer, default=0, nullable=False, server_default=text("0"))
    
    # Legacy Support (Computed or Deprecated)
    # For Level 9 strictness, we prefer the new columns but will map 'version' to 'version_patch' in logic if needed.
    version = Column(Integer, nullable=True, default=1) # Deprecated but kept for safety

    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        # ⚡ UPDATED CONSTRAINT: Include Patch in Uniqueness
        UniqueConstraint('entity_key', 'scope', 'version_major', 'version_minor', 'version_patch', name='uq_state_entity_scope_semver'),
    )

    @property
    def version_display(self):
        return f"{self.version_major}.{self.version_minor}.{self.version_patch}"


# ==============================================================================
#  4. VIEW ENGINE (Interfaces)
# ==============================================================================
class ViewDefinition(Base):
    __tablename__ = "meta_view_definitions"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    engine = Column(String(50), default=ViewEngineType.FORM_IO)
    schema = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    
    # SemVer
    version_major = Column(Integer, default=1, nullable=False, server_default=text("1"))
    version_minor = Column(Integer, default=0, nullable=False, server_default=text("0"))
    version_patch = Column(Integer, default=0, nullable=False, server_default=text("0"))
    
    is_latest = Column(Boolean, default=True, index=True, server_default=text("true")) 
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('key', 'version_major', 'version_minor', 'version_patch', name='uq_view_key_version_full'),
    )

class ViewBinding(Base):
    __tablename__ = "meta_view_bindings"

    id = Column(Integer, primary_key=True, index=True)
    view_id = Column(Integer, ForeignKey("meta_view_definitions.id"), nullable=False)
    
    target_domain = Column(String(50), nullable=False)
    target_state = Column(String(50), nullable=True)
    target_role = Column(String(50), nullable=True)
    
    priority = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    view = relationship("ViewDefinition")
    
    __table_args__ = (
        Index('idx_view_binding_lookup', 'target_domain', 'target_state', 'target_role'),
    )

class RuleDefinition(Base):
    __tablename__ = "meta_rule_definitions"

    id = Column(Integer, primary_key=True, index=True)
    target_domain = Column(String(50), nullable=False, index=True)
    scope = Column(String(50), nullable=True, index=True) 
    
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    event_type = Column(String(50), default=RuleEventType.SAVE, index=True)

    logic = Column(JSONB, nullable=False) 
    effect = Column(JSONB, nullable=False)
    
    priority = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

