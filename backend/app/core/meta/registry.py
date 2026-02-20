# FILEPATH: backend/app/core/meta/registry.py
# @file: Meta-Kernel Registry
# @author: The Engineer (ansav8@gmail.com)
# @description: Registers the Meta-Kernel as a 'CORE' domain.
# This allows Policies, Views, and Rules to participate in the Event System (CDC).
# @security-level: LEVEL 9 (Core Infrastructure)

from app.core.kernel.registry import domain_registry, DomainContext
from app.core.kernel.registry.base import DomainType
from app.core.meta.models import PolicyDefinition

# ⚡ THE META DOMAIN
# Acts as the "Hub" for all structural definitions.
# We map multiple models (Policy, View, Widget) to this single Domain Key.
meta_domain = DomainContext(
    domain_key="META",
    friendly_name="Meta Kernel",
    
    # ⚡ CORE TYPE: Writable (CRUD) but Immutable Structure (No Custom Attributes)
    domain_type=DomainType.CORE,
    
    # Topology
    system_module="SYSTEM",
    module_label="System Core",
    module_icon="antd:AppstoreAddOutlined",
    
    # Anchor Model (Conceptually the primary entity, though Interceptor handles others)
    model_class=PolicyDefinition,
    
    # Providers (Standard/Empty for Core infra)
    schema_provider=lambda d: {},
    context_loader=lambda id, ctx: {"context": "meta_kernel"},
    
    supports_meta=False, # ⚡ CRITICAL: Prevents "Meta-on-Meta" recursion
    is_active=True
)

# Register immediately
domain_registry.register(meta_domain)

