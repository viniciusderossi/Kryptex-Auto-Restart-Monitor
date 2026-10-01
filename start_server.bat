@echo off
:: Requests Administrator permissions automatically (required to forcefully kill stubborn Kryptex services)
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :run
) else (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /B
)

:run
cd /d "%~dp0"

:: Check if Python is installed
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo =======================================================
    echo [WARNING] Python was not found on this computer!
    echo The Kryptex Server requires it to work.
    echo Do not worry, we will install it ONLY THIS ONCE.
    echo Everything will be done completely automatically!
    echo =======================================================
    echo.
    echo Downloading the official Python installer... please wait.
    curl -o python_installer.exe https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe
    
    echo.
    echo Installing Python on your system (this may take 1 or 2 minutes)...
    :: Installs silently, making sure to check the crucial "Add to PATH" option
    python_installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
    
    echo Installation complete! Cleaning up files...
    del python_installer.exe
    
    echo.
    echo Windows needs to update environment paths. The script will restart in 5 seconds...
    timeout /t 5 >nul
    start "" "%~dpnx0"
    exit /B
)

echo Starting Kryptex Local Server with Maximum Privileges...
python local_server.py
pause
