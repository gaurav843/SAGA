# FILEPATH: backend/app/core/kernel/context/manager.py
# @file Context Registry Manager
# @author The Engineer (ansav8@gmail.com)
# @description The Central Switchboard for Context Injection.
#              Aggregates all registered Providers to build the "Context Envelope".

import logging
from typing import Dict, List, Any
from .base import ContextProvider

logger = logging.getLogger("core.kernel.context")

class ContextManager:
    """
    Singleton Orchestrator.
    1. Collects Providers (Register).
    2. Builds Schema (Reflect).
    3. Builds Payload (Resolve).
    """
    
    def __init__(self):
        self._providers: Dict[str, ContextProvider] = {}

    def register(self, provider: ContextProvider):
        """
        Plugins call this to hook into the Kernel.
        """
        if not isinstance(provider, ContextProvider):
            logger.error(f"❌ [Context] Invalid provider registration: {type(provider)}")
            return

        self._providers[provider.namespace] = provider
        logger.debug(f"🔌 [Context] Registered Provider: '{provider.namespace}'")

    def get_schema(self) -> Dict[str, List[Dict[str, str]]]:
        """
        Used by API to serve capabilities to Frontend.
        Returns: { "system": [...fields], "actor": [...fields] }
        """
        schema = {}
        for namespace, provider in self._providers.items():
            try:
                schema[namespace] = provider.provide_schema()
            except Exception as e:
                logger.error(f"⚠️ [Context] Schema reflection failed for '{namespace}': {e}")
                schema[namespace] = []
        return schema

    async def resolve(self, db: Any, entity: Any) -> Dict[str, Any]:
        """
        Used by LogicInterceptor to build the Envelope.
        Executes all providers concurrently (conceptually) and merges results.
        """
        envelope = {}
        
        for namespace, provider in self._providers.items():
            try:
                # In strict fractal design, failures in context should not crash the transaction.
                # We log and return empty for that namespace.
                data = await provider.provide_runtime(db, entity)
                envelope[namespace] = data
            except Exception as e:
                logger.error(f"🔥 [Context] Runtime resolution failed for '{namespace}': {e}")
                envelope[namespace] = {}
                
        return envelope

# Global Instance
context_manager = ContextManager()

