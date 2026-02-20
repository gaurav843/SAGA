# FILEPATH: backend/app/domains/system/registry.py
# @file: System Domain Registry
# @author: The Engineer
# @description: Registers the Core System Domain (Configuration, Logs, Health).
# @updated: Bound SystemConfig to GLOBAL domain via DomainContext.
# @security-level: LEVEL 9 (Kernel-Level)
# @invariant: System domain must always be active.

from app.core.kernel.registry import domain_registry, DomainContext
from app.core.kernel.registry.base import DomainType

# ⚡ NEW: Import SystemConfig to bind to GLOBAL domain
from app.domains.system.models import SystemConfig

# --- STATIC SCOPES ---
# Defines the capabilities of the System Module.
SYSTEM_SCOPES = [
    {
        "key": "CONFIG_VIEW",
        "label": "Global Configuration",
        "type": "VIEW",
        "target_field": None,
        "config": {
            "component": "SystemConfigDashboard",
            "access_level": "super_admin"
        }
    },
    {
        "key": "AUDIT_LOGS",
        "label": "Security Audit",
        "type": "VIEW",
        "target_field": None,
        "config": {
            "component": "AuditLogViewer"
        }
    },
    {
        "key": "HEALTH_CHECK",
        "label": "System Health",
        "type": "JOB",
        "target_field": None,
        "mode": "maintenance",
        "config": {"schedule": "*/5 * * * *"}
    }
]

# --- 1. SYS DOMAIN (Internal Core) ---
sys_domain = DomainContext(
    domain_key="SYS",
    friendly_name="System Internals",
    
    # ⚡ META-TYPE: Internal System
    domain_type=DomainType.SYSTEM,
    
    # ⚡ TOPOLOGY CONFIGURATION
    system_module="SYSTEM",
    module_label="System Administration",
    module_icon="antd:SettingOutlined",
    
    parent_domain=None,
    dynamic_container="custom_attributes",
    
    # Providers (Basic logic for system resources)
    schema_provider=lambda d: {"*": ["id", "key", "value", "updated_at"]},
    context_loader=lambda id, ctx: {"system_mode": "maintenance"},

    supported_scopes=SYSTEM_SCOPES,
    
    supports_meta=True,
    is_active=True
)

# --- 2. GLOBAL DOMAIN (Configuration Store) ---
# ⚡ THE NEW CITIZEN
# This domain represents the "Global Configuration" features.
# It uses the 'CONFIG' type, which tells the Kernel to use the ConfigProvider logic.

global_domain = DomainContext(
    domain_key="GLOBAL",
    friendly_name="Global Settings",
    
    # ⚡ META-TYPE: Configuration Store
    domain_type=DomainType.CONFIG,
    
    # Topology: Sits inside the System Module
    system_module="SYSTEM",
    module_label="System Administration",
    module_icon="antd:GlobalOutlined",
    
    parent_domain="SYS", # Logically a child of the System
    
    # ⚡ BIND THE MODEL (Fixes the DB Data Starvation)
    model_class=SystemConfig,
    
    # ⚡ DYNAMIC CONTAINER: 'value_raw' inside SystemConfig? 
    # Actually, for CONFIG domains, the 'dynamic_container' concept applies 
    # to how we store *attributes* of the configuration if we were extending it.
    # For now, we leave it standard.
    dynamic_container="properties",
    
    # Providers:
    # Schema: Will be handled by the ConfigProvider (Reflection)
    # Context: Will be handled by ConfigProvider (Runtime)
    # We provide dummy lambdas here because the Kernel validates them, 
    # but the 'CONFIG' type logic will intercept calls before using these.
    schema_provider=lambda d: {}, 
    context_loader=lambda id, ctx: {},
    
    supported_scopes=[], # Global settings usually don't have workflows
    
    supports_meta=True,
    is_active=True
)

# ⚡ REGISTER BOTH
domain_registry.register(sys_domain)
domain_registry.register(global_domain)

