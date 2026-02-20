# FILEPATH: backend/app/core/meta/features/topology/router.py
# @file: Topology API Router
# @author: The Engineer (ansav8@gmail.com)
# @description: Exposes the System Topology Graph to the Frontend.
# @security-level: LEVEL 1 (Domain Access)

import logging
import traceback # ⚡ PROBE
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Path

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database.session import get_db

# ⚡ CORE LOGIC
from app.core.meta.features.topology.service import TopologyService
from app.core.meta.features.topology.schemas import TopologyNode

logger = logging.getLogger("api.meta.topology")
router = APIRouter()

@router.get("/{domain}", response_model=List[TopologyNode])
async def get_domain_topology(
    domain: str = Path(..., description="The Domain Key (e.g. USER, SYSTEM)"),
    db: AsyncSession = Depends(get_db)
):
    """
    ⚡ TOPOLOGY GRAPH ENDPOINT
    Returns a unified, flat list of Concrete Children (Tables, Policies, Workflows)
    for a specific Domain. The Frontend simply iterates and renders this list.
    """
    try:
        # The Service handles the DB stitching (Entities + Policies + Scopes)
        return await TopologyService.get_domain_topology(db, domain)
    except Exception as e:
        # ⚡ TELEMETRY PROBE: Print full stack trace to console for debugging 500s
        logger.error(f"🔥 [Topology] CRASH processing domain '{domain}': {str(e)}")
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail=f"Topology Error: {str(e)}")

