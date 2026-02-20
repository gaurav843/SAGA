# FILEPATH: backend/app/domains/auth/__init__.py
# @file Auth Domain Entry Point
# @description Exports the Router and TRIGGERS KERNEL REGISTRATION.

from app.api.v1.auth import router as auth_router

# ⚡ CRITICAL: Import the registry to execute the domain registration.
# This binds the Auth Domain to the Core Kernel (Handshake Protocol).
from . import registry

# The Kernel Loader looks for this specific variable name 'router'
router = auth_router

