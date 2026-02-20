# FILEPATH: backend/app/core/schema_generator.py
# @file: Schema Generator Module
# @role: 🧠 Logic Core
# @description: Extracts SQLAlchemy model definitions into a JSON-compatible dictionary.
# @updated: Skips columns marked as 'is_dynamic_container' to prevent schema leaks.

import inspect
from sqlalchemy.orm import InstrumentedAttribute

# Import your models here. Ensure these paths are correct.
from app.core.models.user import User
from app.core.models.policy import Policy
from app.core.models.billing import AuditLog, Invoice, Payment, Subscription

def generate_schema():
    """
    Introspects SQLAlchemy models and returns a dictionary representation.
    Output Format:
    {
        "User": {
            "fields": {
                "id": { "type": "Integer", "nullable": False, "primary_key": True },
                ...
            }
        },
        ...
    }
    """
    models = [User, Policy, AuditLog, Invoice, Payment, Subscription]
    schema = {}

    for model in models:
        table_name = model.__tablename__
        
        # We use the Class Name as the key (e.g., "User") for the Frontend to map easily.
        model_name = model.__name__ 
        
        fields = {}
        
        # Inspect the class members to find SQLAlchemy columns
        for name, col in inspect.getmembers(model):
            if isinstance(col, InstrumentedAttribute):
                # Extract Column Metadata
                # Note: We access .property.columns[0] to get the actual Column object
                try:
                    column_def = col.property.columns[0]
                    
                    # ⚡ ARCHITECTURAL INVARIANT: Skip Dynamic Containers
                    col_info = column_def.info or {}
                    if col_info.get("is_dynamic_container") is True:
                        continue
                        
                    type_name = str(column_def.type)
                    
                    # Clean up type name (e.g., "VARCHAR(255)" -> "VARCHAR")
                    if "(" in type_name:
                        type_name = type_name.split("(")[0]

                    fields[name] = {
                        "type": type_name,
                        "nullable": column_def.nullable,
                        "primary_key": column_def.primary_key
                    }
                except AttributeError:
                    # Skip relationships or non-column attributes for now
                    continue

        schema[model_name] = {
            "tableName": table_name,
            "fields": fields
        }

    return schema
