# FILEPATH: backend/app/core/meta/features/states/logic/validator.py
# @file: Scope Compliance Validator (Dynamic V3)
# @author: The Engineer
# @description: Enforces strict structural rules using Database-Defined JSON Schemas.
# Replaces hardcoded logic with the 'WorkflowType' registry.
# @security-level: LEVEL 9 (Schema Enforcement)

import logging
from typing import Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# ⚡ DEPENDENCY CHECK: Ensure jsonschema is available
try:
    import jsonschema
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False

from app.core.meta.features.states.models import WorkflowType

logger = logging.getLogger("core.meta.states.validator")

class ScopeValidator:
    """
    Enforces Level 7 Constraints dynamically.
    Instead of hardcoding "WIZARD MUST HAVE FORM_SCHEMA", we ask the DB "What is a WIZARD?".
    """

    @staticmethod
    async def validate(db: AsyncSession, definition: Dict[str, Any], scope_type: str):
        """
        Main Entry Point.
        Args:
            db: Active AsyncSession to fetch validation rules.
            definition: The XState JSON blob.
            scope_type: The kernel scope type ('WIZARD', 'JOB', etc.)
        Raises:
            ValueError: If compliance check fails.
        """
        states = definition.get("states", {})
        if not states:
            raise ValueError("Invalid XState: No 'states' defined.")

        # 1. Fetch Rule Definition from DB (The Source of Truth)
        stmt = select(WorkflowType).where(WorkflowType.key == scope_type)
        result = await db.execute(stmt)
        workflow_type = result.scalars().first()

        if not workflow_type:
            logger.warning(f"⚠️ [Validator] Unknown Scope Type '{scope_type}'. Skipping strict validation.")
            return

        # 2. Extract JSON Schema
        validation_schema = workflow_type.validation_schema
        if not validation_schema:
            return

        if not HAS_JSONSCHEMA:
            logger.warning("⚠️ [Validator] 'jsonschema' library missing. Skipping schema validation.")
            return

        # 3. Execute Validation
        try:
            # We validate the ENTIRE definition against the schema stored in DB
            jsonschema.validate(instance=definition, schema=validation_schema)
            logger.info(f"✅ [Validator] '{scope_type}' compliance check passed.")

        except jsonschema.ValidationError as e:
            # Format the error nicely for the API response
            path = " -> ".join([str(p) for p in e.path])
            error_msg = f"{scope_type} Integrity Violation: {e.message} (at {path})"
            logger.error(f"⛔ {error_msg}")
            raise ValueError(error_msg)
            
        except Exception as e:
            logger.error(f"🔥 [Validator] System Error: {e}")
            raise ValueError("Internal Validation Error")

