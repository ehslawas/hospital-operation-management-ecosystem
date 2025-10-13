@echo off
echo ========================================
echo  Setup Firewall for Hospital System
echo ========================================
echo.
echo This will allow port 3001 through Windows Firewall
echo so other computers can access the hospital system.
echo.
echo Right-click this file and select "Run as administrator"
echo.
pause

REM Check for admin privileges
net session >nul 2>&1
if %errorlevel% == 0 (
    echo Running with administrator privileges...
    echo.
    
    REM Add firewall rule for port 3001
    netsh advfirewall firewall add rule name="Hospital System - Port 3001" dir=in action=allow protocol=TCP localport=3001
    
    echo.
    echo ✅ Firewall rule created successfully!
    echo.
    echo Port 3001 is now accessible from other computers.
    echo.
) else (
    echo ❌ ERROR: This script must be run as administrator!
    echo.
    echo Please:
    echo 1. Right-click this file (SETUP_FIREWALL.bat)
    echo 2. Select "Run as administrator"
    echo 3. Click "Yes" when prompted
    echo.
)

pause

