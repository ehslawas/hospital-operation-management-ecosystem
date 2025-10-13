@echo off
echo ========================================
echo  Setup Auto-Start on Boot
echo ========================================
echo.

set SCRIPT_PATH=%~dp0START_HOSPITAL.bat
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

echo Creating shortcut in Startup folder...
echo.

REM Create VBS script to make shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = "%STARTUP_FOLDER%\Hospital System.lnk" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%SCRIPT_PATH%" >> CreateShortcut.vbs
echo oLink.WorkingDirectory = "%~dp0" >> CreateShortcut.vbs
echo oLink.Description = "Hospital Management System Auto-Start" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs

REM Run the VBS script
cscript CreateShortcut.vbs >nul

REM Clean up
del CreateShortcut.vbs

echo ✅ Auto-start configured!
echo.
echo The hospital system will now start automatically when you login.
echo.
echo Location: %STARTUP_FOLDER%\Hospital System.lnk
echo.
pause


