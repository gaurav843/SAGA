:: FILEPATH: backend/start_db.bat
:: @file Database Engine Room (Nuclear Start)
:: @author The Engineer
:: @description Runs Postgres & Redis. 
::              UPDATED: Forcefully removes stale PID files to prevent "another server might be running" hangs.

@ECHO OFF
SETLOCAL EnableDelayedExpansion
TITLE Flodock Engine Room

REM ========================================================
REM [CONFIGURATION] PATHS
REM ========================================================
CD /D "%~dp0"

SET POSTGRES_HOME=C:\postgres
SET PG_BIN=%POSTGRES_HOME%\bin
SET PG_CTL="%PG_BIN%\pg_ctl.exe"
SET PG_DATA="%POSTGRES_HOME%\data"
SET PG_LOG="%POSTGRES_HOME%\logfile"
SET REDIS_PATH="C:\Redis\redis-server.exe"

REM Critical: Add Postgres to PATH
SET PATH=%PG_BIN%;%PATH%

ECHO ========================================================
ECHO   FLODOCK INFRASTRUCTURE (ISOLATED)
ECHO ========================================================

REM ========================================================
REM [1] POSTGRESQL (FORCE CLEAN START)
REM ========================================================
ECHO [1/3] Preparing Database Engine...

REM 1. Nuclear Kill (Silence errors if process not found)
taskkill /F /IM postgres.exe >nul 2>&1
TIMEOUT /T 1 > NUL

REM 2. Delete Stale Lock File (The cause of the hang)
IF EXIST "%PG_DATA%\postmaster.pid" (
    ECHO 🧹 Removing stale PID lock...
    DEL /F /Q "%PG_DATA%\postmaster.pid"
)

REM 3. Start Fresh
ECHO 🟢 Starting Portable PostgreSQL...
%PG_CTL% -D %PG_DATA% -l %PG_LOG% start

REM 4. Wait for Socket to Open
TIMEOUT /T 3 > NUL

REM ========================================================
REM [2] DATABASE CHECK
REM ========================================================
ECHO [2/3] Verifying Connection...
createdb -U postgres flodock >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    ECHO        Created database 'flodock'.
) ELSE (
    ECHO        Database 'flodock' exists.
)

REM ========================================================
REM [3] REDIS
REM ========================================================
ECHO [3/3] Checking Redis...
tasklist /FI "IMAGENAME eq redis-server.exe" 2>NUL | find /I /N "redis-server.exe">NUL
IF "%ERRORLEVEL%"=="0" (
    ECHO        Redis is already running.
) ELSE (
    IF EXIST %REDIS_PATH% (
        START "Infra: Redis" /MIN %REDIS_PATH%
        ECHO        Redis launched.
    ) ELSE (
        ECHO [WARNING] Redis not found at %REDIS_PATH%. Skipping.
    )
)

REM ========================================================
REM [4] KEEP ALIVE LOOP
REM ========================================================
ECHO.
ECHO ========================================================
ECHO   ENGINE IS ONLINE.
ECHO ========================================================
ECHO.
ECHO   [P] Ping Status
ECHO   [Q] Quit (Kill Everything)
ECHO.

:LOOP
SET /P "CHOICE=Command (P/Q): "
IF /I "%CHOICE%"=="Q" GOTO SHUTDOWN
IF /I "%CHOICE%"=="P" (
    %PG_CTL% -D %PG_DATA% status
)
GOTO LOOP

:SHUTDOWN
ECHO Shutting down...
taskkill /F /IM postgres.exe >nul 2>&1
taskkill /F /IM redis-server.exe >nul 2>&1
TIMEOUT /T 1 > NUL
EXIT