# FILEPATH: backend/app/core/kernel/registry/base.py
# @file: Kernel Registry Contracts
# @author: The Engineer
# @description: Base Classes for Domain Registration (v3).
# @updated: Restored 'DomainType' full enum and 'domain_type' argument in __init__.

from enum import Enum
from typing import Dict, Any, List, Optional, Type, Callable, Union

# ⚡ RESTORED: The Classification Enum (Full Set)
class DomainType(str, Enum):
    """
    Defines the visibility and lifecycle of a Domain.
    """
    STANDARD = "STANDARD" # Normal Business Module (SQL Table)
    SYSTEM = "SYSTEM"     # Core Kernel Module (Protected)
    HIDDEN = "HIDDEN"     # Internal Utility (No UI)
    CORE = "CORE"         # Infrastructure (Policies, Views)
    CONFIG = "CONFIG"     # Settings Store (SystemConfig)
    VIRTUAL = "VIRTUAL"   # UI Aggregator (No Backend)

class DomainContext:
    """
    The Dynamic Contract.
    Defines the capabilities of a Business Module.
    """
    def __init__(
        self,
        domain_key: str,
        friendly_name: str,
        system_module: str,
        module_label: str,
        module_icon: str,
        
        # ⚡ RESTORED: Meta-Type Classification
        domain_type: Union[DomainType, str] = DomainType.STANDARD,
        
        # ⚡ v3 UPGRADE: Multi-Entity Support
        model_class: Optional[Type] = None, # Legacy/Primary Root
        entities: Dict[str, Type] = None,   # New: {"PREFS": PrefModel, "LOG": LogModel}
        
        schema_provider: Optional[Callable] = None,
        context_loader: Optional[Callable] = None,
        supported_scopes: List[Union[Dict, tuple]] = [], # Supports tuples or dicts
        
        # Metadata
        parent_domain: Optional[str] = None,
        dynamic_container: Optional[str] = None,
        supports_meta: bool = False,
        is_active: bool = True,
        
        # ⚡ OPTIONAL: Schema Discriminator for Polymorphic Domains
        schema_discriminator: str = "DEFAULT"
    ):
        self.domain_key = domain_key
        self.friendly_name = friendly_name
        self.system_module = system_module
        self.module_label = module_label
        self.module_icon = module_icon
        self.domain_type = domain_type # ⚡ STORED
        
        # ⚡ ENTITY REGISTRY LOGIC (The Shim)
        self.root_model = model_class
        self.entities = entities or {}
        
        # Auto-register root if not in entities (Backward Compatibility)
        if self.root_model and "ROOT" not in self.entities:
            self.entities["ROOT"] = self.root_model

        self.schema_provider = schema_provider
        self.context_loader = context_loader
        self.supported_scopes = supported_scopes
        
        self.parent_domain = parent_domain
        self.dynamic_container = dynamic_container
        self.supports_meta = supports_meta
        self.is_active = is_active
        self.schema_discriminator = schema_discriminator

    def validate(self):
        """Strict Validation of the Contract."""
        if not self.domain_key.isupper():
            raise ValueError(f"Domain Key '{self.domain_key}' must be UPPERCASE.")
            
        # Check Entities if present
        for key, model in self.entities.items():
            if not hasattr(model, "__tablename__"):
                raise ValueError(f"Entity '{key}' in domain '{self.domain_key}' is not a valid SQLAlchemy model.")

class ScopeConfig:
    """Helper for defining Scopes (Workflows)."""
    pass
