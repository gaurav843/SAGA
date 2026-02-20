REM :: FILEPATH: backend/scripts/kafka/run_cluster.bat
REM :: @file: Nervous System Launcher
REM :: @role: 🚀 Runtime Execution
REM :: @author: The Engineer
REM :: @description: Starts Zookeeper and Kafka using the portable Java runtime.

REM @echo off
REM setlocal

REM :: --- 1. LOCATE RESOURCES
REM pushd %~dp0..\..\
set BACKEND_ROOT=%CD%
popd

set JAVA_ROOT=%BACKEND_ROOT%\infrastructure\java
set KAFKA_ROOT=%BACKEND_ROOT%\infrastructure\kafka

:: Find the exact inner JDK folder (e.g., jdk-17.0.10+7-jre)
for /d %%D in ("%JAVA_ROOT%\*") do (
    set JAVA_HOME=%%~fD
    goto :FoundJava
)

:FoundJava
if not exist "%JAVA_HOME%\bin\java.exe" (
    echo ❌ [Error] Java Executable not found in %JAVA_ROOT%
    pause
    goto :EOF
)

:: Set Path for this session only
set PATH=%JAVA_HOME%\bin;%PATH%

echo 🦖 [Flodock] NERVOUS SYSTEM ACTIVATION
echo ======================================
echo ☕ JAVA_HOME: %JAVA_HOME%
echo 📂 KAFKA_HOME: %KAFKA_ROOT%
echo.

:: --- 2. START ZOOKEEPER ---
echo 🐘 Launching Zookeeper...
start "ZOOKEEPER" /D "%KAFKA_ROOT%" bin\windows\zookeeper-server-start.bat config\zookeeper.properties

:: Wait a moment for ZK to spin up
timeout /t 5 /nobreak >nul

:: --- 3. START KAFKA ---
echo 🦕 Launching Kafka Broker...
start "KAFKA" /D "%KAFKA_ROOT%" bin\windows\kafka-server-start.bat config\server.properties

echo.
echo ✅ Cluster Started.
echo    - Window 1: Zookeeper (Port 2181)
echo    - Window 2: Kafka (Port 9092)
echo.
echo ⚠️  Do not close the popup windows!

