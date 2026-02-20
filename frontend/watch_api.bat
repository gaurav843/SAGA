:: FILEPATH: frontend/watch_api.bat
:: @file API Watcher
:: @description Runs the OpenAPI Generator in a loop.

@echo off
title Flodock API Watcher
echo [INFO] Sync-Bot Online. Watching http://localhost:8000/api/v1/openapi.json ...
echo.

:loop
:: Run the generator
call npm run gen

:: Wait 5 seconds (suppressing output)
timeout /t 5 >nul

:: Repeat
goto loop

