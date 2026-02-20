# FILEPATH: backend/app/core/meta/features/states/models.py
# @file: State Engine Data Models
# @author: The Engineer
# @description: Defines the 'Class' of a Workflow (e.g. WIZARD vs JOB).
# Replaces hardcoded Enums with Database Rows.
# @security-level: LEVEL 9 (Strict Schema)

from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func, text

from app.core.database.base import Base

class WorkflowType(Base):
    """
    Defines a Category of State Machine.
    
    Acts as a Template/Class for 'StateDefinition'.
    - key: 'WIZARD', 'JOB'
    - validation_schema: JSON Schema used to validate the 'transitions' blob.
    - ui_config: Frontend hints (default icon, color, label).
    """
    __tablename__ = "meta_workflow_types"

    # Identity
    key = Column(String(50), primary_key=True, index=True) # WIZARD, JOB, GOVERNANCE
    label = Column(String(100), nullable=False)            # "Interactive Wizard"
    description = Column(String(500), nullable=True)

    # ⚡ THE BRAIN: Dynamic Validation Logic
    # Instead of hardcoding "if type == WIZARD check form_schema",
    # we store the JSON Schema here and validate dynamically.
    validation_schema = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    # ⚡ UI HINTS (Future Proofing)
    # e.g. { "icon": "ant:RocketOutlined", "color": "blue" }
    ui_config = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<WorkflowType(key='{self.key}')>"

