:: FILEPATH: backend/start_worker.bat
:: @file Heart Launcher
:: @author The Engineer
:: @description Starts the Background Worker process with correct PYTHONPATH.

@ECHO OFF
TITLE Flodock Heart (Worker)

REM Ensure we are in backend root
CD /D "%~dp0"

REM ⚡ CRITICAL: Add the current directory (backend) to Python Path
REM This ensures 'from app.core...' imports work correctly.
SET PYTHONPATH=%~dp0

REM Activate Virtual Env
IF EXIST "venv\Scripts\activate.bat" (
    CALL venv\Scripts\activate.bat
) ELSE (
    ECHO [WARNING] No venv found. Running global python...
)

ECHO ==========================================
ECHO   💓 FLODOCK HEARTBEAT (Online)
ECHO ==========================================
ECHO   Listening for 'system_outbox' events...
ECHO.

python app/core/kernel/worker.py

PAUSE

