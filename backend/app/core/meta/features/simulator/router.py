# FILEPATH: backend/app/core/meta/features/simulator/router.py
# @file Simulator API Endpoint
# @author The Engineer (ansav8@gmail.com)
# @description Exposes the Runtime Simulation Engine to the Frontend.
#              UPDATED: Added GET /inspect for deep data forensic.

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.session import get_db
from app.core.meta.features.simulator.service import RuntimeService
from app.core.meta.features.simulator.schemas import SimulationRequest, SimulationResult

router = APIRouter()

@router.get(
    "/inspect/{domain}/{entity_id}",
    response_model=Dict[str, Any],
    summary="Inspect Real Entity State",
    description="Returns the raw database row for a specific entity. Used by Simulator X-Ray."
)
async def inspect_entity(
    domain: str = Path(..., description="Target Domain (e.g. USER)"),
    entity_id: int = Path(..., description="Entity ID"),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await RuntimeService.inspect_entity(db, domain, entity_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post(
    "/simulate",
    response_model=SimulationResult,
    summary="Run Process Simulation",
    description="Executes a Sandbox Transaction: Applies logic, Enforces Policies, then Rolls back."
)
async def run_simulation(
    payload: SimulationRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await RuntimeService.simulate_transaction(db, payload)
    except ValueError as e:
        # Client Error (Invalid ID, Domain, etc.)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        # Server Error
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

