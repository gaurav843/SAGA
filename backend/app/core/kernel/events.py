# FILEPATH: backend/app/core/kernel/events.py
# @file: System Events Contract
# @author: ansav8@gmail.com
# @description: The "Contract" for all System Events.
# UPDATED: Enforces SemVer string versions (X.Y.Z) instead of integers.

import re
import logging
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

class EventError(Exception):
    """Base exception for Event definition errors."""
    pass

@dataclass
class SystemEvent:
    """
    The Source of Truth for a System Event.
    
    This object defines the 'Contract' between the Code and the Governance System.
    
    Attributes:
        name (str): Strict format 'DOMAIN:ACTION' (e.g. 'CONTAINER:CREATED').
        description (str): Human-readable documentation.
        payload_schema (dict): JSON Schema defining the data.
        version (str): SemVer Schema version (e.g. "1.0.0"). ⚡ UPDATED from int.
        is_deprecated (bool): Warns developers to migrate.
        default_active (bool): Is ON by default?
        category (str): Grouping for UI.
        risk_level (str): Impact classification.
        primary_model (str): The main DB Entity involved.
        related_models (List[str]): Traceability.
    """
    name: str
    description: str
    payload_schema: Dict[str, Any]
    
    # Versioning & Lifecycle
    version: str = "1.0.0" # ⚡ CHANGED: Default to SemVer string
    is_deprecated: bool = False
    
    # Governance defaults
    default_active: bool = True
    category: str = "GENERAL"
    risk_level: str = "LOW"
    
    # Impact Analysis
    primary_model: Optional[str] = None
    related_models: List[str] = field(default_factory=list)
    
    def __post_init__(self):
        """
        Validates the Contract immediately upon instantiation.
        """
        self._validate_naming_convention()
        self._validate_version_format() # ⚡ NEW CHECK
        self._validate_schema_structure()

    def _validate_naming_convention(self):
        """
        Enforces Strict Naming: DOMAIN:VERB (UPPERCASE)
        """
        pattern = r"^[A-Z0-9]+:[A-Z0-9_]+$"
        if not re.match(pattern, self.name):
            raise EventError(
                f"Invalid Event Name '{self.name}'. "
                f"Must follow format 'DOMAIN:ACTION' in UPPERCASE. "
                f"Example: 'CONTAINER:CREATED'"
            )

    def _validate_version_format(self):
        """
        ⚡ Enforces SemVer Format (X.Y.Z)
        """
        # Supports 1.0.0, 1.0.0-alpha, etc.
        pattern = r"^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$"
        
        # Legacy support: If passed as int, convert (but warn) - No, strict fail is better for Level 9.
        if isinstance(self.version, int):
             # Auto-convert int to SemVer (1 -> 1.0.0) if legacy code exists? 
             # No, Architect demands strictness. 
             # But for transition, we might allow it momentarily if needed. 
             # Let's enforce string.
             raise EventError(f"Event '{self.name}' version must be a SemVer string (e.g. '1.0.0'), got int {self.version}")

        if not re.match(pattern, self.version):
            raise EventError(f"Event '{self.name}' version '{self.version}' does not match SemVer format (X.Y.Z).")

    def _validate_schema_structure(self):
        """
        Ensures payload_schema is a dictionary (JSON compatible).
        """
        if not isinstance(self.payload_schema, dict):
            raise EventError(f"Event '{self.name}' must have a dictionary payload_schema.")

# --- COMMON SCHEMA FRAGMENTS ---
class Schemas:
    USER_CONTEXT = {
        "user_id": int,
        "ip_address": str,
        "timestamp": str,
        "correlation_id": str
    }
    
    ENTITY_REF = {
        "id": int,
        "legacy_id": str,
        "display_name": str
    }

