# UPDATES:
# 1. Changed "cmd /k" to "powershell -NoExit -Command"
# 2. Updated Python venv activation to use the PowerShell script (Activate.ps1)
# 3. Removed legacy 'color' commands (PowerShell uses your Terminal profile colors)

$wtArgs = "-w 0 " +
    "new-tab --title main --tabColor #FF0000 -d C:\Pythonproject\Flodock powershell -NoExit -Command `"code .`" ; " +
    "new-tab --title db --tabColor #000000 -d C:\Pythonproject\Flodock\backend powershell -NoExit -Command `"& '.\start_db.bat'`" ; " +
    "new-tab --title frontend --tabColor #FFD700 -d C:\Pythonproject\Flodock\frontend powershell -NoExit ; " +
    "new-tab --title backend --tabColor #008000 -d C:\Pythonproject\Flodock\backend powershell -NoExit -Command `". .\venv\Scripts\Activate.ps1`""

# Launch Windows Terminal
Start-Process wt -ArgumentList $wtArgs

exit