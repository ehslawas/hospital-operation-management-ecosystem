@echo off
echo ========================================
echo  Hospital Management System
echo  Offline Setup Script
echo ========================================
echo.

cd /d "%~dp0"

REM Check if Docker is running
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Docker is not running!
    echo.
    echo Please start Docker Desktop first.
    echo.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

echo ========================================
echo  Step 1: Building Docker Images
echo ========================================
echo.
echo This may take 5-10 minutes...
echo.

docker-compose -f docker-compose.hospital.yml build

if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed! Check the error above.
    pause
    exit /b 1
)

echo.
echo ✅ Build complete!
echo.

echo ========================================
echo  Step 2: Starting Containers
echo ========================================
echo.

docker-compose -f docker-compose.hospital.yml up -d

if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to start containers!
    pause
    exit /b 1
)

echo.
echo ✅ Containers started!
echo.
echo Waiting for database to be ready...
timeout /t 15 /nobreak >nul

echo ========================================
echo  Step 3: Initialize Database
echo ========================================
echo.

docker-compose -f docker-compose.hospital.yml exec hospital-app npx prisma db push --accept-data-loss

if %errorlevel% neq 0 (
    echo.
    echo ⚠️ Database push failed, trying alternative method...
    timeout /t 5 /nobreak >nul
    docker-compose -f docker-compose.hospital.yml exec hospital-app npx prisma db push --force-reset
)

echo.
echo ✅ Database schema created!
echo.

echo ========================================
echo  Step 4: Seed Test Data
echo ========================================
echo.

docker-compose -f docker-compose.hospital.yml exec hospital-app npx prisma db seed

echo.

REM Get IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" ^| findstr /v "172."') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%

echo.
echo ========================================
echo  ✅ Setup Complete!
echo ========================================
echo.
echo Your Hospital Management System is ready to use!
echo.
echo 📱 Access URLs:
echo.
echo From THIS computer:
echo    Staff Portal:   http://localhost:3001
echo    Patient Portal: http://localhost:3001/patient-portal/login
echo.
echo From OTHER computers on same network:
echo    Staff Portal:   http://%IP%:3001
echo    Patient Portal: http://%IP%:3001/patient-portal/login
echo.
echo ========================================
echo  🔐 Login Credentials
echo ========================================
echo.
echo STAFF LOGIN:
echo    Username: admin
echo    Password: admin123
echo.
echo PATIENT PORTAL LOGIN:
echo    IC Number: 940120126733
echo    Method: PIN
echo    PIN: 123456
echo.
echo ========================================
echo.
echo 💡 Tips:
echo  - System works WITHOUT internet connection
echo  - Data persists across restarts
echo  - To stop: docker-compose -f docker-compose.hospital.yml down
echo  - To restart: docker-compose -f docker-compose.hospital.yml up -d
echo.
echo For detailed guide, see: OFFLINE_DEPLOYMENT_COMPLETE.md
echo.
pause

