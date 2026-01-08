@echo off
echo ========================================
echo  Hospital Management System
echo  Opening in Browser...
echo ========================================
echo.

REM Get the computer's IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    goto :found
)
:found

REM Remove leading spaces
set IP=%IP:~1%

echo Your computer's IP address: %IP%
echo.
echo ========================================
echo  Access URLs:
echo ========================================
echo.
echo 📱 From THIS computer:
echo    http://localhost:3001
echo.
echo 🌐 From OTHER computers (same network):
echo    http://%IP%:3001
echo.
echo ========================================
echo.

REM Open in browser
echo Opening http://localhost:3001 in your browser...
start http://localhost:3001

echo.
echo ✅ Browser opened!
echo.
echo 💡 TIP: Share this URL with other staff:
echo    http://%IP%:3001
echo.
echo If other computers cannot connect, run SETUP_FIREWALL.bat
echo as administrator to allow network access.
echo.
pause

