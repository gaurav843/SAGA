# FILEPATH: backend/app/core/database/session.py
# @file: Async Database Engine
# @author: The Engineer
# @description: Configures the SQLAlchemy Async Engine and Session Factory.
# This is the "Heart" that pumps data to the API.
# UPDATED: Logging disabled (echo=False) for performance.

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

# 1. Configure Connection Arguments
# SQLite requires specific flags to handle async threads correctly.
# Postgres does not need this.
connect_args = {}
if "sqlite" in settings.DATABASE_URL:
    connect_args["check_same_thread"] = False

# 2. Create the Async Engine (The Connection Pool)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,                # ⚡ PERFORMANCE: Logging disabled based on Directive P2-S3
    future=True,
    connect_args=connect_args,
)

# 3. Create the Session Factory
# This generates short-lived "sessions" for each API request.
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autoflush=False,
    expire_on_commit=False,
)

# 4. Dependency Injection (The "Needle")
# Endpoints use this to get a safe, isolated database session.
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

