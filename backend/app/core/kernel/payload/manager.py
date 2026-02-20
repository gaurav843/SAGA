# C:\Pythonproject\P2\core\kernel\payload\manager.py
# C:\Pythonproject\P2\modules\core\kernel\payload\manager.py
# @file           manager.py
# @author         ansav8@gmail.com
# @date           2025-12-28
# @description    The Payload Registry.
#                 Manages the mapping between SQLAlchemy Models and their Enrichment Strategies.
#                 This allows the Kernel to be "Federated" - it doesn't know about Domains until they register.

import logging

logger = logging.getLogger(__name__)

class PayloadManager:
    """
    Central Registry for Event Payload Strategies.
    Singleton pattern used by the application to resolve enrichment logic.
    """
    def __init__(self):
        # Maps Model Class -> Strategy Function
        self._strategies = {}

    def register(self, model, strategy):
        """
        Registers a strategy function for a specific SQLAlchemy model.
        
        Args:
            model (db.Model): The SQLAlchemy model class (e.g., Container).
            strategy (callable): A function that takes an instance of 'model' and returns a dict.
        """
        if not model:
            logger.error("Attempted to register payload strategy for NoneType model.")
            return

        key = model.__name__
        self._strategies[key] = strategy
        logger.debug(f"✅ [Payload Registry] Registered strategy for model: {key}")

    def get_strategy(self, model_instance):
        """
        Retrieves the strategy function for a given model instance.
        """
        if not model_instance:
            return None
            
        key = type(model_instance).__name__
        return self._strategies.get(key)

# Global Instance
payload_manager = PayloadManager()

