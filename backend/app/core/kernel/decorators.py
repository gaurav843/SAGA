# FILEPATH: backend/app/core/kernel/decorators.py
# @file: Kernel Decorators (Passport System)
# @author: The Engineer
# @description: The Registration Interface for Domain Models.
# UPDATED: Added 'domain_type' to support Meta-Type Architecture.
# @security-level: LEVEL 9 (Strict Typing)

import logging
from typing import List, Dict, Any, Type, Union

from sqlalchemy.inspection import inspect
from datetime import datetime

# Import the Registry Infrastructure
from app.core.kernel.registry import domain_registry, DomainContext
from app.core.kernel.registry.base import DomainType # ⚡ NEW IMPORT
from app.core.meta.constants import AttributeType, WidgetType

# Initialize Logger
logger = logging.getLogger("core.kernel.decorators")

def kernel_register(
    domain_key: str,
    friendly_name: str,
    scopes: List[str] = None,
    domain_type: Union[DomainType, str] = DomainType.STANDARD # ⚡ NEW ARGUMENT (Default to STANDARD)
):
    """
    Decorator to register a SQLAlchemy Model as a Kernel Business Domain.
    
    Args:
        domain_key (str): Unique ID (e.g. "USER").
        friendly_name (str): Human label (e.g. "User Identity").
        scopes (List[str]): Legacy scope list (e.g. ["LOGIN"]).
        domain_type (DomainType): The Behavioral Class (STANDARD, CONFIG, SYSTEM).
    """
    def decorator(cls: Type):
        # 1. Prepare Scopes (Level 6 Compliance Patch)
        supported_scopes = []
        if scopes:
            for scope in scopes:
                # ⚡ SMART DEFAULTING
                # We interpret the legacy string list into typed configurations
                scope_key = scope.upper()
                scope_label = scope.replace("_", " ").title()
                
                if scope_key == "LIFECYCLE":
                    # Master Lifecycle Scope
                    supported_scopes.append({
                        "key": scope_key,
                        "label": scope_label,
                        "type": "GOVERNANCE",
                        "target_field": "status"
                    })
                else:
                    # Default to Generic Action
                    supported_scopes.append({
                        "key": scope_key,
                        "label": scope_label,
                        "type": "ACTION",
                        "target_field": None,
                        "mode": None
                    })

        # 2. Define Auto-Reflection Schema Provider
        def provide_schema(discriminator: str = "DEFAULT") -> Dict[str, Any]:
            try:
                inspector = inspect(cls)
                columns = {}
                
                # A. Scan Columns (Primitives)
                for col in inspector.mapper.column_attrs:
                    # Map SQL Types to Meta-Kernel Types
                    python_type = col.columns[0].type.python_type
                    
                    # Defaults
                    data_type = AttributeType.TEXT
                    widget_type = WidgetType.INPUT
                    configuration = {} 

                    if python_type == int:
                        data_type = AttributeType.NUMBER
                        widget_type = WidgetType.NUMBER
                    elif python_type == bool:
                        data_type = AttributeType.BOOLEAN
                        widget_type = WidgetType.SWITCH
                    elif "datetime" in str(python_type).lower():
                        data_type = AttributeType.DATETIME
                        widget_type = WidgetType.DATETIME_PICKER

                    # Special Case: 'email'
                    if "email" in col.key.lower():
                        widget_type = WidgetType.EMAIL
                    
                    # ⚡ INTELLIGENT SYSTEM DETECTION
                    is_pk = col.columns[0].primary_key
                    is_audit = col.key in ['created_at', 'updated_at', 'deleted_at']
                    is_system_flag = col.key.startswith('is_system_') or col.key.startswith('sys_')
                    
                    # A field is 'system' (read-only) if it's managed by the kernel
                    is_system = is_pk or is_audit or is_system_flag

                    columns[col.key] = {
                        "domain": domain_key,
                        "key": col.key,
                        "label": col.key.replace("_", " ").title(),
                        "description": f"Field: {col.key}",
                        "data_type": data_type,
                        "widget_type": widget_type,
                        
                        "is_required": not col.columns[0].nullable,
                        "is_unique": col.columns[0].unique or False,
                        
                        # ⚡ CORRECTED FLAGS
                        "is_system": is_system,
                        "read_only": is_system, # System fields are immutable by rules
                        "is_active": True,
                        
                        "configuration": configuration 
                    }
                
                # B. ⚡ NEW: Scan Relationships (Associations)
                for rel in inspector.mapper.relationships:
                    # Determine type: List (One-to-Many) or Single (Many-to-One)
                    is_list = rel.uselist
                    
                    # Target table name
                    target_table = rel.mapper.class_.__tablename__
                    
                    columns[rel.key] = {
                        "domain": domain_key,
                        "key": rel.key,
                        "label": rel.key.replace("_", " ").title(),
                        "description": f"Relation -> {target_table}",
                        
                        # We map these as special types
                        "data_type": AttributeType.JSON if is_list else AttributeType.REFERENCE,
                        "widget_type": WidgetType.JSON_EDITOR if is_list else WidgetType.REFERENCE_LOOKUP,
                        
                        "is_required": False,
                        "is_unique": False,
                        "is_system": False, # Relationships are navigable
                        "read_only": True,  # Usually we don't edit relationships directly here
                        "is_active": True,
                        "configuration": {
                            "target_table": target_table,
                            "is_relationship": True,
                            "is_list": is_list
                        }
                    }

                return columns
            except Exception as e:
                logger.error(f"Schema Reflection failed for {domain_key}: {e}")
                return {}

        # 3. Define Default Context Loader
        def load_context(entity_id: int, session_context: Dict[str, Any]) -> Dict[str, Any]:
            return {
                "domain": domain_key,
                "entity_id": entity_id,
                "timestamp": datetime.utcnow().isoformat(),
                "source": "kernel_decorator"
            }

        # 4. Construct the Contract
        context = DomainContext(
            domain_key=domain_key,
            friendly_name=friendly_name,
            
            # ⚡ META-TYPE INJECTION (The Fix)
            # This passes the user's intent (e.g. DomainType.CONFIG) to the Registry.
            domain_type=domain_type,
            
            schema_provider=provide_schema,
            context_loader=load_context,
            model_class=cls,
            supported_scopes=supported_scopes, 
            supports_meta=True,
            is_active=True
        )

        # 5. Execute Registration
        try:
            domain_registry.register(context)
            logger.info(f"🏷️  [@kernel_register] Successfully registered Model '{cls.__name__}' as Domain '{domain_key}' (Type: {domain_type})")
        except Exception as e:
            logger.critical(f"🔥 [@kernel_register] Failed to register '{cls.__name__}': {e}")

        return cls

    return decorator

