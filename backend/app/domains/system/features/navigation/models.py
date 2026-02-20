# FILEPATH: backend/app/domains/system/features/navigation/models.py
# @file: Navigation Data Models
# @role: 💾 Data Model
# @author: The Engineer (ansav8@gmail.com)
# @description: Persistent registry for the Global OS Shell layout.
# @security-level: LEVEL 9 (Strict Schema)
# @updated: Added 'search_tags' for Command-K discovery.

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.core.database.base import Base

class SystemMenuNode(Base):
    """
    The Global UI Shell Navigation Registry.
    Defines sidebars, top bars, and user menus at the OS level.
    """
    __tablename__ = "sys_menu_nodes"

    id = Column(Integer, primary_key=True, index=True)
    
    # ⚡ UNIQUE IDENTITY
    # We use an explicit constraint in __table_args__ to ensure Postgres sees it before the FK.
    key = Column(String(100), nullable=False, index=True) # e.g. 'core.dashboard'
    
    zone = Column(String(50), nullable=False, index=True) # MAIN_SIDEBAR, AVATAR_DROPDOWN
    label = Column(String(100), nullable=False)
    icon = Column(String(100), nullable=True)
    
    # ⚡ ROUTING (Frontend)
    path = Column(String(255), nullable=True) # The Browser URL (e.g. /dashboard)
    component_path = Column(String(255), nullable=True) # The Physical Source File
    
    # ⚡ API BINDING (Backend)
    api_endpoint = Column(String(255), nullable=True) # The Primary Data Source

    # ⚡ DISCOVERY (Search)
    search_tags = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))

    weight = Column(Integer, default=0)
    
    # ⚡ SELF-REFERENCE FIX
    # use_alter=True: Adds the FK constraint via ALTER TABLE *after* creation.
    # This prevents "no unique constraint" errors during the CREATE TABLE phase.
    parent_key = Column(
        String(100), 
        ForeignKey("sys_menu_nodes.key", use_alter=True, name="fk_sys_menu_parent"), 
        nullable=True
    )
    
    required_policy = Column(String(100), nullable=True) # Security lock key
    
    # ⚡ The Escape Hatch for advanced UI configurations (Badges, hotkeys, etc)
    config = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ⚡ EXPLICIT CONSTRAINTS
    __table_args__ = (
        UniqueConstraint('key', name='uq_sys_menu_node_key'),
    )

    def __repr__(self):
        return f"<SystemMenuNode(key='{self.key}', zone='{self.zone}')>"

