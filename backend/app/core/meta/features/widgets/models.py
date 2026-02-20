# FILEPATH: backend/app/core/meta/features/widgets/models.py
# @file: Widget Registry Models
# @author: The Engineer (ansav8@gmail.com)
# @description: Defines the "Legal Building Blocks" of the UI.
# @security-level: LEVEL 9 (Strict Schema)
# @invariant: Unique constraint on (key, version).

from sqlalchemy import Column, Integer, String, Boolean, DateTime, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.core.database.base import Base

class WidgetDefinition(Base):
    """
    The 'App Store' entry for a UI Component.
    """
    __tablename__ = "meta_widget_definitions"

    id = Column(Integer, primary_key=True, index=True)
    
    # IDENTITY
    key = Column(String(100), nullable=False, index=True) # e.g., "SECURE_PASSWORD"
    name = Column(String(255), nullable=False)            # e.g., "Secure Password Input"
    description = Column(String(500), nullable=True)
    
    # CLASSIFICATION
    category = Column(String(50), default="INPUT", index=True) # INPUT, DISPLAY, CONTAINER
    icon = Column(String(50), nullable=True) # e.g., "antd:LockOutlined"
    
    # THE CONTRACT (JSON Schema)
    # Defines what 'config' props are valid for this widget.
    props_schema = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    
    # THE SIGNALS
    # Defines what events this widget can emit (e.g. ["CHANGE", "BLUR", "GENERATE"])
    events = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))

    # SEMVER (Ledger Strategy)
    version_major = Column(Integer, default=1, nullable=False)
    version_minor = Column(Integer, default=0, nullable=False)
    version_patch = Column(Integer, default=0, nullable=False)
    
    is_latest = Column(Boolean, default=True, index=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('key', 'version_major', 'version_minor', 'version_patch', name='uq_widget_key_version'),
    )

    @property
    def version(self) -> str:
        return f"{self.version_major}.{self.version_minor}.{self.version_patch}"

    def __repr__(self):
        return f"<WidgetDef(key='{self.key}', v={self.version})>"

