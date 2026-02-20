# FILEPATH: backend/app/core/kernel/enforcer.py
# @file: Domain Policy Enforcer (Granular Scope Edition)
# @author: ansav8@gmail.com
# @description: Real-time traffic controller backed by the Level 9 Circuit Breaker.
# UPDATED: Added logic to extract and check granular SCOPE circuits.

import logging
from typing import Optional, Tuple
from app.core.database.session import AsyncSessionLocal
from app.domains.system.logic.hypervisor import SystemHypervisor

logger = logging.getLogger("kernel.enforcer")

class DomainEnforcer:
    """
    The Enforcer Layer.
    Intercepts traffic and asks the Hypervisor for permission.
    Now supports granular Scope-level enforcement.
    """

    @staticmethod
    def _extract_targets(path: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Parses the URL to find the target Domain AND Scope.
        Returns: (Domain, Scope) or (None, None)
        """
        parts = path.strip("/").split("/")
        # Expected formats:
        # 1. /api/v1/resource/DOMAIN/... (Domain only)
        # 2. /api/v1/meta/states/DOMAIN/SCOPE (Domain + Scope)
        # 3. /api/v1/workflow/DOMAIN/SCOPE/... (Domain + Scope)
        
        domain_key = None
        scope_key = None

        if len(parts) >= 4:
            # Handle Meta States: /api/v1/meta/states/{DOMAIN}/{SCOPE}
            if parts[2] == "meta" and parts[3] == "states" and len(parts) >= 6:
                domain_key = parts[4].upper()
                scope_key = parts[5].upper()
            
            # Handle Workflows: /api/v1/workflow/{DOMAIN}/{SCOPE}/...
            elif parts[2] == "workflow" and len(parts) >= 5:
                domain_key = parts[3].upper()
                scope_key = parts[4].upper()

            # Handle Resource: /api/v1/resource/{DOMAIN}/... (Domain only usually)
            elif parts[2] == "resource":
                domain_key = parts[3].upper()
                # Resource IDs are not scopes, so scope_key remains None

        return domain_key, scope_key

    @staticmethod
    async def is_api_allowed(path: str) -> Tuple[bool, str]:
        """
        Validates if the target domain AND scope are open via the Circuit Breaker.
        Returns: (Allowed, Reason)
        """
        domain_key, scope_key = DomainEnforcer._extract_targets(path)
        
        # 1. System bypass (Always allow SYS/AUTH to prevent lockouts)
        if not domain_key or domain_key in ["SYS", "AUTH"]:
            return True, "Core System"

        async with AsyncSessionLocal() as db:
            # 2. Level 1 Check: Domain Circuit
            domain_target = f"domain:{domain_key}"
            
            allowed, reason = await SystemHypervisor.check_state(
                db=db, 
                target=domain_target, 
                plane="API"
            )

            if not allowed:
                return False, f"Domain Lock: {reason}"

            # 3. Level 2 Check: Scope Circuit (if a scope was identified)
            if scope_key:
                scope_target = f"scope:{domain_key}:{scope_key}"
                
                # Check specific scope switch
                allowed_scope, reason_scope = await SystemHypervisor.check_state(
                    db=db,
                    target=scope_target,
                    plane="API"
                )
                
                if not allowed_scope:
                    # Special Case: UI requests to API might fail here if we don't distinguish planes.
                    # But Enforcer is an API Guard, so we check API plane.
                    # Note: Ideally, the Frontend UI plane should have hidden the link, 
                    # but this acts as the hard gate.
                    return False, f"Feature Lock: {reason_scope}"

            return True, "Nominal"
