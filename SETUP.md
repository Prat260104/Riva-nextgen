# 🚀 RIVA Setup Guide

Quick setup guide to get RIVA running on your machine.

## 📋 Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- Webcam (for face recognition)
- Microphone (for voice assistant)

## ⚡ Quick Setup (5 minutes)

### 1️⃣ Clone Repository
```bash
git clone https://github.com/VinVorteX/Riva.git
cd Riva
```

### 2️⃣ Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
USE_ELEVENLABS=false
USE_WHISPER=false
```

**Get Gemini API Key:** https://makersuite.google.com/app/apikey

### 3️⃣ Frontend Setup
```bash
cd ../frontend
npm install
```

### 4️⃣ Face Recognition Setup (Optional)
```bash
cd ../Face-Recognition-using-Facenet
python3 -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate
pip install -r requirements_lite.txt
```

**Enroll faces:**
```bash
# Create folder with your name
mkdir -p enroll_images/YourName

# Add 5-10 photos of your face in that folder
# Then run:
python enrollment_lite.py
```

## 🎯 Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Open browser: http://localhost:3000

## 🎮 Usage

### Chat Mode
1. Click "Continuous Mode" button
2. Start speaking
3. RIVA will respond with voice

### Avatar Mode
1. Click "Avatar Ring Demo" button
2. Click "Start Recognition" to enable face recognition
3. Your face will be mapped to an avatar (Alex/Sia/Noah)
4. Click "Start Voice" to talk with avatar-specific personality

## 🎭 Avatar Mapping

Edit `frontend/src/components/AvatarDemo.jsx`:
```javascript
const avatarMap = {
  'YourName': 'Alex',  // Change this
  'Vinayak': 'Noah',
  'Shreya': 'Sia'
};
```

## 🔧 Troubleshooting

**Backend won't start:**
- Check if port 5000 is free: `lsof -i :5000`
- Verify Gemini API key in `.env`

**Frontend won't start:**
- Check if port 3000 is free: `lsof -i :3000`
- Delete `node_modules` and run `npm install` again

**Face recognition not working:**
- Ensure webcam permissions are granted
- Check if Python environment is activated
- Verify `face_db_lite.pkl` exists after enrollment

**Voice not working:**
- Allow microphone permissions in browser
- Click any button first to initialize TTS
- Check browser console for errors

## 📁 Project Structure

```
Riva/
├── backend/              # Express server + Gemini AI
│   ├── server.js        # Main server
│   ├── face_recognition_lite.py
│   └── .env            # API keys (create this)
├── frontend/            # React app
│   └── src/
│       ├── App.js      # Main chat interface
│       └── components/
│           ├── AvatarRing.jsx      # 3D avatar ring
│           ├── FaceRecognition.jsx # Face recognition
│           └── VoiceAssistant.jsx  # Voice interface
└── Face-Recognition-using-Facenet/
    ├── enrollment_lite.py  # Enroll faces
    └── enroll_images/      # Face photos
```

## 🎓 Features

- ✅ Voice-powered AI chat with Gemini 2.0 Flash
- ✅ 3D rotating avatar ring with Three.js
- ✅ Face recognition with session lock
- ✅ Avatar-specific AI personalities
- ✅ Binary matrix background effect
- ✅ Continuous listening mode
- ✅ Browser-based TTS (en-IN voice)

## 🔑 API Keys

**Required:**
- Gemini API Key (free): https://makersuite.google.com/app/apikey

**Optional:**
- OpenAI API Key (for Whisper STT)
- ElevenLabs API Key (for voice cloning)

## 💡 Tips

- Use **Lite Mode** for low-spec machines (i3, 4GB RAM)
- Session lock auto-unlocks after 45 seconds
- Add 5-10 clear face photos for better recognition
- Speak clearly for better voice recognition

## 🐛 Known Issues

- First TTS requires user interaction (browser security)
- Face recognition needs good lighting
- Continuous mode may pick up background noise

## 📞 Support

For issues, check:
- `LITE_MODE_SETUP.md` - Low-spec machine setup
- `FACE_RECOGNITION_INTEGRATION.md` - Face recognition details

---

**Built for NextGen Supercomputing Club, KIET**
