# 🎤 RIVA - AI Voice Assistant

**RIVA** is an intelligent voice-powered AI assistant built for the **NextGen Supercomputing Club** at KIET Group of Institutions. It combines cutting-edge AI technology with an immersive 3D audio visualization experience.

## ✨ Features

- 🎙️ **Continuous Voice Recognition** - Hands-free conversation mode with automatic feedback loop prevention
- 🤖 **Gemini 2.0 Flash AI** - Powered by Google's latest AI model for intelligent responses
- 🎨 **3D AudioSphere Visualization** - Real-time animated sphere that reacts to voice
- 🗣️ **Browser TTS (en-IN)** - Natural Indian English voice output
- 💬 **Dual Panel UI** - Split view showing AI and user messages separately
- 📚 **Club Knowledge Base** - Expert on NextGen Supercomputing Club information
- 🎯 **Smart Response Mode** - Detailed introductions, crisp answers for everything else

## 🚀 Tech Stack

### Backend
- **Node.js + Express** - REST API server
- **Google Gemini 2.0 Flash** - AI chat responses
- **OpenAI Whisper** (optional) - Speech-to-text
- **ElevenLabs** (optional) - Voice cloning TTS

### Frontend
- **React** - UI framework
- **Three.js** - 3D AudioSphere visualization
- **Web Speech API** - Browser-based STT/TTS
- **React Markdown** - Message formatting

## 📦 Installation

### Prerequisites
- Node.js 16+
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
```

Create `.env` file (copy from `.env.example`):
```env
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id
USE_ELEVENLABS=false
USE_WHISPER=false
```

Start backend:
```bash
node server.js
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## 🎯 Usage

1. **Start Backend** - Run `node server.js` in backend folder
2. **Start Frontend** - Run `npm start` in frontend folder
3. **Open Browser** - Navigate to `http://localhost:3000`
4. **Click Continuous Mode** - Enable hands-free conversation
5. **Start Speaking** - RIVA will listen, respond, and speak back

### Special Commands

- **"Are you ready to take over?"** - Triggers full inauguration speech
- **"Tell me about the club"** - Detailed club introduction
- **General questions** - Short, crisp 2-4 sentence answers

## 🎨 Features Breakdown

### Continuous Mode
- Automatic voice detection
- AI speech detection prevention (no feedback loop)
- 2-second cooldown after AI finishes speaking
- Smart input filtering

### AudioSphere
- Real-time audio level visualization
- Vertex displacement based on voice amplitude
- Smooth scale transitions
- Idle breathing animation
- Glow intensity changes

### Response Intelligence
- **Club Introduction**: Detailed, comprehensive answers
- **Other Questions**: Concise 2-4 sentence responses
- **Context Awareness**: Maintains conversation history
- **Fallback Handling**: Graceful error recovery

## 🏗️ Project Structure

```
Elara/
├── backend/
│   ├── server.js          # Main Express server
│   ├── .env.example       # Environment template
│   ├── .gitignore         # Git ignore rules
│   └── package.json       # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Styling
│   │   └── components/
│   │       └── AudioSphere.js  # 3D visualization
│   └── package.json       # Frontend dependencies
└── README.md              # This file
```

## 🔧 Configuration

### Backend Settings
- `PORT`: Server port (default: 5000)
- `USE_ELEVENLABS`: Enable ElevenLabs TTS (default: false)
- `USE_WHISPER`: Enable OpenAI Whisper STT (default: false)

### Frontend Settings
- Continuous mode delay: 2000ms
- Audio level smoothing: 0.15
- Sphere expansion: 30% max
- Voice language: en-IN (Indian English)

## 🎓 About NextGen Supercomputing Club

RIVA is the official AI assistant for the NextGen Supercomputing Club at KIET Group of Institutions. The club focuses on:

- High-Performance Computing (HPC)
- Artificial Intelligence & Machine Learning
- Quantum Computing & Simulation
- GPU Programming & Optimization

**Tagline**: "Building Production Brains"

## 👥 Team

### Core Members
- **President**: Shreya Jain
- **Vice President**: Samarth Shukla
- **PR Head**: Ujjawal Tyagi
- **Graphics Head**: Preeti Singh
- **Event Management**: Srashti Gupta & Vidisha Goel
- **Technical Leads**: Ronak Goel & Vinayak Rastogi
- **Treasurer**: Divyansh Verma

### Mentors
- Dr. Gaurav Srivastava
- Dr. Richa Singh
- Dr. Bikki Kumar

### Leadership
- **HOD**: Dr. Rekha Kashyap
- **Director**: Dr. Manoj Goel
- **Director Academics**: Dr. Adesh Kumar Pandey

## 🐛 Known Issues

- Browser TTS may require user interaction to unlock (first button click)
- Continuous mode may pick up background noise
- AudioSphere performance depends on GPU capabilities

## 🔮 Future Enhancements

- [ ] Multi-language support
- [ ] Voice cloning integration
- [ ] Mobile responsive design
- [ ] Conversation export
- [ ] Custom wake word detection

## 📄 License

This project is developed for the NextGen Supercomputing Club at KIET Group of Institutions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

**Built with ❤️ by the NextGen Supercomputing Club**

*Where Intelligence Meets Innovation*
