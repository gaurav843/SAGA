# FILEPATH: backend/app/domains/workspace/__init__.py
# @file: Workspace Domain Package
# @author: The Engineer
# @description: Exports the Router for the Kernel Loader.

from .router import router

# ⚡ KERNEL CONTRACT: This variable 'router' is detected by app.core.loader
__all__ = ["router"]

