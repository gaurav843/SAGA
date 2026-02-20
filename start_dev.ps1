# FILEPATH: start_dev.ps1
# @file: Flodock Master Launcher (Level 12 - Verbose)
# @role: 🚀 System Orchestrator
# @description: Boots the Stack. Communicates clearly in the main window.

$RootPath = $PSScriptRoot

# --- CONFIGURATION ---
$PortsToCheck = @(8000, 5173, 9092, 2181)

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  FLODOCK ENTERPRISE PLATFORM (v2.7)" -ForegroundColor Cyan
Write-Host "  `"Level 12: Visibility`"" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. PRE-FLIGHT CHECKS ---

Write-Host "[STEP 1] Checking System Health..." -ForegroundColor Gray
$PortsBlocked = $false
foreach ($port in $PortsToCheck) {
    $con = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($con) {
        Write-Host "  [WARN] Port $port is actively used." -ForegroundColor Yellow
        $PortsBlocked = $true
    }
}

if ($PortsBlocked) {
    Write-Host ""
    Write-Host "[STEP 2] CLEANUP REQUIRED. Executing Stop Script..." -ForegroundColor Yellow
    
    # Run Stop Script and WAIT for it to finish
    Start-Process -FilePath "powershell" -ArgumentList "-File `"$RootPath\stop_dev.ps1`"" -Wait -NoNewWindow
    
    Write-Host "[STEP 2] Cleanup Finished. Cooling down (2s)..." -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "[STEP 2] System is Clean. Skipping Cleanup." -ForegroundColor Green
}

# --- 2. ENVIRONMENT CHECKS ---

if (-not (Test-Path "$RootPath\backend\venv")) {
    Write-Host "[ERROR] venv missing. Run 'python -m venv backend\venv'" -ForegroundColor Red
    exit
}

$KafkaBin = "$RootPath\backend\infrastructure\kafka\bin\windows\kafka-server-start.bat"
if (-not (Test-Path $KafkaBin)) {
    Write-Host "[SETUP] Installing Kafka..." -ForegroundColor Yellow
    $InstallCmd = "$RootPath\backend\venv\Scripts\python.exe"
    $InstallScript = "$RootPath\backend\scripts\kafka\install.py"
    Start-Process -FilePath $InstallCmd -ArgumentList $InstallScript -Wait -NoNewWindow
}

# --- 3. LAUNCH ---

Write-Host ""
Write-Host "[STEP 3] Configuring Launch Parameters..." -ForegroundColor Gray

# Define Commands (Using 'title' for identification)
$CmdBackend   = "title Backend && set FO=1 && cd backend && venv\Scripts\activate && python cartographer.py && start_dev.bat"
$CmdFrontend  = "title Frontend && set FO=1 && cd frontend && npm run dev"
$CmdZookeeper = "title Zookeeper && set FO=1 && cd backend && venv\Scripts\activate && python scripts\kafka\run_cluster.py --service zookeeper"
$CmdKafka     = "title Kafka && set FO=1 && cd backend && venv\Scripts\activate && python scripts\kafka\run_cluster.py --service kafka"
$CmdRelay     = "title Relay && set FO=1 && cd backend && venv\Scripts\activate && python app\core\kernel\relay.py"
$CmdViewer    = "title Viewer && set FO=1 && cd backend && venv\Scripts\activate && python scripts\kafka\consume.py"
$CmdAutoClip  = "title AutoClip && backend\venv\Scripts\activate && python auto_clip_fixed.py"

# Construct the massive WT command string
$wtArgs = "-w 0 " +
    "new-tab --title Backend --tabColor #008000 -d $RootPath cmd /k `"$CmdBackend`" ; " +
    "new-tab --title Frontend --tabColor #61DAFB -d $RootPath cmd /k `"$CmdFrontend`" ; " +
    "new-tab --title Zookeeper --tabColor #B8860B -d $RootPath cmd /k `"$CmdZookeeper`" ; " +
    "new-tab --title Kafka --tabColor #FF8C00 -d $RootPath cmd /k `"$CmdKafka`" ; " +
    "new-tab --title Relay --tabColor #800080 -d $RootPath cmd /k `"$CmdRelay`" ; " +
    "new-tab --title Viewer --tabColor #808080 -d $RootPath cmd /k `"$CmdViewer`" ; " +
    "new-tab --title AutoClip --tabColor #FF1493 -d $RootPath cmd /k `"$CmdAutoClip`""

Write-Host "[STEP 4] LAUNCHING TERMINAL." -ForegroundColor Green
Write-Host "         (This should open 1 Window with 7 Tabs)" -ForegroundColor Gray
Write-Host ""

Start-Process wt -ArgumentList $wtArgs

Write-Host "[SUCCESS] Deployment Handoff Complete." -ForegroundColor Green
Write-Host "          Monitor the new window for service status."
Start-Sleep -Seconds 5
exit