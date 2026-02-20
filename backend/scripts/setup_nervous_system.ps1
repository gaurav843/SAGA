# FILEPATH: backend/scripts/setup_nervous_system.ps1
# @file: Nervous System Installer (v3.0 - Robust)
# @description: Installs Portable Java and Kafka.
# @invariant: Run this from the /scripts folder.

$ErrorActionPreference = "Stop"

# --- PATH RESOLUTION (Robust) ---
# Get the folder where this script lives
$ScriptDir = $PSScriptRoot
# Go up one level to 'backend'
$BaseDir = (Resolve-Path "$ScriptDir\..").Path
# Define Infrastructure folder
$InfraDir = Join-Path $BaseDir "infrastructure"
$JavaRoot = Join-Path $InfraDir "java"
$KafkaRoot = Join-Path $InfraDir "kafka"

# --- VERSIONS ---
$JavaUrl = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10%2B7/OpenJDK17U-jre_x64_windows_hotspot_17.0.10_7.zip"
$KafkaVersion = "3.6.1"
$ScalaVersion = "2.13"
$KafkaUrl = "https://downloads.apache.org/kafka/$KafkaVersion/kafka_$ScalaVersion-$KafkaVersion.tgz"

Clear-Host
Write-Host "🦖 [Flodock] NERVOUS SYSTEM INSTALLER" -ForegroundColor Cyan
Write-Host "======================================"
Write-Host "📂 Infra Root: $InfraDir"

# 1. ENSURE INFRA DIR EXISTS
if (-not (Test-Path -Path $InfraDir)) {
    New-Item -ItemType Directory -Path $InfraDir | Out-Null
    Write-Host "   -> Created infrastructure folder."
}

# --- STEP 1: PORTABLE JAVA ---
Write-Host "`n☕ [1/3] Checking Java Runtime..." -NoNewline

# Check for existing java.exe
$JavaExe = ""
if (Test-Path $JavaRoot) {
    $Inner = Get-ChildItem -Path $JavaRoot | Select-Object -First 1
    if ($Inner) {
        $PossiblePath = Join-Path $Inner.FullName "bin\java.exe"
        if (Test-Path $PossiblePath) {
            $JavaExe = $PossiblePath
            $env:JAVA_HOME = $Inner.FullName
        }
    }
}

if ($JavaExe) {
    Write-Host " FOUND." -ForegroundColor Green
} else {
    Write-Host " MISSING. Downloading..." -ForegroundColor Yellow
    $JavaZip = Join-Path $InfraDir "openjdk.zip"
    
    # Download
    Invoke-WebRequest -Uri $JavaUrl -OutFile $JavaZip
    
    # Extract
    Write-Host "       Extracting OpenJDK..."
    Expand-Archive -Path $JavaZip -DestinationPath $JavaRoot -Force
    Remove-Item $JavaZip
    
    # Set Env
    $Inner = Get-ChildItem -Path $JavaRoot | Select-Object -First 1
    $env:JAVA_HOME = $Inner.FullName
    Write-Host "✅ INSTALLED." -ForegroundColor Green
}

# Add to PATH for this session
$env:PATH = "$($env:JAVA_HOME)\bin;$env:PATH"
# Verify
java -version 2>&1 | Select-Object -First 1 | Write-Host

# --- STEP 2: APACHE KAFKA ---
Write-Host "`n🦕 [2/3] Checking Kafka..." -NoNewline

$StartScript = Join-Path $KafkaRoot "bin\windows\kafka-server-start.bat"

if (Test-Path $StartScript) {
    Write-Host " FOUND." -ForegroundColor Green
} else {
    Write-Host " MISSING. Downloading..." -ForegroundColor Yellow
    $KafkaTgz = Join-Path $InfraDir "kafka.tgz"
    
    if (-not (Test-Path $KafkaTgz)) {
        Invoke-WebRequest -Uri $KafkaUrl -OutFile $KafkaTgz
    }
    
    Write-Host "       Extracting Kafka (using tar)..."
    # Navigate to infra dir to run tar
    Push-Location $InfraDir
    tar -xf kafka.tgz
    
    # Cleanup folder name
    $Extracted = "kafka_$ScalaVersion-$KafkaVersion"
    if (Test-Path "kafka") { Remove-Item "kafka" -Recurse -Force }
    Rename-Item $Extracted "kafka"
    Pop-Location
    
    Write-Host "✅ INSTALLED." -ForegroundColor Green
}

# --- STEP 3: CONFIGURATION ---
Write-Host "`n⚙️ [3/3] Patching Configuration..."

$ConfigDir = Join-Path $KafkaRoot "config"
$ServerProp = Join-Path $ConfigDir "server.properties"
$ZkProp = Join-Path $ConfigDir "zookeeper.properties"

# Define Data Dirs
$LogDir = Join-Path $KafkaRoot "kafka-logs"
$ZkDataDir = Join-Path $KafkaRoot "zookeeper-data"

# Escape for Java Properties (Backslash -> Forward Slash)
$LogDirFix = $LogDir -replace "\\", "/"
$ZkDataDirFix = $ZkDataDir -replace "\\", "/"

# 3a. Update server.properties
$SContent = Get-Content $ServerProp
$SContent = $SContent -replace "^log\.dirs=.*", "log.dirs=$LogDirFix"
if ($SContent -notmatch "^listeners=PLAINTEXT://") {
    $SContent += "`nlisteners=PLAINTEXT://localhost:9092"
}
$SContent | Set-Content $ServerProp

# 3b. Update zookeeper.properties
$ZContent = Get-Content $ZkProp
$ZContent = $ZContent -replace "^dataDir=.*", "dataDir=$ZkDataDirFix"
$ZContent | Set-Content $ZkProp

Write-Host "✅ CONFIG UPDATED."

# --- STEP 4: LAUNCHERS ---
# Create batch files in the backend root for easy access
$BatZk = Join-Path $BaseDir "start_zookeeper.bat"
$BatKafka = Join-Path $BaseDir "start_kafka.bat"

# Content for Batch Files
$BatContentZk = @"
@echo off
set JAVA_HOME=$($env:JAVA_HOME)
set PATH=%JAVA_HOME%\bin;%PATH%
title ZOOKEEPER
echo Starting Zookeeper...
cd infrastructure\kafka
bin\windows\zookeeper-server-start.bat config\zookeeper.properties
"@

$BatContentKafka = @"
@echo off
set JAVA_HOME=$($env:JAVA_HOME)
set PATH=%JAVA_HOME%\bin;%PATH%
title KAFKA
echo Starting Kafka...
cd infrastructure\kafka
bin\windows\kafka-server-start.bat config\server.properties
"@

Set-Content $BatZk $BatContentZk
Set-Content $BatKafka $BatContentKafka

Write-Host "`n---------------------------------------------------"
Write-Host "🚀 INSTALLATION COMPLETE" -ForegroundColor Cyan
Write-Host "---------------------------------------------------"
Write-Host "1. Run: .\start_zookeeper.bat"
Write-Host "2. Run: .\start_kafka.bat"
Write-Host "---------------------------------------------------"