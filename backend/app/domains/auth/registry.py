# FILEPATH: backend/app/domains/auth/registry.py
# @file: Auth Domain Registry (The Switchboard)
# @author: The Engineer
# @description: Binds Models, Workflows, and Views into a Unified Domain Context.
# @updated: Explicitly separated Scopes by Domain Key to ensure correct Kernel Binding.

from app.core.kernel.registry import domain_registry, DomainContext
from .models import User, provide_schema, user_context_loader
from .workflows import ACTIVE_SCOPES

# ⚡ FRACTAL IMPORT: The Sub-Organ
from .features.preferences.models import UserPreferences

# --- STATIC SCOPES (Jobs & Views) ---
STATIC_SCOPES = [
    {
        "key": "SEND_WELCOME",
        "label": "Send Welcome Email",
        "type": "JOB",
        "target_field": None,
        "config": {"queue": "high_priority", "retry": 3}
    },
    {
        "key": "PROFILE_ADMIN",
        "label": "User 360 Dashboard",
        "type": "VIEW",
        "target_field": None,
        "config": {
            "layout": "dashboard_grid",
            "components": ["kyc_status", "login_history", "audit_log"]
        }
    }
]

# ⚡ SCOPE SEGREGATION (The Fix)
# The Kernel requires that a Domain only registers Scopes that belong to it.
# We filter the master list based on the tuple key.
AUTH_SCOPES = [s for s in ACTIVE_SCOPES if s[0] == "USER"]
PREF_SCOPES = [s for s in ACTIVE_SCOPES if s[0] == "USER_PREFS"]

# --- 1. MAIN DOMAIN (Identity) ---
auth_domain = DomainContext(
    domain_key="USER",
    friendly_name="Identity & Access",
    
    # ⚡ TOPOLOGY CONFIGURATION
    system_module="AUTH",
    module_label="Authentication",
    module_icon="antd:SecurityScanOutlined",
    
    model_class=User,
    schema_provider=provide_schema,
    context_loader=user_context_loader,
    
    # ⚡ REGISTER ONLY USER SCOPES
    supported_scopes=AUTH_SCOPES + STATIC_SCOPES,
    supports_meta=True,
    is_active=True
)

# --- 2. SIDECAR DOMAIN (Preferences) ---
# ⚡ LEVEL 100: Registered as a distinct resource, but lives physically in Auth.
prefs_domain = DomainContext(
    domain_key="USER_PREFS",
    friendly_name="User Settings",
    
    # ⚡ TOPOLOGY CONFIGURATION
    system_module="AUTH", # Same group as User
    module_label="Authentication",
    module_icon="antd:SettingOutlined", # Specific icon for this resource
    parent_domain="USER", # ⚡ HIERARCHY: Nested under USER
    
    model_class=UserPreferences,
    
    # ⚡ DYNAMIC CONTAINER CONFIGURATION
    dynamic_container="preferences",
    
    # Use standard reflection for now
    schema_provider=lambda d: {}, 
    context_loader=lambda id, ctx: {"user_id": id},
    
    # ⚡ REGISTER ONLY PREF SCOPES (Fixes the "Orphaned Workflow" issue)
    supported_scopes=PREF_SCOPES,
    
    supports_meta=True,
    is_active=True
)

# ⚡ REGISTER WITH KERNEL
domain_registry.register(auth_domain)
domain_registry.register(prefs_domain)

