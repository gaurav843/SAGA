# FILEPATH: backend/app/api/v1/resource.py
# @file: Universal Resource Router (Polymorphic v3.0)
# @author: The Engineer
# @description: A Generic CRUD Controller that manages ANY registered Domain Entity.
# UPDATED: Now supports 'DomainType.CONFIG' to handle Global Settings via SystemConfig.
# @security-level: LEVEL 9 (Instrumented)

from typing import Any, Dict, List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, status, Path, Query, Body, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, insert, delete, func, inspect, text, or_
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from datetime import datetime, date

from app.core.database.session import get_db
from app.core.kernel.registry import domain_registry
from app.core.kernel.registry.base import DomainType # ⚡ NEW: Type Discrimination
from app.core.meta.models import AttributeDefinition
from app.core.meta.constants import AttributeType
from app.core.security import get_password_hash 

# ⚡ CONFIG SUPPORT
from app.domains.system.models import SystemConfig
from app.core.kernel.context.config import ConfigProvider

import logging
import traceback

logger = logging.getLogger("api.resource")

router = APIRouter()

# --- HELPER: Deep Merge ---
def deep_merge(target: Dict[str, Any], source: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively merges dictionaries to preserve nested data."""
    for key, value in source.items():
        if isinstance(value, dict) and key in target and isinstance(target[key], dict):
            deep_merge(target[key], value)
        else:
            target[key] = value
    return target

# --- HELPER: Resolve Domain Context ---
def get_domain_context(domain_key: str):
    """
    Retrieves the full Registry Contract for a domain.
    """
    ctx = domain_registry.get_domain(domain_key.upper())
    if not ctx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Domain '{domain_key}' is not registered."
        )
    return ctx

# --- HELPER: Type Caster & Validator ---
def validate_and_cast(value: Any, expected_type: str, field_label: str) -> Any:
    """
    Enforces Strict Typing for Dynamic Fields based on AttributeDefinition.
    """
    if value is None or value == "":
        return None

    try:
        if expected_type == AttributeType.NUMBER:
            if isinstance(value, (int, float)): return value
            return float(value) 
            
        elif expected_type == AttributeType.BOOLEAN:
            if isinstance(value, bool): return value
            return str(value).lower() in ('true', '1', 'yes', 'on')
            
        elif expected_type == AttributeType.DATE:
            return str(value).split("T")[0] 
            
        elif expected_type == AttributeType.DATETIME:
            datetime.fromisoformat(str(value).replace('Z', '+00:00'))
            return str(value)
            
        elif expected_type == AttributeType.JSON:
            if not isinstance(value, (dict, list)):
                raise ValueError("Expected JSON object or list.")
            return value

        return str(value)

    except Exception:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid format for field '{field_label}'. Expected {expected_type}."
        )

# --- HELPER: Input Sanitizer (The Packer & Validator) ---
async def sanitize_payload(
    db: AsyncSession, 
    domain: str, 
    model_class: Any, 
    payload: Dict[str, Any], 
    container_key: str = "custom_attributes",
    is_update: bool = False
) -> Dict[str, Any]:
    """
    1. Splits payload into Columns vs Extras.
    2. Validates Extras against AttributeDefinition (Dynamic Schema).
    3. Packs Extras into the 'container_key' (e.g. 'custom_attributes' or 'preferences').
    4. ⚡ TRANSFORMS 'password' inputs into 'hashed_password'.
    5. ⚡ ENFORCES System Field Protection via Model Metadata.
    """
    clean_data = {}
    extras = {}
    mapper = inspect(model_class)
    
    # Check if the model actually has the configured container
    has_dynamic_container = hasattr(model_class, container_key)

    # 1. Fetch Dynamic Definitions (The Law)
    stmt = select(AttributeDefinition).where(
        AttributeDefinition.domain == domain,
        AttributeDefinition.is_active == True
    )
    result = await db.execute(stmt)
    dynamic_defs = {attr.key: attr for attr in result.scalars().all()}

    for key, value in payload.items():
        
        # ⚡ SECURITY: Transformation Pipeline
        if key == "password" and value:
            if "hashed_password" in mapper.columns:
                logger.info(f"🔐 [Security] Auto-Hashing '{key}' -> 'hashed_password'")
                clean_data["hashed_password"] = get_password_hash(value)
                continue 
        
        # --- A. STATIC COLUMNS ---
        if key in mapper.columns:
            col = mapper.columns[key]
            col_info = col.info or {}

            if col.primary_key: continue
            
            # ⚡ METADATA DRIVEN PROTECTION
            # If the Model says "is_system", we skip it. No magic strings.
            is_system = col_info.get("is_system")
            if is_system is True: 
                continue
            
            # Fallback: If DB controls the default (e.g. auto-increment, triggers), skip unless explicit.
            if is_system is None and col.server_default is not None: 
                continue

            if col_info.get("secret"): continue

            clean_data[key] = value
            continue

        # --- B. DYNAMIC ATTRIBUTES ---
        if has_dynamic_container:
            if key in dynamic_defs:
                attr_def = dynamic_defs[key]
                # Dynamic Attributes marked as system are also protected
                if attr_def.is_system:
                    continue
                    
                validated_val = validate_and_cast(value, attr_def.data_type, attr_def.label)
                extras[key] = validated_val
            
            # Allow bulk update of the container itself if passed directly
            elif key == container_key and isinstance(value, dict):
                extras.update(value)
            
            # If strict mode is off, we might allow ad-hoc extras, but for now we only allow defined attributes
            # or explicit updates to the container.
            else:
                # Store unknown fields in extras? 
                # Policy: If it's not a column and not in dictionary, we treat it as ad-hoc extra.
                extras[key] = value

    if extras:
        clean_data[container_key] = extras

    return clean_data

# --- HELPER: Output Serializer (The Flattener) ---
def serialize_model(instance: Any, container_key: str = "custom_attributes") -> Dict[str, Any]:
    if not instance: return None
    data = {}
    mapper = inspect(instance.__class__)
    
    # 1. Flatten Columns
    for col in mapper.columns:
        key = col.key
        if "password" in key or "secret" in key: continue
        val = getattr(instance, key)
        data[key] = val
        
    # 2. Flatten Dynamic Container (e.g. preferences)
    dynamic_data = getattr(instance, container_key, {})
    if dynamic_data:
        for k, v in dynamic_data.items():
            # Columns take precedence, so only add if not already present
            if k not in data:
                data[k] = v
                
    return data

# ==============================================================================
#  UNIVERSAL CRUD OPERATIONS
# ==============================================================================

@router.get("/{domain}/availability", response_model=Dict[str, Any])
async def check_availability(
    domain: str = Path(...), 
    field: str = Query(..., description="The column name to check"),
    value: str = Query(..., description="The value to validate"),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Checks if a value exists in the database.
    🛑 GUARDRAIL: Only allows checks on INDEXED or UNIQUE columns to prevent Table Scans.
    """
    logger.info(f"🔍 [Availability] Checking {domain}.{field} = '{value}'")
    
    ctx = get_domain_context(domain)
    
    # ⚡ META-TYPE CHECK: Availability not supported for CONFIG
    if ctx.domain_type == DomainType.CONFIG:
        # Config keys are unique, so we check SystemConfig
        if field == "key":
            stmt = select(SystemConfig).where(SystemConfig.key == value)
            exists = (await db.execute(stmt)).scalar() is not None
            return {"available": not exists, "reason": "Config key exists" if exists else "Available"}
        return {"available": True, "reason": "Config values not constrained"}

    Model = ctx.model_class
    mapper = inspect(Model)
    
    # 1. Column Existence Check
    if field not in mapper.columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Field '{field}' does not exist on domain '{domain}'."
        )

    col = mapper.columns[field]
    
    # 2. PERFORMANCE GUARDRAIL
    is_safe = col.primary_key or col.unique or col.index
    
    if not is_safe:
        logger.warning(f"🛡️ [Guardrail] Blocked availability check on non-indexed field: {domain}.{field}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Performance Guardrail Violation: Field '{field}' is not indexed. Availability checks are forbidden."
        )

    # 3. Execution
    try:
        # Case-insensitive check for emails/strings
        if str(col.type).startswith("VARCHAR") or str(col.type).startswith("TEXT") or str(col.type).startswith("STRING"):
            stmt = select(func.count()).select_from(Model).where(col.ilike(value))
        else:
            stmt = select(func.count()).select_from(Model).where(col == value)

        count = (await db.execute(stmt)).scalar()
        
        logger.info(f"   ↳ Found {count} matches.")
        
        return {
            "available": count == 0,
            "reason": "Already exists" if count > 0 else "Available",
            "debug_count": count # Exposed for debugging
        }
    except Exception as e:
        logger.error(f"Availability check failed: {e}")
        raise HTTPException(status_code=500, detail="Internal Query Error")

@router.get("/{domain}", response_model=Dict[str, Any])
async def list_resources(
    request: Request, # ⚡ INJECTED for Dynamic Query Params
    domain: str = Path(...), 
    page: int = Query(1, ge=1), 
    size: int = Query(20, ge=1),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    UNIVERSAL SEARCH ENGINE.
    Supports filtering by any Column OR Custom Attribute (Dynamic Container).
    ⚡ POLYMORPHIC: Adapts to DomainType (STANDARD vs CONFIG).
    """
    ctx = get_domain_context(domain)
    
    # ⚡ BRANCH 1: CONFIG DOMAIN (Global)
    if ctx.domain_type == DomainType.CONFIG:
        # Return list of SystemConfig items, potentially filtered by category
        stmt = select(SystemConfig).where(SystemConfig.is_active == True)
        
        # Simple filter support for Config
        category = request.query_params.get("category")
        if category:
            stmt = stmt.where(SystemConfig.category == category)
            
        result = await db.execute(stmt)
        items = result.scalars().all()
        
        # Serializer for Config
        serialized = []
        for item in items:
            serialized.append({
                "id": item.id,
                "key": item.key,
                "label": item.label,
                "value": item.typed_value, # Use the computed property
                "category": item.category,
                "description": item.description,
                "updated_at": item.updated_at
            })
            
        return {
            "items": serialized,
            "total": len(serialized),
            "page": 1,
            "size": len(serialized),
            "domain": domain.upper()
        }

    # ⚡ BRANCH 2: STANDARD DOMAIN (Entity)
    try:
        Model = ctx.model_class
        container_key = ctx.dynamic_container # ⚡ DYNAMIC RESOLUTION
        mapper = inspect(Model)
        
        columns = {c.key: c for c in mapper.columns}

        # 1. Start with Base Query
        stmt = select(Model)
        
        # 2. Extract Filters (Exclude Control Params)
        filters = {
            k: v for k, v in request.query_params.items() 
            if k not in ["page", "size", "sort", "domain"] and v != ""
        }
        
        applied_filters = []

        # 3. Apply Tri-Layer Filtering logic
        for key, value in filters.items():
            
            # LAYER 1: Physical Column
            if key in columns:
                col = columns[key]
                
                col_type_str = str(col.type).upper()
                is_string_type = "CHAR" in col_type_str or "TEXT" in col_type_str or "STRING" in col_type_str
                
                if is_string_type:
                    stmt = stmt.where(col.expression.ilike(f"%{value}%"))
                    applied_filters.append(f"{key} ~= '{value}'")
                else:
                    stmt = stmt.where(col.expression == value)
                    applied_filters.append(f"{key} == '{value}'")
                    
            # LAYER 2: Dynamic Attribute (JSONB)
            # ⚡ Checks the configured container (custom_attributes OR preferences)
            elif container_key in columns:
                # Safe JSONB lookup using SQLAlchemy text
                stmt = stmt.where(text(f"{container_key}->>'{key}' ILIKE :val_{key}"))
                stmt = stmt.params({f"val_{key}": f"%{value}%"})
                applied_filters.append(f"meta.{key} ~= '{value}'")

            # LAYER 3: Ignore unknown params (Safety)

        if applied_filters:
            logger.info(f"🔍 [Resource] Filtering {domain}: {', '.join(applied_filters)}")

        # 4. Calculate Total (Filtered)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar()

        # 5. Apply Pagination
        offset = (page - 1) * size
        paginated_stmt = stmt.offset(offset).limit(size)
        
        result = await db.execute(paginated_stmt)
        items = result.scalars().all()
        
        return {
            "items": [serialize_model(item, container_key) for item in items],
            "total": total,
            "page": page, 
            "size": size, 
            "domain": domain.upper()
        }
    except Exception as e:
        logger.error(f"List failed for {domain}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Search Error: {str(e)}")

@router.get("/{domain}/{id}")
async def get_resource(
    domain: str = Path(...), id: int = Path(...), db: AsyncSession = Depends(get_db)
) -> Any:
    ctx = get_domain_context(domain)
    
    # ⚡ META-TYPE CHECK
    if ctx.domain_type == DomainType.CONFIG:
        # Config items usually accessed by Key, but if ID provided:
        item = await db.get(SystemConfig, id)
        if not item: raise HTTPException(status_code=404, detail="Config not found")
        return {
            "id": item.id,
            "key": item.key,
            "value": item.typed_value,
            "label": item.label
        }

    Model = ctx.model_class
    container_key = ctx.dynamic_container
    
    item = (await db.execute(select(Model).where(Model.id == id))).scalars().first()
    if not item: raise HTTPException(status_code=404, detail="Resource not found")
    return serialize_model(item, container_key)

@router.post("/{domain}", status_code=201)
async def create_resource(
    domain: str = Path(...), payload: Dict[str, Any] = Body(...), db: AsyncSession = Depends(get_db)
) -> Any:
    ctx = get_domain_context(domain)
    
    # ⚡ BRANCH 1: CONFIG DOMAIN
    if ctx.domain_type == DomainType.CONFIG:
        # Create a new SystemConfig Entry
        # Payload expected: { key, value, label, category, type }
        key = payload.get("key")
        if not key: raise HTTPException(400, "Config Key required")
        
        # Check existence
        existing = await db.execute(select(SystemConfig).where(SystemConfig.key == key))
        if existing.scalars().first():
            raise HTTPException(409, f"Config '{key}' already exists.")
            
        new_config = SystemConfig(
            key=key,
            label=payload.get("label", key),
            description=payload.get("description"),
            value_raw=str(payload.get("value", "")),
            value_type=payload.get("type", "STRING"), # Default to String
            category=payload.get("category", "GENERAL"),
            is_active=True
        )
        db.add(new_config)
        await db.commit()
        await db.refresh(new_config)
        
        # ⚡ HOT SWAP TRIGGER
        ConfigProvider.invalidate()
        
        return {
            "id": new_config.id,
            "key": new_config.key,
            "value": new_config.typed_value
        }

    # ⚡ BRANCH 2: STANDARD DOMAIN
    Model = ctx.model_class
    container_key = ctx.dynamic_container
    
    clean_payload = await sanitize_payload(db, domain.upper(), Model, payload, container_key)
    
    try:
        instance = Model(**clean_payload)
        db.add(instance)
        await db.commit()
        await db.refresh(instance)
        return serialize_model(instance, container_key)
    except Exception as e:
        await db.rollback()
        if "IntegrityError" in str(e):
            raise HTTPException(status_code=400, detail="Duplicate or Invalid Data. Check constraints.")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{domain}/{id}")
async def update_resource(
    domain: str = Path(...), id: int = Path(...), payload: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db)
) -> Any:
    ctx = get_domain_context(domain)
    
    # ⚡ BRANCH 1: CONFIG DOMAIN
    if ctx.domain_type == DomainType.CONFIG:
        config_item = await db.get(SystemConfig, id)
        if not config_item: raise HTTPException(404, "Config not found")
        
        if "value" in payload:
            config_item.value_raw = str(payload["value"])
        if "label" in payload:
            config_item.label = payload["label"]
        if "description" in payload:
            config_item.description = payload["description"]
            
        await db.commit()
        await db.refresh(config_item)
        
        # ⚡ HOT SWAP TRIGGER
        ConfigProvider.invalidate()
        
        return {
            "id": config_item.id,
            "key": config_item.key,
            "value": config_item.typed_value
        }

    # ⚡ BRANCH 2: STANDARD DOMAIN
    Model = ctx.model_class
    container_key = ctx.dynamic_container
    
    result = await db.execute(select(Model).where(Model.id == id))
    instance = result.scalars().first()
    if not instance: raise HTTPException(status_code=404, detail="Resource not found")
    
    clean_payload = await sanitize_payload(db, domain.upper(), Model, payload, container_key, is_update=True)
    if not clean_payload: return serialize_model(instance, container_key)

    logger.info(f"📝 [Resource] Patching {domain}:{id} Keys: {list(clean_payload.keys())}")

    try:
        # ⚡ DYNAMIC CONTAINER MERGE LOGIC
        if container_key in clean_payload and hasattr(instance, container_key):
            current_extras = dict(getattr(instance, container_key, {}) or {})
            new_extras = clean_payload.pop(container_key)
            merged_extras = deep_merge(current_extras, new_extras)
            setattr(instance, container_key, merged_extras)
        
        for key, value in clean_payload.items():
            setattr(instance, key, value)
            
        await db.commit()
        await db.refresh(instance)
        return serialize_model(instance, container_key)
    except Exception as e:
        await db.rollback()
        logger.error(f"Update failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{domain}/{id}", status_code=204)
async def delete_resource(
    domain: str = Path(...), id: int = Path(...), db: AsyncSession = Depends(get_db)
) -> None:
    ctx = get_domain_context(domain)
    
    # ⚡ META-TYPE CHECK: Config Deletion
    if ctx.domain_type == DomainType.CONFIG:
        config_item = await db.get(SystemConfig, id)
        if not config_item: raise HTTPException(404, "Config not found")
        await db.delete(config_item)
        await db.commit()
        
        # ⚡ HOT SWAP TRIGGER
        ConfigProvider.invalidate()
        return

    Model = ctx.model_class
    
    instance = (await db.execute(select(Model).where(Model.id == id))).scalars().first()
    if not instance: raise HTTPException(status_code=404, detail="Resource not found")
    
    if getattr(instance, 'is_system', False) or getattr(instance, 'is_system_user', False):
        raise HTTPException(status_code=403, detail="Cannot delete System Resource.")

    try:
        await db.delete(instance)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

