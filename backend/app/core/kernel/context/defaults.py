# FILEPATH: backend/app/core/kernel/context/defaults.py
# @file: Default Context Providers
# @author: The Engineer (ansav8@gmail.com)
# @description: Standard implementations of the ContextProvider interface.
# Provides 'system' and 'actor' variables to the Logic Engine.
# @security-level LEVEL 9 (Data Binding)
# @updated Wired to GlobalContext.

from typing import Dict, List, Any
from datetime import datetime, timezone

from app.core.config import settings
from app.core.context import GlobalContext

from .base import ContextProvider, ContextField
from .manager import context_manager

class SystemProvider(ContextProvider):
    """
    Provides the Space-Time Continuum (Time, Env, Version).
    Immutable facts about the runtime environment.
    """
    @property
    def namespace(self) -> str:
        return "system"

    def provide_schema(self) -> List[ContextField]:
        return [
            {"key": "timestamp", "label": "Current Time", "type": "DATETIME", "description": "Server UTC Timestamp"},
            {"key": "environment", "label": "Environment", "type": "TEXT", "description": "Deployment Stage (DEV/PROD)"},
            {"key": "version", "label": "System Version", "type": "TEXT", "description": "Kernel Version"},
            {"key": "request_id", "label": "Request ID", "type": "TEXT", "description": "Unique Trace ID"},
            {"key": "is_maintenance", "label": "Maintenance Mode", "type": "BOOLEAN", "description": "Global Lock Flag"}
        ]

    async def provide_runtime(self, db: Any, entity: Any) -> Dict[str, Any]:
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "environment": settings.ENVIRONMENT,
            "version": settings.VERSION,
            "request_id": GlobalContext.get_request_id(),
            "is_maintenance": False # Placeholder for Feature Flag
        }

class ActorProvider(ContextProvider):
    """
    Provides the Agent of Change (User, Role).
    Reads from the Thread-Local GlobalContext populated by Middleware.
    """
    @property
    def namespace(self) -> str:
        return "actor"

    def provide_schema(self) -> List[ContextField]:
        return [
            {"key": "id", "label": "User ID", "type": "NUMBER", "description": "Primary Key of the Actor"},
            {"key": "email", "label": "Email", "type": "TEXT", "description": "User Email Identity"},
            {"key": "role", "label": "Global Role", "type": "TEXT", "description": "RBAC Group (admin, user)"},
            {"key": "is_superuser", "label": "Is Superuser", "type": "BOOLEAN", "description": "God Mode Flag"},
            {"key": "is_system", "label": "Is Bot", "type": "BOOLEAN", "description": "True if automated process"}
        ]

    async def provide_runtime(self, db: Any, entity: Any) -> Dict[str, Any]:
        user = GlobalContext.get_current_user()
        
        if user:
            return {
                "id": user.get("id"),
                "email": user.get("email"),
                "role": user.get("role"),
                "is_superuser": user.get("is_superuser", False),
                "is_system": False
            }
        else:
            # Fallback for Background Workers / Seeds
            return {
                "id": 0,
                "email": "system@kernel",
                "role": "system_operator",
                "is_superuser": True,
                "is_system": True
            }

# Auto-Register on Import
context_manager.register(SystemProvider())
context_manager.register(ActorProvider())

