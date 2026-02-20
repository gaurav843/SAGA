# FILEPATH: backend/app/domains/auth/features/preferences/service.py
# @file: Preference Logic Engine
# @author: The Engineer (ansav8@gmail.com)
# @description: Manages the lifecycle of User Settings.
# @security-level: LEVEL 9 (Fail-Safe Defaults)
# @invariant: Must always return a valid JSON object, never None.

import logging
from typing import Dict, Any, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.auth.features.preferences.models import UserPreferences

logger = logging.getLogger("auth.features.preferences")

# ⚡ FACTORY SETTINGS (The Zero State)
# These are used when a user has no row, or explicitly resets.
DEFAULT_PREFERENCES = {
    "theme": {
        "mode": "system",      # system, light, dark, midnight
        "density": "comfortable", # compact, comfortable
        "color_blind_mode": False
    },
    "layout": {
        "sidebar_collapsed": False,
        "dock_visible": True
    },
    "notifications": {
        "email_digest": True,
        "push_marketing": False,
        "desktop_toasts": True
    },
    "workflow": {
        "auto_save": True,
        "confirm_delete": True
    }
}

class PreferenceService:
    """
    The Librarian for User State.
    """

    @staticmethod
    async def get_preferences(db: AsyncSession, user_id: int) -> Dict[str, Any]:
        """
        Fetches preferences. Auto-creates the row if missing (Lazy Init).
        """
        stmt = select(UserPreferences).where(UserPreferences.user_id == user_id)
        result = await db.execute(stmt)
        prefs = result.scalars().first()

        if not prefs:
            logger.info(f"✨ [Preferences] Initializing default state for User #{user_id}")
            prefs = await PreferenceService.initialize_defaults(db, user_id)

        # Merge with defaults to ensure new keys appear for old users
        # Note: In a real implementation, we might want a deep merge utility here.
        # For now, we trust the stored JSON but could overlay it on DEFAULT_PREFERENCES.
        return prefs.preferences

    @staticmethod
    async def initialize_defaults(db: AsyncSession, user_id: int) -> UserPreferences:
        """
        Creates the Sidecar row with Factory Settings.
        """
        db_obj = UserPreferences(
            user_id=user_id,
            preferences=DEFAULT_PREFERENCES,
            version=1
        )
        db.add(db_obj)
        
        try:
            await db.commit()
            await db.refresh(db_obj)
            return db_obj
        except Exception as e:
            await db.rollback()
            # If race condition (already created), just return existing
            logger.warning(f"⚠️ [Preferences] Race condition on init for #{user_id}: {e}")
            stmt = select(UserPreferences).where(UserPreferences.user_id == user_id)
            return (await db.execute(stmt)).scalars().first()

    @staticmethod
    def get_default_schema() -> Dict[str, Any]:
        """
        Returns the structure of the preferences for UI generation.
        In a Level 100 OS, this would be reflected from the Dictionary.
        """
        return DEFAULT_PREFERENCES

