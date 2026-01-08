@echo off
echo ========================================
echo  Hospital Management System
echo  Stopping Server...
echo ========================================
echo.

cd /d "%~dp0"

REM Try to stop Docker containers
docker-compose -f docker-compose.hospital.yml down >nul 2>&1

REM Also stop any npm processes
taskkill /FI "WINDOWTITLE eq Hospital System*" /T /F >nul 2>&1

echo ✅ Server stopped!
echo.
pause


