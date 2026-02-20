# FILEPATH: backend/app/domains/auth/models.py
# @file: Auth Domain Models (Pure Persistence)
# @author: The Engineer
# @description: Defines the Database Schema for Users.
# UPDATED: Added info={"is_system": True} to system-managed fields.
# UPDATED: Tagged custom_attributes with is_dynamic_container to prevent schema leaks.

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func, text

from app.core.database.base import Base
from app.core.utils import reflect_model_schema

from typing import Dict, Any

class User(Base):
    """
    The Central Identity Entity.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, info={"is_system": True})
    
    # Identity
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    
    # Security
    role = Column(String(50), default="user", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_system_user = Column(Boolean, default=False, nullable=False, info={"is_system": True})
    last_login = Column(DateTime(timezone=True), nullable=True, info={"is_system": True})

    # Governance Targets
    status = Column(String(50), default="PENDING", nullable=False, index=True)
    approval_state = Column(String(50), default="NONE", nullable=True)
    
    # Dynamic Data
    # ⚡ ARCHITECTURAL INVARIANT: Explicitly tag the bucket so the UI/Reflection Engine ignores it.
    custom_attributes = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"), info={"is_dynamic_container": True})

    # Metadata
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), info={"is_system": True})
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), info={"is_system": True})

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "status": self.status,
            "approval_state": self.approval_state,
            "is_active": self.is_active,
            "is_superuser": self.is_superuser,
            "custom_attributes": self.custom_attributes
        }

# --- Context Providers (Moved here to keep Model self-describing) ---

def provide_schema(discriminator: str = "BASE") -> Dict[str, Any]:
    return reflect_model_schema(User).get("fields", {})

def user_context_loader(entity_id: int, session_context: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": entity_id,
        "role": "USER",
        "timestamp": "now"
    }

