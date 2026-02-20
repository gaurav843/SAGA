# FILEPATH: stop_dev.ps1
# @file: Flodock System Terminator (Hydra Slayer)
# @role: 🧹 Cleanup Utility
# @description: Uses Recursive Kill (/T) on Ports to stop Uvicorn Auto-Reloaders.

$ErrorActionPreference = "SilentlyContinue"

Write-Host "========================================================" -ForegroundColor Magenta
Write-Host "  FLODOCK CLEANUP PROTOCOL (v3.1)" -ForegroundColor Magenta
Write-Host "========================================================" -ForegroundColor Magenta
Write-Host ""

# 1. Kill by Window Title (Attempt to close tabs)
Write-Host "[1/5] Closing Tabs..." -ForegroundColor Cyan
$TabTitles = @("Backend", "Frontend", "Zookeeper", "Kafka", "Relay", "Viewer")
foreach ($title in $TabTitles) {
    $procs = taskkill /FI "WINDOWTITLE eq $title*" /IM cmd.exe /T /F 2>&1
    if ($procs -match "SUCCESS") { Write-Host "      -> Tab '$title' closed." -ForegroundColor Gray }
}

# 2. Kill by Tag (Shells)
Write-Host "[2/5] Hunting Shells (FO=1)..." -ForegroundColor Cyan
$targets = Get-CimInstance Win32_Process -Filter "Name = 'cmd.exe'" | Where-Object { $_.CommandLine -like "*set FO=1*" }
if ($targets) {
    foreach ($proc in $targets) {
        # TREE KILL is essential here
        $out = taskkill /PID $proc.ProcessId /T /F 2>&1
        Write-Host "      -> Killed Shell Tree PID $($proc.ProcessId)" -ForegroundColor Yellow
    }
}

# 3. Kill by Port (Engines) - NOW WITH TREE KILL
$Ports = @(8000, 5173, 2181, 9092)
Write-Host "[3/5] Sweeping Ports..." -ForegroundColor Cyan
foreach ($port in $Ports) {
    try {
        $cons = Get-NetTCPConnection -LocalPort $port -ErrorAction Stop
        foreach ($con in $cons) {
            $pid_to_kill = $con.OwningProcess
            if ($pid_to_kill -gt 0) {
                $pname = (Get-Process -Id $pid_to_kill).ProcessName
                Write-Host "      -> SNIPING Port $port ($pname PID: $pid_to_kill)..." -ForegroundColor Red
                
                # CRITICAL: /T kills the Uvicorn Supervisor if we hit the Worker
                taskkill /PID $pid_to_kill /T /F | Out-Null
            }
        }
    } catch {}
}

# 4. SCRIPT HUNTER (Expanded)
Write-Host "[4/5] Hunting Zombie Scripts..." -ForegroundColor Cyan

# Get all python processes
$PythonProcs = Get-CimInstance Win32_Process -Filter "Name = 'python.exe'"
foreach ($proc in $PythonProcs) {
    $cmd = $proc.CommandLine
    $pid_target = $proc.ProcessId
    
    if ($cmd -like "*relay.py*") {
        Write-Host "      -> SNIPED: Data Relay (PID $pid_target)" -ForegroundColor Red
        taskkill /PID $pid_target /T /F | Out-Null
    }
    elseif ($cmd -like "*consume.py*") {
        Write-Host "      -> SNIPED: Event Viewer (PID $pid_target)" -ForegroundColor Red
        taskkill /PID $pid_target /T /F | Out-Null
    }
    elseif ($cmd -like "*cartographer.py*") {
        Write-Host "      -> SNIPED: Cartographer (PID $pid_target)" -ForegroundColor Red
        taskkill /PID $pid_target /T /F | Out-Null
    }
    elseif ($cmd -like "*uvicorn*" -or $cmd -like "*app.main*") {
        Write-Host "      -> SNIPED: Uvicorn/Backend (PID $pid_target)" -ForegroundColor Red
        taskkill /PID $pid_target /T /F | Out-Null
    }
}

# 5. Final Java Sweep
Write-Host "[5/5] Final Java Sweep..." -ForegroundColor Cyan
$JavaProcs = Get-CimInstance Win32_Process -Filter "Name = 'java.exe'" | Where-Object { $_.CommandLine -like "*infrastructure\kafka*" }
if ($JavaProcs) {
    foreach ($proc in $JavaProcs) {
        Write-Host "      -> Killed Java PID $($proc.ProcessId)" -ForegroundColor Red
        taskkill /PID $proc.ProcessId /T /F | Out-Null
    }
}

Write-Host ""
Write-Host "[SUCCESS] Cleanup Complete." -ForegroundColor Green
Start-Sleep -Seconds 2
exit