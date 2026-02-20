# FILEPATH: backend/app/domains/auth/workflows/__init__.py
# @file: Auth Workflows Registry
# @author: The Engineer
# @description: Exports all workflow definitions for the Auth Domain.
# @updated: Fixed import errors and added USER_SETTINGS.

# ⚡ CORE FLOWS
from .lifecycle import LIFECYCLE     # Fixed: Was LIFECYCLE_FLOW
from .signup import SIGNUP_FLOW      # Assuming standard naming or explicit export
from .user_create import USER_CREATE
from .user_edit import USER_EDIT
from .user_admin import USER_ADMIN

# ⚡ FRACTAL IMPORT: Import Feature-Specific Workflow
from app.domains.auth.features.preferences.workflows import USER_SETTINGS

# ⚡ REGISTER ALL FLOWS HERE
# The Seeder iterates this list to populate the database.
# Format: (DOMAIN_KEY, SCOPE_DEFINITION)
ACTIVE_SCOPES = [
    ("USER", LIFECYCLE),
    ("USER", SIGNUP_FLOW),
    ("USER", USER_CREATE),
    ("USER", USER_EDIT),
    ("USER", USER_ADMIN),
    ("USER_PREFS", USER_SETTINGS), # ⚡ NEW: Maps to USER_PREFS domain
]

