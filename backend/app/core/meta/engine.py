# FILEPATH: backend/app/core/meta/engine.py
# @file Meta-Kernel Policy Engine (The Brain)
# @author The Engineer (ansav8@gmail.com)
# @description The Runtime Processor for Level 5 Policy Enforcement.
#              UPDATED: Added 'Value Resolution' for SET_VALUE and TRIGGER_EVENT.
#              This allows policies to use variables (e.g. actor.id) instead of just static strings.

import jmespath
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.core.kernel.actions import LogicResult
from app.core.meta.models import PolicyDefinition
from app.core.meta.constants import PolicyResolutionStrategy, RuleActionType

logger = logging.getLogger("core.meta.engine")

class PolicyEngine:
    """
    The Universal Logic Executor.
    Input: Data + Policies
    Output: LogicResult (Pass/Fail + Messages)
    """

    def evaluate(
        self, 
        entity: Dict[str, Any], 
        policies: List[PolicyDefinition], 
        strategy: str = PolicyResolutionStrategy.ALL_MUST_PASS,
        context_override: Optional[Dict[str, Any]] = None
    ) -> LogicResult:
        """
        The Main Entry Point.
        Evaluates a set of policies against an entity.
        """
        start_time = datetime.now()
        
        # 1. Prepare Data Context (Sandbox Envelope)
        # We wrap the data to allow 'context.meta' or 'context.actor' access if needed later.
        data_context = context_override or {}
        if not data_context:
            data_context = entity if isinstance(entity, dict) else self._serialize(entity)
        
        # Strategy: Pass object directly. Rules should be written as `host.weight > 10`.
        
        combined_result = LogicResult(is_valid=True)
        executed_count = 0
        violation_count = 0

        # 2. Iterate Policies
        for policy in policies:
            if not policy.is_active:
                continue

            policy_result = self._evaluate_single_policy(policy, data_context)
            executed_count += 1

            # 3. Merge Results based on Governance Strategy
            if not policy_result.is_valid:
                violation_count += 1
                combined_result.blocking_errors.extend(policy_result.blocking_errors)
                combined_result.is_valid = False # Temporarily mark false, Strategy decides final
            
            combined_result.warnings.extend(policy_result.warnings)
            combined_result.mutations.extend(policy_result.mutations)
            combined_result.side_effects.extend(policy_result.side_effects)

        # 4. Apply Resolution Strategy ( The Judge )
        final_verdict = self._apply_strategy(strategy, combined_result, executed_count, violation_count)
        
        duration = (datetime.now() - start_time).total_seconds() * 1000
        self._log_summary(final_verdict, executed_count, duration)
        
        return final_verdict

    def _evaluate_single_policy(self, policy: PolicyDefinition, data: Any) -> LogicResult:
        """
        Executes one Policy Bundle (which may contain multiple Rules).
        """
        result = LogicResult(is_valid=True)
        
        # Policies store rules as a JSONB list: [{ "logic": "...", "action": "BLOCK", ... }]
        rules = policy.rules if isinstance(policy.rules, list) else []
        
        for rule in rules:
            try:
                logic_expr = rule.get("logic", "")
                action = rule.get("action", RuleActionType.BLOCK)
                message = rule.get("message", f"Policy '{policy.key}' violation.")
                
                # A. Execute JMESPath
                # Boolean expressions: `host.age > 18` returns True/False.
                is_match = jmespath.search(logic_expr, data)
                
                # B. Handle Match (Triggered)
                if is_match:
                    # ⚡ RESOLVE DYNAMIC VALUES
                    # If action involves data, we must check if the value is a reference (e.g. actor.id)
                    raw_value = rule.get("value")
                    resolved_value = self._resolve_value(raw_value, data)

                    if action == RuleActionType.BLOCK:
                        result.is_valid = False
                        result.blocking_errors.append(message)
                    
                    elif action == RuleActionType.WARN:
                        result.warnings.append(message)
                    
                    elif action == RuleActionType.SET_VALUE:
                        result.mutations.append({
                            "target": rule.get("target"),
                            "value": resolved_value # 👈 NOW RESOLVED
                        })

                    elif action == RuleActionType.TRIGGER_EVENT:
                        result.side_effects.append({
                            "type": "TRIGGER_EVENT",
                            "value": {
                                "event": rule.get("value", {}).get("event"),
                                "payload": rule.get("value", {}).get("payload") # TODO: recursive resolve here if needed
                            }
                        })
                        
                    elif action == RuleActionType.TRANSITION:
                        result.side_effects.append({
                            "type": "TRANSITION",
                            "value": resolved_value
                        })

            except Exception as e:
                # SAFEGUARD: Bad rule syntax should not crash the system.
                logger.error(f"🔥 [PolicyEngine] Rule Crash in '{policy.key}': {e}")
                
                # ⚡ FAIL OPEN: Treat crash as WARNING, not BLOCK.
                result.warnings.append(f"System Governance Warning: Rule crashed in '{policy.key}'. Logic ignored.")
        
        return result

    def _resolve_value(self, value: Any, context: Dict[str, Any]) -> Any:
        """
        Detects if a value is a reference (e.g. 'actor.id') and resolves it against the context.
        """
        if not isinstance(value, str):
            return value
        
        # Heuristic: If it looks like a known context path, try to resolve it.
        # This matches the 'Value Source' logic in the Frontend Policy Editor.
        KNOWN_ROOTS = ['host.', 'meta.', 'system.', 'actor.', 'session.', 'context.']
        
        if any(value.startswith(root) for root in KNOWN_ROOTS):
            try:
                resolved = jmespath.search(value, context)
                # If resolution works, return it. If it returns None, it might mean the field is missing,
                # but we return None rather than the string literal "actor.id".
                return resolved
            except Exception:
                # If JMESPath crashes, fallback to the string literal
                return value
        
        return value

    def _apply_strategy(self, strategy: str, result: LogicResult, total: int, violations: int) -> LogicResult:
        """
        Decides the final outcome based on the strategy.
        """
        if total == 0:
            return result # No policies = Pass

        if strategy == PolicyResolutionStrategy.ALL_MUST_PASS:
            # Default: Any violation kills the transaction
            if violations > 0:
                result.is_valid = False
            else:
                result.is_valid = True

        elif strategy == PolicyResolutionStrategy.AT_LEAST_ONE:
            # If (Total - Violations) > 0, then Pass.
            if (total - violations) > 0:
                result.is_valid = True
                result.blocking_errors = [] # Clear errors if we passed via override
            else:
                result.is_valid = False

        return result

    def _serialize(self, entity: Any) -> Dict[str, Any]:
        """Helper to convert SQLAlchemy objects to Dict for JMESPath."""
        if hasattr(entity, "to_dict"):
            return entity.to_dict()
        if hasattr(entity, "__dict__"):
            return {c.name: getattr(entity, c.name) for c in entity.__table__.columns}
        return str(entity)

    def _log_summary(self, result: LogicResult, count: int, duration: float):
        if not result.is_valid:
            logger.info(f"🚫 [PolicyEngine] BLOCKED ({len(result.blocking_errors)} errors) | {count} Policies | {duration:.2f}ms")
        elif result.warnings:
            logger.info(f"⚠️ [PolicyEngine] WARNED ({len(result.warnings)} warnings) | {count} Policies | {duration:.2f}ms")
        else:
            logger.debug(f"✅ [PolicyEngine] ALLOWED | {count} Policies | {duration:.2f}ms")

# Singleton
policy_engine = PolicyEngine()

