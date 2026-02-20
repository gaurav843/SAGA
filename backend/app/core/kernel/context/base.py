# FILEPATH: backend/app/core/kernel/context/base.py
# @file Context Provider Interface
# @author The Engineer (ansav8@gmail.com)
# @description The Protocol for injecting Environmental Awareness into the Logic Engine.
#              Modules implement this to expose variables (e.g. 'actor.role', 'system.time')
#              without the Kernel knowing about them.

from abc import ABC, abstractmethod
from typing import Dict, List, Any, TypedDict

# Strict Type Definition for Schema Reflection
class ContextField(TypedDict):
    key: str        # e.g. "timestamp"
    label: str      # e.g. "System Time"
    type: str       # e.g. "DATETIME" (Matches AttributeType)
    description: str

class ContextProvider(ABC):
    """
    The Plugin Interface for Environmental Context.
    """

    @property
    @abstractmethod
    def namespace(self) -> str:
        """
        The root key for this context (e.g. 'system', 'actor').
        """
        pass

    @abstractmethod
    def provide_schema(self) -> List[ContextField]:
        """
        INTROSPECTION: Returns the list of available variables.
        Used by the Frontend Logic Builder to populate dropdowns.
        """
        pass

    @abstractmethod
    async def provide_runtime(self, db: Any, entity: Any) -> Dict[str, Any]:
        """
        EXECUTION: Returns the actual values at runtime.
        Args:
            db: The active AsyncSession.
            entity: The object being saved (Context Subject).
        """
        pass
