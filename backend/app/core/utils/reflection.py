# FILEPATH: backend/app/core/utils/reflection.py
# @file: SQLAlchemy Reflection Utility
# @author: ansav8@gmail.com
# @description: Automated Schema Discovery tool.
# Inspects SQLAlchemy models to generate JSON schemas for the Rule Editor and UI Factory.
# UPDATED: Implements "Explicit Metadata" strategy. Reads 'info' dict for UI/Logic control.
# UPDATED: Skips 'is_dynamic_container' columns to prevent JSONB bucket leaks.

import logging
from typing import Dict, List, Any, Type
from sqlalchemy.inspection import inspect
from sqlalchemy.types import Integer, String, Boolean, DateTime, Date, Float, Enum, Numeric
from sqlalchemy.orm import Mapper

# Initialize Floodgate Logger
logger = logging.getLogger('core.utils.reflection')

def reflect_model_schema(model_class: Type[Any], depth: int = 0, max_depth: int = 1) -> Dict[str, Any]:
    """
    Introspects a SQLAlchemy Model and returns a structured Context Graph.
    
    Args:
        model_class: The SQLAlchemy Model Class (e.g., Container)
        depth: Current recursion depth.
        max_depth: Maximum recursion depth to prevent infinite loops.
        
    Returns:
        Dict: {
            "fields": { ... scalar columns ... },
            "relationships": { ... nested structures ... }
        }
    """
    model_name = model_class.__name__
    
    # Indentation for logging readability
    indent = "  " * depth
    logger.debug(f"{indent}🔍 [Reflector] Inspecting Model: {model_name} (Depth: {depth})")

    try:
        mapper: Mapper = inspect(model_class)
        
        # 1. SCALAR FIELDS
        fields = {}
        for column in mapper.columns:
            col_name = column.key
            col_info = column.info or {}
            
            # ⚡ ARCHITECTURAL INVARIANT: Skip Dynamic Containers
            # The bucket itself is not a field, it holds the fields.
            if col_info.get("is_dynamic_container") is True:
                logger.debug(f"{indent}  👻 [Reflector] Skipping Container Bucket: {col_name}")
                continue
                
            col_type = column.type
            
            # --- A. Type Mapping ---
            # Map SQLAlchemy Types to UI Types
            ui_type = "string" # Default
            options = []
            
            if isinstance(col_type, Integer):
                ui_type = "number"
            elif isinstance(col_type, (Float, Numeric)):
                ui_type = "decimal"
            elif isinstance(col_type, Boolean):
                ui_type = "boolean"
            elif isinstance(col_type, (DateTime, Date)):
                ui_type = "datetime"
            elif isinstance(col_type, Enum) or hasattr(col_type, "enums"):
                ui_type = "select"
                options = list(col_type.enums)
            elif isinstance(col_type, String):
                ui_type = "string"
            
            # --- B. Metadata Extraction (The Explicit Strategy) ---
            # We look for the 'info' dict on the column definition first.
            # Fallback to Heuristics if missing.
            
            # Label: Override or Auto-Generate
            label = col_info.get("label") or col_name.replace('_', ' ').title()
            
            # System/Read-Only Status
            # 1. Explicit Override
            is_system_explicit = col_info.get("is_system")
            is_read_only_explicit = col_info.get("read_only")
            
            # 2. Heuristic Fallback (Safety Net)
            is_pk = column.primary_key
            has_server_default = column.server_default is not None
            is_magic_name = col_name in ["created_at", "updated_at", "deleted_at"]
            
            # Final Decision Logic
            if is_system_explicit is not None:
                is_system = is_system_explicit
            else:
                is_system = is_pk or has_server_default or is_magic_name

            if is_read_only_explicit is not None:
                is_read_only = is_read_only_explicit
            else:
                is_read_only = is_system # System fields are read-only by default
            
            # Special Case: 'hashed_password'
            # Should be "password" widget, but never readable.
            widget_type = "input"
            if "password" in col_name or col_info.get("secret"):
                widget_type = "password"
            elif ui_type == "boolean":
                widget_type = "switch"
            elif ui_type == "datetime":
                widget_type = "datetime"
            
            # --- C. Construct Field Definition ---
            field_def = {
                "type": ui_type,
                "widget": widget_type,
                "label": label,
                "is_primary": is_pk,
                "is_nullable": column.nullable,
                "read_only": is_read_only, # 👈 THE ENFORCER (Tells UI to disable input)
                "is_system": is_system,    # Alias for logic engine
                "configuration": {}        # Placeholder for extended config
            }

            # Inject options if found via Enum or Info
            final_options = col_info.get("options") or options
            if final_options:
                field_def["options"] = [{"label": str(o), "value": str(o)} for o in final_options]
                
            fields[col_name] = field_def

        # 2. RELATIONSHIPS (The Graph)
        relationships = {}

        # Only recurse if we haven't hit the limit
        if depth < max_depth:
            for rel in mapper.relationships:
                rel_name = rel.key
                target_class = rel.mapper.class_
                
                # Determine Cardinality
                rel_type = "one_to_many" if rel.uselist else "many_to_one"
                
                logger.debug(f"{indent}  🔗 Found Relation: {rel_name} ({rel_type}) -> {target_class.__name__}")
                
                # Recursive Call
                target_schema = reflect_model_schema(target_class, depth=depth + 1, max_depth=max_depth)
                
                relationships[rel_name] = {
                    "type": rel_type,
                    "target_model": target_class.__name__,
                    "schema": target_schema
                }

        # 3. CONSTRUCT OUTPUT
        graph = {
            "meta": {
                "model": model_name,
                "depth": depth
            },
            "fields": fields,
            "relationships": relationships
        }
        
        logger.info(f"{indent}✅ [Reflector] Reflected {model_name}: {len(fields)} Fields, {len(relationships)} Relations.")
        return graph

    except Exception as e:
        logger.error(f"❌ [Reflector] Failed to reflect {model_name}: {e}", exc_info=True)
        return {}
