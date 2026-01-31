@echo off
echo ========================================
echo  Hospital Management System
echo  Starting Server...
echo ========================================
echo.

cd /d "%~dp0"

REM Add Portable NodeJS to PATH
set "PATH=%PATH%;C:\Users\hospital3\NodeJS"

REM Get the computer's IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" ^| findstr /v "172."') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%

REM Check if Docker is available
docker --version >nul 2>&1
if %errorlevel% == 0 (
    echo Using Docker (Production Mode)
    docker-compose -f docker-compose.hospital.yml up -d
    echo.
    echo ✅ Server started with Docker!
    echo.
    echo ========================================
    echo  Access URLs:
    echo ========================================
    echo.
    echo 📱 From THIS computer:
    echo    http://localhost:3001
    echo.
    echo 🌐 From OTHER computers:
    echo    http://%IP%:3001
    echo.
    echo ========================================
    echo.
    echo To stop: docker-compose -f docker-compose.hospital.yml down
    echo.
    echo 💡 If other computers can't connect, run SETUP_FIREWALL.bat as admin
) else (
    echo Using NPM (Development Mode)
    start "Hospital System" cmd /k "npm run dev"
    echo.
    echo ✅ Server starting...
    echo.
    echo ========================================
    echo  Access URLs:
    echo ========================================
    echo.
    echo 📱 From THIS computer:
    echo    http://localhost:3001
    echo.
    echo 🌐 From OTHER computers:
    echo    http://%IP%:3001
    echo.
    echo ========================================
    echo.
    echo Keep this window open!
)

echo.
pause


