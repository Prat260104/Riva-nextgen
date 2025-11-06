================================================================================
                    RIVA - Windows Setup Instructions
================================================================================

📋 PREREQUISITES (Install these first):
----------------------------------------
1. Node.js 16+ → https://nodejs.org/
2. Git with Git LFS → https://git-lfs.github.com/
3. Google Chrome/Edge browser


🚀 QUICK START (After Cloning):
----------------------------------------

STEP 1: Clone Repository
-------------------------
git clone https://github.com/VinVorteX/Riva.git
cd Riva


STEP 2: Run Setup (One-time)
-----------------------------
Double-click: WINDOWS_QUICK_START.bat

This will:
✓ Install all dependencies
✓ Create .env files
✓ Download video files (if Git LFS installed)


STEP 3: Add API Keys
---------------------
Edit these files and add your API keys:

📁 Riva-2\Riva-main\backend\.env
   GEMINI_API_KEY=your_key_here

📁 backend\.env
   GEMINI_API_KEY=your_key_here


STEP 4: Start Application
--------------------------
Double-click: START_RIVA.bat

This will open 2 windows:
✓ Backend Server (Port 5001)
✓ Frontend App (Port 3000)

Browser will open automatically at: http://localhost:3000


================================================================================
                            MANUAL COMMANDS
================================================================================

If you prefer manual setup:

# Terminal 1 - Backend
cd Riva-2\Riva-main\backend
npm install
node server.js

# Terminal 2 - Frontend (New Terminal)
cd Riva-2\Riva-main\frontend
npm install
npm start


================================================================================
                            TROUBLESHOOTING
================================================================================

❌ Videos not showing?
   → Run: git lfs pull
   → Check: Riva-2\Riva-main\frontend\public\sphere-animation.mp4

❌ Backend not starting?
   → Check if .env file has GEMINI_API_KEY
   → Check if port 5001 is free

❌ Frontend not starting?
   → Delete node_modules folder
   → Run: npm install
   → Run: npm start

❌ "Module not found" error?
   → Run: npm install in both backend and frontend folders


================================================================================
                            FILE STRUCTURE
================================================================================

Riva/
├── WINDOWS_QUICK_START.bat    ← Run this first (setup)
├── START_RIVA.bat              ← Run this to start app
├── Riva-2/
│   └── Riva-main/
│       ├── backend/            ← Backend server (Port 5001)
│       │   ├── server.js
│       │   └── .env            ← Add API keys here
│       └── frontend/           ← React app (Port 3000)
│           └── public/
│               └── *.mp4       ← Video files (Git LFS)


================================================================================
                            SUPPORT
================================================================================

For issues, contact:
NextGen Supercomputing Club
KIET Group of Institutions

Built with ❤️ by NextGen Supercomputing Club
================================================================================
