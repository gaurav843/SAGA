# FILEPATH: backend/app/main.py
# @file: Application Entry Point (Self-Assembling v3.5 - Strict Isolation)
# @author: ansav8@gmail.com
# @description: Configures FastAPI.
# @security-level: LEVEL 10 (Enterprise Worker Safe)
# @updated: Wires System Registry to ensure GLOBAL domain boots into RAM.

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.core.database.session import engine, AsyncSessionLocal

from app.core.loader import load_domains
from app.core.kernel.interceptor import LogicInterceptor
from app.core.kernel.registry import domain_registry
from app.core.kernel.enforcer import DomainEnforcer

# ⚡ MIDDLEWARE
from app.middleware.context import ContextMiddleware

# ⚡ DOMAIN LOGIC
from app.domains.system.models import SystemConfig, CircuitBreaker 

# ⚡ CORE REGISTRIES (The Handshake)
# Importing these files executes the @register decorators or direct calls
import app.core.meta.registry # ⚡ META-KERNEL REGISTRATION
import app.domains.system.registry # ⚡ SYSTEM REGISTRATION (Awakens GLOBAL)

# Core Routers
from app.api.v1.meta import router as meta_router
from app.api.v1.system import router as system_router
from app.api.v1.resource import router as resource_router
from app.api.v1.workflow import router as workflow_router
from app.core.ai.router import router as ai_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("flodock.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 [Flodock] Platform Starting...")
    LogicInterceptor.register(Session)
    
    # ⚡ PHASE 1: KERNEL BOOT (Read-Only Cache Hydration)
    async with AsyncSessionLocal() as session:
        try:
            logger.info("🔮 [Kernel] Hydrating System Registry from Database...")
            # ⚡ ARCHITECTURAL INVARIANT: The API Server only READS during boot.
            # Seeding is strictly delegated to the standalone `seed.py` Orchestrator.
            await domain_registry.refresh_from_db(session)
            
            logger.info("✨ [Kernel] System Registry Synchronized.")
        except Exception as e:
            logger.critical(f"🔥 [Kernel] BOOT FAILURE: {e}", exc_info=True)
            # We don't raise here to allow the API to start in "Safe Mode" if DB fails,
            # but in Level 100 we might want to crash. For now, we log loud.
    
    yield
    logger.info("🛑 [Flodock] Platform Shutting Down...")
    await engine.dispose()

def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # ⚡ GLOBAL INTERCEPTOR (Business Logic Gates)
    @application.middleware("http")
    async def global_interceptor(request: Request, call_next):
        start_time = time.time()
        path = request.url.path
        method = request.method
        
        # 1. MAINTENANCE CHECK (Global)
        if not path.startswith(("/docs", "/openapi.json", "/api/v1/system")):
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(SystemConfig.value_raw).where(SystemConfig.key == "MAINTENANCE_MODE"))
                mode = result.scalar()
                if mode and mode.lower() in ('true', '1', 'on'):
                    return JSONResponse(status_code=503, content={"error": "System Maintenance", "detail": "Platform Offline"})

        # 2. ⚡ DOMAIN ENFORCEMENT (Kill Switch)
        allowed, reason = await DomainEnforcer.is_api_allowed(path)
        if not allowed:
            logger.warning(f"🛡️ [Enforcer] BLOCKED {method} {path} - Reason: {reason}")
            return JSONResponse(
                status_code=403, 
                content={"error": "Access Denied", "detail": reason, "domain_lock": True}
            )

        try:
            response = await call_next(request)
            return response
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            logger.critical(f"💥 CRITICAL FAILURE: {method} {path} - {process_time:.2f}ms", exc_info=True)
            return JSONResponse(status_code=500, content={"error": "Internal Kernel Panic", "detail": str(e)})

    # ⚡ INFRASTRUCTURE MIDDLEWARE (Execution Order: Bottom-Up)
    
    # 3. CORS (Outermost)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 2. CONTEXT HYDRATION (Injects User/TraceID)
    application.add_middleware(ContextMiddleware)

    # 1. ROUTER MOUNTING
    load_domains(application)
    application.include_router(meta_router, prefix="/api/v1/meta", tags=["Meta-Kernel"])
    application.include_router(system_router, prefix="/api/v1/system", tags=["System-Core"])
    application.include_router(resource_router, prefix="/api/v1/resource", tags=["Universal-Resource"])
    application.include_router(workflow_router, prefix="/api/v1", tags=["Workflow-Engine"])
    application.include_router(ai_router, prefix="/api/v1/ai", tags=["AI-Cortex"])
    
    return application

app = create_application()

