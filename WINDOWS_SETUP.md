# 🪟 Windows Setup Guide for RIVA

## 📥 Clone Repository on Windows

### Step 1: Install Git LFS
1. Download Git LFS: https://git-lfs.github.com/
2. Run the installer (git-lfs-windows-v3.x.x.exe)
3. Verify installation:
   ```cmd
   git lfs version
   ```

### Step 2: Clone Repository
```cmd
git clone https://github.com/VinVorteX/Riva.git
cd Riva
```

### Step 3: Initialize Git LFS
```cmd
git lfs install
```

**That's it!** Videos will automatically download. ✅

---

## 🚀 Running RIVA on Windows

### Prerequisites
- Node.js 16+ (https://nodejs.org/)
- Python 3.8+ (https://www.python.org/)
- Git with Git LFS

### Backend Setup
```cmd
cd Riva-2\Riva-main\backend
npm install
copy .env.example .env
REM Edit .env and add your API keys
node server.js
```

### Frontend Setup (New Terminal)
```cmd
cd Riva-2\Riva-main\frontend
npm install
npm start
```

### Access Application
Open browser: http://localhost:3000

---

## 📊 Git LFS Info

### Check LFS Files
```cmd
git lfs ls-files
```

### Pull LFS Files Manually (if needed)
```cmd
git lfs pull
```

### LFS Status
```cmd
git lfs status
```

---

## ⚠️ Troubleshooting

### Videos Not Downloading?
```cmd
git lfs fetch --all
git lfs checkout
```

### Check LFS Configuration
```cmd
git lfs env
```

### Re-download All LFS Files
```cmd
git lfs pull --include="*.mp4"
```

---

## 📁 Video Files Location
After clone, videos will be at:
```
Riva\Riva-2\Riva-main\frontend\public\
├── sphere-animation.mp4 (158 MB)
├── trial.mp4 (86 MB)
├── background_3.mp4 (69 MB)
├── trial_4.mp4 (59 MB)
└── ... other videos
```

---

## 🎯 Quick Start Commands

```cmd
REM Clone with LFS
git clone https://github.com/VinVorteX/Riva.git
cd Riva

REM Install dependencies
cd Riva-2\Riva-main\backend
npm install
cd ..\frontend
npm install

REM Start backend (Terminal 1)
cd Riva-2\Riva-main\backend
node server.js

REM Start frontend (Terminal 2)
cd Riva-2\Riva-main\frontend
npm start
```

---

**Built with ❤️ by NextGen Supercomputing Club**
