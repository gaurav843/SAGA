# FILEPATH: backend/app/core/ai/router.py
# @file: AI Cortex API
# @author: The Engineer
# @description: Endpoints for LLM-powered generation.

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.core.ai.service import ai_service

router = APIRouter()

class AIRequest(BaseModel):
    prompt: str
    context: List[Dict[str, Any]]
    domain: Optional[str] = None # ⚡ Added to support frontend's payload

@router.post("/generate", response_model=List[Dict[str, Any]])
async def generate_schema(payload: AIRequest):
    try:
        # We pass context to the service, which extracts the 'mode' from the SYSTEM_INSTRUCTION item
        schema = await ai_service.generate_schema(payload.prompt, payload.context)
        return schema
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

