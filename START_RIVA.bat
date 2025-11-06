@echo off
REM Start RIVA Application (Both Backend and Frontend)

echo ========================================
echo Starting RIVA Application
echo ========================================
echo.

REM Start Backend in new window
echo Starting Backend Server (Port 5001)...
start "RIVA Backend" cmd /k "cd Riva-2\Riva-main\backend && node server.js"

REM Wait 3 seconds for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend in new window
echo Starting Frontend (Port 3000)...
start "RIVA Frontend" cmd /k "cd Riva-2\Riva-main\frontend && npm start"

echo.
echo ========================================
echo RIVA is starting...
echo ========================================
echo.
echo Backend: http://localhost:5001
echo Frontend: http://localhost:3000
echo.
echo Two new windows will open:
echo 1. Backend Server (Keep it running)
echo 2. Frontend App (Keep it running)
echo.
echo Browser will open automatically in 10 seconds...
echo.
echo Press any key to close this window...
pause >nul
