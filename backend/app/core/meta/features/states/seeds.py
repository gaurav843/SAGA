# FILEPATH: backend/app/core/meta/features/states/seeds.py
# @file: Workflow Type Seeder
# @author: The Engineer
# @description: Hydrates the Database with the Standard Workflow Types.
# UPDATED: Injected dynamic 'route' into 'ui_config'.
# Converts legacy hardcoded checks into JSON Schema.

import logging
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.meta.features.states.models import WorkflowType

logger = logging.getLogger("core.meta.states.seeds")

# ⚡ THE STANDARD LIBRARY
# Matches behavior in 'logic/validator.py'
CONST_WORKFLOW_TYPES = [
    {
        "key": "WIZARD",
        "label": "Interactive Wizard",
        "description": "Multi-step form flow for user input.",
        # ⚡ DYNAMIC ROUTING: Frontend will read 'route' to navigate
        "ui_config": {"icon": "antd:RocketOutlined", "color": "blue", "route": "/meta/states"},
        # ⚡ JSON SCHEMA: Enforces 'meta.form_schema' exists
        "validation_schema": {
            "type": "object",
            "properties": {
                "states": {
                    "patternProperties": {
                        "^.*$": {
                            "if": { "not": { "properties": { "type": { "const": "final" } } } },
                            "then": {
                                "required": ["meta"],
                                "properties": {
                                    "meta": {
                                        "required": ["form_schema"],
                                        "properties": {
                                            "form_schema": { "type": "array" }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    {
        "key": "JOB",
        "label": "Background Job",
        "description": "Asynchronous task execution flow.",
        # ⚡ DYNAMIC ROUTING
        "ui_config": {"icon": "antd:SettingOutlined", "color": "orange", "route": "/meta/states"},
        # ⚡ JSON SCHEMA: Enforces 'meta.job_config'
        "validation_schema": {
            "type": "object",
            "properties": {
                "states": {
                    "patternProperties": {
                        "^.*$": {
                            "properties": {
                                "meta": {
                                    "properties": {
                                        "job_config": {
                                            "required": ["queue", "retries"],
                                            "properties": {
                                                "queue": { "type": "string" },
                                                "retries": { "type": "integer" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    {
        "key": "GOVERNANCE",
        "label": "Governance Policy",
        "description": "State machine controlling entity lifecycle status.",
        # ⚡ DYNAMIC ROUTING
        "ui_config": {"icon": "antd:SafetyCertificateOutlined", "color": "purple", "route": "/meta/governance"},
        "validation_schema": {
            "type": "object",
            "properties": {
                "states": { "type": "object", "minProperties": 2 }
            }
        }
    },
    {
        "key": "VIEW",
        "label": "Read-Only View",
        "description": "Static dashboard or report configuration.",
        # ⚡ DYNAMIC ROUTING
        "ui_config": {"icon": "antd:DashboardOutlined", "color": "cyan", "route": "/meta/studio"},
        "validation_schema": {}
    }
]

async def seed_workflow_types(db: AsyncSession):
    """
    Idempotent seeder for Workflow Types.
    """
    logger.info("🧬 [StateEngine] Seeding Workflow Types...")
    
    count = 0
    for w_type in CONST_WORKFLOW_TYPES:
        stmt = insert(WorkflowType).values(
            key=w_type["key"],
            label=w_type["label"],
            description=w_type["description"],
            ui_config=w_type["ui_config"],
            validation_schema=w_type["validation_schema"]
        ).on_conflict_do_update(
            index_elements=['key'],
            set_={
                "label": w_type["label"],
                "validation_schema": w_type["validation_schema"],
                "ui_config": w_type["ui_config"]
            }
        )
        await db.execute(stmt)
        count += 1
        
    await db.commit()
    logger.info(f"✅ [StateEngine] Registered {count} Workflow Types.")

