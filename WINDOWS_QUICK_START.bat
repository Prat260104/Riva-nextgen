@echo off
REM RIVA Quick Start Script for Windows
REM Run this after cloning the repository

echo ========================================
echo RIVA - Complete Setup for Windows
echo ========================================
echo.

REM Check Node.js
echo [1/8] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js: OK

REM Check Git LFS
echo [2/8] Checking Git LFS...
git lfs version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Git LFS not installed. Videos may not download.
    echo Install from: https://git-lfs.github.com/
    pause
)
echo Git LFS: OK

REM Backend Setup
echo.
echo [3/8] Setting up Backend (Riva-2)...
cd Riva-2\Riva-main\backend
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo [ACTION REQUIRED] Edit backend\.env and add your API keys!
)
echo Installing backend dependencies...
call npm install
cd ..\..\..

REM Frontend Setup
echo.
echo [4/8] Setting up Frontend (Riva-2)...
cd Riva-2\Riva-main\frontend
echo Installing frontend dependencies...
call npm install
cd ..\..\..

REM Backend Setup (Original)
echo.
echo [5/8] Setting up Backend (Original)...
cd backend
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
)
echo Installing backend dependencies...
call npm install
cd ..

REM Frontend Setup (Original)
echo.
echo [6/8] Setting up Frontend (Original)...
cd frontend
echo Installing frontend dependencies...
call npm install
cd ..

REM Check Videos
echo.
echo [7/8] Checking video files...
if exist "Riva-2\Riva-main\frontend\public\sphere-animation.mp4" (
    echo Videos: OK
) else (
    echo [WARNING] Videos not found. Running git lfs pull...
    git lfs pull
)

echo.
echo [8/8] Setup Complete!
echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo.
echo 1. Edit API Keys:
echo    - Riva-2\Riva-main\backend\.env
echo    - backend\.env
echo.
echo 2. Use START_RIVA.bat to launch both:
echo    START_RIVA.bat
echo.
echo    OR manually:
echo    Terminal 1: cd Riva-2\Riva-main\backend && node server.js
echo    Terminal 2: cd Riva-2\Riva-main\frontend && npm start
echo.
echo 4. Open Browser:
echo    http://localhost:3000
echo.
echo ========================================
pause
