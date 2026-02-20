# FILEPATH: backend/app/core/kernel/logic_engine.py
# @file Logic Engine (DEPRECATED)
# @author The Engineer (ansav8@gmail.com)
# @description Replaced by 'app.core.meta.engine.PolicyEngine'.
#              Kept temporarily for backward compatibility with 'RuleDefinition'.

import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
import jmespath

from app.core.kernel.actions import LogicResult

# Redirect Logger
logger = logging.getLogger('core.kernel.logic_engine_legacy')

class LogicEngine:
    """
    [DEPRECATED] v1 Logic Engine.
    Use 'app.core.meta.engine.policy_engine' for all new development.
    """

    def __init__(self):
        logger.warning("⚠️ [DEPRECATION] LogicEngine is deprecated. Use PolicyEngine.")

    def evaluate(
        self, 
        domain_key: str, 
        entity: object, 
        event_type: str = 'SAVE', 
        rules: Optional[List[Any]] = None,
        context_override: Optional[Dict[str, Any]] = None
    ) -> LogicResult:
        
        # Simple passthrough logic for legacy RuleDefinitions
        # (Preserved from original implementation to prevent crashing legacy tests)
        start_time = datetime.now()
        
        # 1. Build Context
        context = {}
        if context_override:
            context = context_override
        else:
            try:
                if hasattr(entity, 'to_dict'):
                    data = entity.to_dict()
                elif hasattr(entity, '__dict__'):
                    data = {c.name: getattr(entity, c.name) for c in entity.__table__.columns}
                else:
                    data = entity 
                context = { "host": data, "original": data } 
            except Exception:
                return LogicResult(is_valid=True)

        if not rules:
            return LogicResult(is_valid=True)

        result = LogicResult(is_valid=True)
        wrapped_context = [context]

        for rule in rules:
            try:
                rule_name = getattr(rule, 'name', 'Unknown')
                rule_logic = getattr(rule, 'logic', '')
                rule_effect = getattr(rule, 'effect', {})

                logic_expression = rule_logic
                if isinstance(logic_expression, str) and not logic_expression.strip().startswith("[?"):
                    logic_expression = f"[? {logic_expression} ]"
                
                match = jmespath.search(logic_expression, wrapped_context)
                is_match = isinstance(match, list) and len(match) > 0
                
                if is_match:
                    effect_type = rule_effect.get('type')
                    msg = rule_effect.get('message', f"Rule '{rule_name}' triggered.")
                    
                    if effect_type == 'BLOCK':
                        result.is_valid = False
                        result.blocking_errors.append(msg)
                    elif effect_type == 'WARN':
                        result.warnings.append(msg)
                    elif effect_type == 'SET_VALUE':
                        result.mutations.append({
                            "target": rule_effect.get('target'),
                            "value": rule_effect.get('value')
                        })
            except Exception as e:
                logger.error(f"❌ [LegacyEngine] Error in '{rule_name}': {e}")

        return result

# Global Instance
logic_engine = LogicEngine()

