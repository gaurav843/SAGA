# FILEPATH: backend/app/domains/system/models.py
# @file: System Domain Models (The Control Plane)
# @author: The Engineer (ansav8@gmail.com)
# @description: Defines the Persistent Store for the Operating System.
# @security-level: LEVEL 9 (Strict Relational Integrity)
# @updated: Added Fractal Import for 'SystemMenuNode' to ensure Alembic discovery.

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database.base import Base

# ⚡ DIRECT CLASS IMPORT to fix mapper resolution error
from app.domains.system.features.domain_types.models import KernelDomainType

# ⚡ FRACTAL FEATURE REGISTRATION
# We import feature models here so Alembic can find them via 'app.domains.system.models'
from app.domains.system.features.navigation.models import SystemMenuNode

# ==============================================================================
#  1. KERNEL REGISTRY (The Module Catalog)
# ==============================================================================

class KernelDomain(Base):
    """
    The Master Registry of all installed Modules.
    Maps to 'kernel_domains' table.
    """
    __tablename__ = "kernel_domains"

    # The Immutable Key (e.g., "USER", "SHIPPING")
    key = Column(String(50), primary_key=True, index=True)
    
    # ⚡ META-TYPE LINK (The Classification)
    type_key = Column(String(50), ForeignKey("kernel_domain_types.key"), nullable=False, default="STANDARD")
    
    # Human Readable Identity
    label = Column(String(100), nullable=False)
    
    # ⚡ TOPOLOGY METADATA
    system_module = Column(String(50), default="GENERAL", nullable=False, index=True) 
    module_label = Column(String(100), default="General", nullable=False)             
    module_icon = Column(String(50), default="antd:AppstoreOutlined")                 

    # ⚡ HIERARCHY
    parent_domain = Column(String(50), nullable=True) 
    
    # Legacy Config
    config = Column(JSONB, default=dict)

    # Capability Flags
    is_active = Column(Boolean, default=True, index=True)
    is_virtual = Column(Boolean, default=False)

    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now(), info={"is_system": True})
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), info={"is_system": True})

    # Relations
    scopes = relationship("KernelScope", back_populates="domain", cascade="all, delete-orphan")
    entities = relationship("KernelEntity", back_populates="domain", cascade="all, delete-orphan") # ⚡ NEW v3
    
    # ⚡ FIX: Use Direct Class Reference to prevent "failed to locate name" error
    type_def = relationship(KernelDomainType)

    def __repr__(self):
        return f"<KernelDomain(key='{self.key}', type='{self.type_key}', active={self.is_active})>"


class KernelEntity(Base):
    """
    ⚡ NEW v3: The Physical Table Registry (Aggregate Components).
    Maps internal logic keys (e.g. "PREFS") to physical tables ("user_preferences").
    """
    __tablename__ = "kernel_entities"

    id = Column(Integer, primary_key=True, index=True)
    
    # Identity
    domain_key = Column(String(50), ForeignKey("kernel_domains.key"), nullable=False, index=True)
    key = Column(String(50), nullable=False) # e.g. "PREFS"
    
    # Physical Mapping
    table_name = Column(String(100), nullable=False) # e.g. "user_preferences"
    model_path = Column(String(255), nullable=True)  # e.g. "app.domains.auth.features.preferences.models.UserPreferences"
    
    is_root = Column(Boolean, default=False) # Is this the Aggregate Root?
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    domain = relationship("KernelDomain", back_populates="entities")
    
    __table_args__ = (
        UniqueConstraint('domain_key', 'key', name='uq_kernel_entity_domain_key'),
    )

    def __repr__(self):
        return f"<KernelEntity({self.domain_key}.{self.key} -> {self.table_name})>"


class KernelScope(Base):
    """
    The Workflow Topology Definition.
    Maps to 'kernel_scopes' table.
    """
    __tablename__ = "kernel_scopes"

    id = Column(Integer, primary_key=True, index=True, info={"is_system": True})
    
    # The Parent Domain (e.g., "USER")
    domain_key = Column(String(50), ForeignKey("kernel_domains.key"), nullable=False, index=True)
    
    # The Scope Identity (e.g., "LIFECYCLE", "REGISTER")
    key = Column(String(50), nullable=False)

    # The Scope Behavior Type
    type = Column(String(20), nullable=False) # WIZARD, JOB, VIEW
    
    # ⚡ BEHAVIORAL DISCRIMINATOR
    scope_mode = Column(String(20), nullable=True)

    # Human Readable Label
    label = Column(String(100), nullable=False)

    # ⚡ TARGET BINDING (v3 Upgrade)
    # If null, targets the Aggregate Root.
    target_entity = Column(String(50), nullable=True) # e.g. "PREFS"
    
    # Legacy Support
    target_field = Column(String(50), nullable=True)
    
    # Wizard/View Configuration
    config = Column(JSONB, default=dict)

    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now(), info={"is_system": True})
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), info={"is_system": True})

    # Relations
    domain = relationship("KernelDomain", back_populates="scopes")
    impacts = relationship("KernelScopeImpact", back_populates="scope", cascade="all, delete-orphan") # ⚡ NEW v3

    # ⚡ FIX: Add Unique Constraint so upserts work (Registry Manager depends on this)
    __table_args__ = (
        UniqueConstraint('domain_key', 'key', name='uq_kernel_scope_domain_key'),
    )

    def __repr__(self):
        return f"<KernelScope(domain='{self.domain_key}', key='{self.key}')>"


class KernelScopeImpact(Base):
    """
    ⚡ NEW v3: The Impact Graph (Dependency Map).
    Records which tables a workflow touches.
    """
    __tablename__ = "kernel_scope_impacts"

    id = Column(Integer, primary_key=True, index=True)
    scope_id = Column(Integer, ForeignKey("kernel_scopes.id"), nullable=False, index=True)
    
    # We link by string key to allow loose coupling during boot
    entity_key = Column(String(50), nullable=False) # e.g. "PREFS"
    
    operation = Column(String(20), nullable=False) # READ, WRITE, CREATE, DELETE
    
    scope = relationship("KernelScope", back_populates="impacts")


# ==============================================================================
#  2. SYSTEM CONFIGURATION (The Control Knobs)
# ==============================================================================

class SystemConfig(Base):
    """
    THE CONTROL KNOBS.
    A typed Key-Value store for Runtime Configuration (Feature Flags, Limits).
    """
    __tablename__ = "system_config"

    id = Column(Integer, primary_key=True, index=True)
    
    # Identity
    key = Column(String(100), nullable=False, unique=True, index=True)
    label = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)

    # Value Handling
    value_type = Column(String(20), nullable=False, default="STRING") # STRING, BOOLEAN, NUMBER, JSON
    value_raw = Column(Text, nullable=True) # Stores the actual value as string
    
    # Scope
    category = Column(String(50), default="GENERAL", index=True) # SECURITY, AI, UX
    is_encrypted = Column(Boolean, default=False) # If true, value is encrypted
    is_active = Column(Boolean, default=True)
    
    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<SystemConfig(key='{self.key}', type='{self.value_type}')>"

    @property
    def typed_value(self):
        """
        @description: Auto-converts value_raw based on value_type.
        """
        if self.value_raw is None: return None
        
        if self.value_type == "BOOLEAN":
            return self.value_raw.lower() in ('true', '1', 'yes', 'on')
        if self.value_type == "NUMBER":
            try:
                return float(self.value_raw) if '.' in self.value_raw else int(self.value_raw)
            except ValueError:
                return 0
        if self.value_type == "JSON":
            import json
            try:
                return json.loads(self.value_raw)
            except:
                return {}
        return self.value_raw


# ==============================================================================
#  3. HYPERVISOR CONTROL CIRCUIT (The Level 9 Switchboard)
# ==============================================================================

class CircuitBreaker(Base):
    """
    The System Hypervisor's Memory.
    Controls the operational state of every moving part in the OS.
    """
    __tablename__ = "sys_circuit_breakers"

    id = Column(Integer, primary_key=True, index=True)

    # WHAT are we controlling? (The URI)
    # Format: "domain:USER", "scope:USER:SIGNUP", "system:MAINTENANCE"
    target = Column(String(150), nullable=False, index=True)

    # WHICH Plane? (The Aspect)
    # Values: 'UI', 'API', 'WORKER', 'DATA'
    plane = Column(String(20), nullable=False, index=True)

    # THE STATE
    # Values: 'NOMINAL' (On), 'HALTED' (Off), 'DEGRADED' (ReadOnly), 'MAINTENANCE'
    status = Column(String(20), nullable=False, default="NOMINAL")
    
    # EXTENSIBILITY: Links to Module Registry Types
    module_type = Column(String(50), nullable=True) # e.g. 'WIZARD', 'JOB'

    # AUDIT
    updated_by = Column(String(100), nullable=True)
    reason = Column(String(255), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Constraints: One switch per plane per target
    __table_args__ = (
        UniqueConstraint('target', 'plane', name='uq_circuit_target_plane'),
    )

    def __repr__(self):
        return f"<CircuitBreaker(target='{self.target}', plane='{self.plane}', status='{self.status}')>"

