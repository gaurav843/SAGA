# FILEPATH: backend/app/domains/system/features/domain_types/models.py
# @file: Domain Type Definition (The DNA)
# @role: 💾 Data Model
# @author: The Engineer (ansav8@gmail.com)
# @description: Defines the 'Class' of a Domain (e.g., STANDARD vs CONFIG).
# This allows the Kernel to behave differently based on the Domain's Type.
# @security-level: LEVEL 9 (Strict Schema)
# @invariant: 'key' must be uppercase ASCII (e.g., 'STANDARD').

from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func, text

from app.core.database.base import Base

class KernelDomainType(Base):
    """
    The Meta-Definition for a Domain Category.
    Instead of hardcoding behavior in Python, we read 'properties' from this table.
    """
    __tablename__ = "kernel_domain_types"

    # Identity
    # e.g., "STANDARD", "CONFIG", "SYSTEM", "LEGACY"
    key = Column(String(50), primary_key=True, index=True)
    
    # Human Readable Label
    # e.g., "Business Entity", "Configuration Store"
    label = Column(String(100), nullable=False)
    
    # ⚡ THE BRAIN (Behavioral Flags)
    # Controls how the Kernel interacts with domains of this type.
    # Schema:
    # {
    #   "storage_strategy": "TABLE" | "KV_STORE" | "NONE",
    #   "api_strategy": "CRUD" | "REFLECT" | "READ_ONLY",
    #   "supports_meta": bool,
    #   "supports_activity": bool
    # }
    properties = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    
    # Documentation
    description = Column(String(500), nullable=True)
    
    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        """
        @description: String representation for logging.
        """
        return f"<KernelDomainType(key='{self.key}')>"

