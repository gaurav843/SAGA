# FILEPATH: backend/app/domains/auth/features/preferences/models.py
# @file: User Preferences Model (Sidecar)
# @author: The Engineer (ansav8@gmail.com)
# @description: Defines the persistent store for User UI/UX State.
# @security-level: LEVEL 9 (Isolated Storage)
# @invariant: Must always link 1:1 with a User via Foreign Key.
# @updated: Tagged preferences with is_dynamic_container to prevent schema leaks.

from sqlalchemy import Column, Integer, ForeignKey, DateTime, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.core.database.base import Base

class UserPreferences(Base):
    """
    @description: The UI/UX State Sidecar.
                  Separated from 'User' to prevent lock contention on the Auth table during high-frequency preference toggles.
    @invariant: Deleting the User MUST cascade delete the Preferences.
    """
    __tablename__ = "user_preferences"

    # One-to-One Strong Link (Primary Key is also Foreign Key)
    # ⚡ DECOUPLING: We use string reference "users.id" to avoid importing User model directly.
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    # The Document Store (High Velocity Writes)
    # This column acts as the "Dynamic Container" for the Meta-Kernel.
    # ⚡ ARCHITECTURAL INVARIANT: Explicitly tag the bucket so the UI/Reflection Engine ignores it.
    preferences = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"), info={"is_dynamic_container": True})
    
    # Sync Metadata
    version = Column(Integer, default=1, nullable=False) # Optimistic Locking
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        """
        @description: String representation for logging.
        """
        return f"<UserPreferences(user_id={self.user_id}, v={self.version})>"

