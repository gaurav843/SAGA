# FILEPATH: backend/app/core/config.py
# @file System Configuration
# @description Centralized environment variables using Pydantic Settings.
#              UPDATED: Added GEMINI_API_KEY to fix validation error.

from pydantic_settings import BaseSettings
from typing import List, Union, Optional

class Settings(BaseSettings):
    # --- Project Info ---
    PROJECT_NAME: str = "Flodock Platform v2"
    VERSION: str = "2.5.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment Context (DEV, STAGING, PRODUCTION)
    ENVIRONMENT: str = "DEV" 

    # --- Security ---
    # ⚠️ IN PRODUCTION: This must be loaded from a real .env file!
    SECRET_KEY: str = "DEV_SECRET_KEY_CHANGE_THIS_IMMEDIATELY_IN_PROD_12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # --- Intelligence (AI) ---
    # ⚡ THIS FIELD IS CRITICAL. It tells Pydantic "It's okay to have this in .env"
    GEMINI_API_KEY: Optional[str] = None 

    # --- Nervous System (CORS) ---
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173", 
        "http://localhost:3000",
        "http://127.0.0.1:5173"
    ]
    
    # --- Database ---
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/flodock"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore" # ⚡ SAFETY: Ignores extra env vars instead of crashing

# Singleton Instance
settings = Settings()

