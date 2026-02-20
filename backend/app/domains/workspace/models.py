# FILEPATH: backend/app/domains/workspace/models.py
# @file: Workspace Domain Models (v2.5 - Cycle Fix)
# @author: The Engineer
# @description: Defines Screens, Apps, and RELEASES.
# @updated: Added 'use_alter=True' to break circular dependency between Screen and Release.

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func, text
from app.core.database.base import Base

class Screen(Base):
    """
    THE CANVAS.
    Represents a specific URL Route / Dashboard.
    """
    __tablename__ = "workspace_screens"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    route_slug = Column(String(50), nullable=False, unique=True, index=True) 
    security_policy = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    is_active = Column(Boolean, default=True)
    
    # Live Pointer
    # ⚡ FIX: use_alter=True prevents "Table Not Found" errors during migration
    # by delaying the constraint creation until after both tables exist.
    live_release_id = Column(
        Integer, 
        ForeignKey("workspace_releases.id", use_alter=True, name="fk_screen_live_release"), 
        nullable=True
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    apps = relationship("ActiveApp", back_populates="screen", cascade="all, delete-orphan")
    
    # ⚡ FIX: Specify string arguments for foreign_keys to resolve circular imports lazily if needed
    releases = relationship("Release", back_populates="screen", cascade="all, delete-orphan", foreign_keys="[Release.screen_id]")
    
    live_release = relationship("Release", foreign_keys=[live_release_id], post_update=True)

    def __repr__(self):
        return f"<Screen(slug='{self.route_slug}', title='{self.title}')>"


class ActiveApp(Base):
    """
    THE DRAFT INSTANCE.
    """
    __tablename__ = "workspace_active_apps"

    id = Column(Integer, primary_key=True, index=True)
    screen_id = Column(Integer, ForeignKey("workspace_screens.id"), nullable=False, index=True)
    scope_id = Column(Integer, ForeignKey("kernel_scopes.id"), nullable=False)
    parent_app_id = Column(Integer, ForeignKey("workspace_active_apps.id", ondelete="CASCADE"), nullable=True, index=True)

    config = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    placement = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    security_policy = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    screen = relationship("Screen", back_populates="apps", foreign_keys=[screen_id])
    children = relationship("ActiveApp", back_populates="parent", cascade="all, delete-orphan")
    parent = relationship("ActiveApp", back_populates="children", remote_side=[id])
    
    scope_def = relationship("app.domains.system.models.KernelScope")

    def __repr__(self):
        return f"<ActiveApp(id={self.id}, screen={self.screen_id})>"


class Release(Base):
    """
    THE COMMIT (Snapshot).
    """
    __tablename__ = "workspace_releases"

    id = Column(Integer, primary_key=True, index=True)
    screen_id = Column(Integer, ForeignKey("workspace_screens.id"), nullable=False, index=True)
    
    # Versioning
    version = Column(Integer, nullable=False) # Internal Counter (1, 2, 3)
    version_label = Column(String(50), nullable=True) # ⚡ NEW: SemVer (e.g. "1.0.0")
    description = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(100), nullable=True)

    screen = relationship("Screen", back_populates="releases", foreign_keys=[screen_id])
    items = relationship("ReleaseItem", back_populates="release", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Release(v{self.version}, label='{self.version_label}')>"


class ReleaseItem(Base):
    """
    THE FROZEN ARTIFACT.
    """
    __tablename__ = "workspace_release_items"

    id = Column(Integer, primary_key=True, index=True)
    release_id = Column(Integer, ForeignKey("workspace_releases.id"), nullable=False, index=True)
    
    original_app_id = Column(Integer, nullable=True) 
    scope_key = Column(String(100), nullable=False)
    scope_type = Column(String(50), nullable=False)
    
    config = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    placement = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    parent_context_id = Column(Integer, nullable=True) 

    release = relationship("Release", back_populates="items")

    def __repr__(self):
        return f"<ReleaseItem(scope='{self.scope_key}')>"

