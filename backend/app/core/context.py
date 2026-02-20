# FILEPATH: backend/app/core/context.py
# @file: Global Context Registry (Thread-Local Storage)
# @author: The Engineer (ansav8@gmail.com)
# @description: Provides safe access to Request-Scoped variables (User, Request ID)
# from anywhere in the stack without passing arguments.
# @security-level LEVEL 0 (Kernel Core)
# @invariant Must handle 'LookupError' gracefully if context is missing.

from contextvars import ContextVar
from typing import Optional, Dict, Any
import uuid

# ⚡ GLOBAL CONTEXT VARIABLES
# These are thread-safe and async-safe.
# They are populated by the 'ContextMiddleware'.

_request_id_ctx: ContextVar[str] = ContextVar("request_id", default="SYSTEM")
_current_user_ctx: ContextVar[Optional[Dict[str, Any]]] = ContextVar("current_user", default=None)
_is_admin_mode_ctx: ContextVar[bool] = ContextVar("is_admin_mode", default=False)

class GlobalContext:
    """
    Static Accessor for the Runtime Context.
    Used by deep kernel logic (Policies, Logging, Auditing).
    """

    @staticmethod
    def get_request_id() -> str:
        """Returns the unique trace ID for the current operation."""
        return _request_id_ctx.get()

    @staticmethod
    def set_request_id(request_id: str):
        """Sets the trace ID. usually called by Middleware."""
        _request_id_ctx.set(request_id)

    @staticmethod
    def get_current_user() -> Optional[Dict[str, Any]]:
        """
        Returns the currently authenticated user as a dictionary.
        Shape: { "id": 1, "email": "...", "role": "admin", ... }
        """
        return _current_user_ctx.get()

    @staticmethod
    def set_current_user(user: Optional[Dict[str, Any]]):
        """Hydrates the user context."""
        _current_user_ctx.set(user)

    @staticmethod
    def get_actor_id() -> int:
        """Helper to safely get the User ID (0 for System)."""
        user = _current_user_ctx.get()
        return user.get("id") if user else 0

    @staticmethod
    def is_system_user() -> bool:
        """True if running as background worker or system process."""
        return _current_user_ctx.get() is None

    @staticmethod
    def set_admin_mode(enabled: bool):
        """Allows bypassing certain policies (Emergency Override)."""
        _is_admin_mode_ctx.set(enabled)

    @staticmethod
    def is_admin_mode() -> bool:
        return _is_admin_mode_ctx.get()

# Export Singleton Accessor
context = GlobalContext

