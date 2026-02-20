:: FILEPATH: backend/start_dev.bat
:: @file Backend Infrastructure Launcher
:: @author The Engineer
:: @description Boots Postgres, Redis, Runs Migrations, Seeds Data, and Starts API.
::              UPDATED: Fixed 'Parenthesis Trap' and escaped special characters in Echo.

@ECHO OFF
SETLOCAL EnableDelayedExpansion

REM ========================================================
REM [CONFIGURATION] PATHS
REM ========================================================
CD /D "%~dp0"

REM Config
SET POSTGRES_HOME=C:\postgres
SET PG_BIN=%POSTGRES_HOME%\bin
SET PG_CTL="%PG_BIN%\pg_ctl.exe"
SET PG_DATA="%POSTGRES_HOME%\data"
SET PG_LOG="%POSTGRES_HOME%\logfile"
SET REDIS_PATH="C:\Redis\redis-server.exe"

REM Path Setup
SET PATH=%PG_BIN%;%PATH%

echo ========================================================
echo   FLODOCK BACKEND ENGINE - INITIALIZATION
echo ========================================================

REM ========================================================
REM [TIER 1] INFRASTRUCTURE LAYER
REM ========================================================

ECHO [1/6] Checking PostgreSQL Status...
IF EXIST %PG_CTL% (
    %PG_CTL% -D %PG_DATA% status >nul 2>&1
    IF ERRORLEVEL 1 (
        ECHO        Starting Portable PostgreSQL...
        %PG_CTL% -D %PG_DATA% -l %PG_LOG% start
        TIMEOUT /T 3 > NUL
    ) ELSE (
        ECHO        PostgreSQL is already running.
    )
) ELSE (
    ECHO [ERROR] Postgres not found at %PG_CTL%
    PAUSE
    EXIT /B 1
)

ECHO [2/6] Verifying Database 'flodock'...
createdb -U postgres flodock >nul 2>&1
IF %ERRORLEVEL% EQU 0 ( ECHO        Created database 'flodock'. ) ELSE ( ECHO        Database 'flodock' exists. )

ECHO [3/6] Checking Redis...
tasklist /FI "IMAGENAME eq redis-server.exe" 2>NUL | find /I /N "redis-server.exe">NUL
IF "%ERRORLEVEL%"=="0" (
    ECHO        Redis is already running.
) ELSE (
    IF EXIST %REDIS_PATH% (
        START "Infra: Redis" /MIN %REDIS_PATH%
        ECHO        Redis launched.
    ) ELSE (
        ECHO [WARNING] Redis not found at %REDIS_PATH%.
    )
)

REM ========================================================
REM [TIER 2] APPLICATION LAYER
REM ========================================================

ECHO [4/6] Activating Environment...
IF EXIST "venv\Scripts\activate.bat" (
    CALL venv\Scripts\activate.bat
) ELSE (
    ECHO [ERROR] Virtual Environment not found!
    PAUSE
    EXIT /B 1
)

ECHO [4.5/6] Checking Dependencies...
pip install -r requirements.txt >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    ECHO [WARNING] Auto-install failed. Attempting manual install of AI SDK...
    pip install google-generativeai
)

ECHO [5/6] Syncing Schema ^& Seeds...

REM 1. Migrations
ECHO        Running Alembic Upgrade...
alembic upgrade head
IF %ERRORLEVEL% NEQ 0 (
    ECHO [CRITICAL] Database Migration Failed.
    PAUSE
    EXIT /B 1
)

REM 2. Seeds
ECHO        Planting Seeds...
python seed.py --wave all
IF %ERRORLEVEL% NEQ 0 (
    ECHO [WARNING] Seeding encountered errors - Non Critical.
)

REM ========================================================
REM [TIER 3] LAUNCH
REM ========================================================

ECHO.
ECHO [6/6] 🚀 STARTING SPINAL CORD (Port 8000)...
ECHO.
uvicorn app.main:app --reload --port 8000

ENDLOCAL

