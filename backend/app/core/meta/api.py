# FILEPATH: backend/app/core/meta/api.py
# @file Meta Subsystem Router
# @author The Engineer
# @description Aggregates all Feature Routers (Fractal Architecture).

from fastapi import APIRouter

# Import Feature Routers
from app.core.meta.features.dictionary import router as dictionary_router
from app.core.meta.features.governance import router as governance_router
from app.core.meta.features.groups import router as groups_router
from app.core.meta.features.switchboard import router as switchboard_router
from app.core.meta.features.views import router as views_router
from app.core.meta.features.simulator import router as simulator_router

# ⚡ NEW: State Engine
from app.core.meta.features.states import router as states_router

api_router = APIRouter()

# Register Routes
api_router.include_router(dictionary_router.router, prefix="/dictionary", tags=["Meta: Dictionary"])
api_router.include_router(governance_router.router, prefix="/policies", tags=["Meta: Governance"])
api_router.include_router(groups_router.router, prefix="/groups", tags=["Meta: Groups"])
api_router.include_router(switchboard_router.router, prefix="/bindings", tags=["Meta: Switchboard"])
api_router.include_router(views_router.router, prefix="/views", tags=["Meta: Views"])
api_router.include_router(simulator_router.router, prefix="/simulator", tags=["Meta: Simulator"])

# ⚡ WORKFLOW ENGINE
# Note: The router itself defines prefix="/meta/states", so we don't duplicate it here
# depending on your specific internal router config.
# If states_router uses APIRouter(prefix="/meta/states"), we just include it.
# Assuming standard pattern:
api_router.include_router(states_router.router)
