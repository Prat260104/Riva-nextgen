@echo off
REM Git LFS Setup Script for Windows

echo ========================================
echo Git LFS Setup for RIVA Project
echo ========================================
echo.

REM Check if Git LFS is installed
git lfs version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git LFS is not installed!
    echo.
    echo Please install Git LFS first:
    echo 1. Download from: https://git-lfs.github.com/
    echo 2. Run the installer
    echo 3. Then run this script again
    echo.
    pause
    exit /b 1
)

echo [1/6] Initializing Git LFS...
git lfs install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to initialize Git LFS
    pause
    exit /b 1
)

echo [2/6] Tracking video files with Git LFS...
git lfs track "*.mp4"
git lfs track "Riva-2/Riva-main/frontend/public/*.mp4"

echo [3/6] Adding .gitattributes...
git add .gitattributes

echo [4/6] Updating .gitignore...
REM Remove mp4 ignore patterns from .gitignore
powershell -Command "(Get-Content .gitignore) | Where-Object { $_ -notmatch '^\*\.mp4$' -and $_ -notmatch '^!intro\.mp4$' -and $_ -notmatch '^!rotate\.mp4$' } | Set-Content .gitignore"

echo [5/6] Adding video files...
git add Riva-2/Riva-main/frontend/public/*.mp4

echo [6/6] Committing changes...
git commit -m "Add large video files with Git LFS"

echo.
echo ========================================
echo Git LFS setup complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run: git push origin main
echo 2. Videos will be uploaded to GitHub LFS
echo.
pause
