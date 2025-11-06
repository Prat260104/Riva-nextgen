**RIVA** is an intelligent voice-powered AI assistant built for the **NextGen Supercomputing Club** at KIET Group of Institutions. It combines cutting-edge AI technology with an immersive 3D audio visualization experience.

## Features

-   **Continuous Voice Recognition**: Hands-free conversation mode with automatic feedback loop prevention.
-   **Gemini 2.0 Flash AI**: Powered by Google's latest AI model for intelligent responses.
-   **3D AudioSphere Visualization**: Real-time animated sphere that reacts to voice.
-   **Browser TTS (en-IN)**: Natural Indian English voice output.
-   **Dual Panel UI**: Split view showing AI and user messages separately.
-   **Club Knowledge Base**: Serves as an expert on NextGen Supercomputing Club information.
-   **Smart Response Mode**: Provides detailed introductions and crisp answers for general queries.

## Tech Stack

### Backend
-   **Node.js + Express**: REST API server
-   **Google Gemini 2.0 Flash**: AI chat responses
-   **OpenAI Whisper** (optional): Speech-to-text
-   **ElevenLabs** (optional): Voice cloning TTS

### Frontend
-   **React**: UI framework
-   **Three.js**: 3D AudioSphere visualization
-   **Web Speech API**: Browser-based STT/TTS
-   **React Markdown**: Message formatting

## Installation

### Prerequisites
-   Node.js 16+
-   npm or yarn

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (you can copy from `.env.example`):
```env
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id
USE_ELEVENLABS=false
USE_WHISPER=false
```

Start the backend server:
```bash
node server.js
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## Usage

1.  **Start Backend**: Run `node server.js` in the `backend` directory.
2.  **Start Frontend**: Run `npm start` in the `frontend` directory.
3.  **Open Browser**: Navigate to `http://localhost:3000`.
4.  **Click Continuous Mode**: Enable hands-free conversation.
5.  **Start Speaking**: RIVA will listen, respond, and speak back.

### Special Commands

-   **"Are you ready to take over?"**: Triggers the full inauguration speech.
-   **"Tell me about the club"**: Provides a detailed club introduction.
-   **General questions**: Elicits short, crisp 2-4 sentence answers.

## Features Breakdown

### Continuous Mode
-   Automatic voice detection.
-   AI speech detection prevention to avoid feedback loops.
-   A two-second cooldown after the AI finishes speaking.
-   Smart input filtering to ignore minor noises.

### AudioSphere
-   Real-time audio level visualization.
-   Vertex displacement based on voice amplitude.
-   Smooth scaling transitions during speech.
-   An idle "breathing" animation.
-   Glow intensity changes that correspond to audio levels.

### Response Intelligence
-   **Club Introduction**: Delivers detailed, comprehensive answers about the club.
-   **Other Questions**: Responds with concise 2-4 sentence answers.
-   **Context Awareness**: Maintains conversation history for follow-up questions.
-   **Fallback Handling**: Manages errors gracefully.

## Project Structure

```
RIVA/
├── backend/
│   ├── server.js           # Main Express server
│   ├── .env.example        # Environment template
│   ├── .gitignore          # Git ignore rules
│   └── package.json        # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── App.css           # Styling
│   │   └── components/
│   │       └── AudioSphere.js  # 3D visualization
│   └── package.json        # Frontend dependencies
└── README.md               # This file
```

## Configuration

### Backend Settings
-   `PORT`: Server port (default: 5000).
-   `USE_ELEVENLABS`: Enable ElevenLabs TTS (default: false).
-   `USE_WHISPER`: Enable OpenAI Whisper STT (default: false).

### Frontend Settings
-   **Continuous mode delay**: 2000ms
-   **Audio level smoothing**: 0.15
-   **Sphere expansion**: 30% maximum
-   **Voice language**: en-IN (Indian English)

## About NextGen Supercomputing Club

RIVA is the official AI assistant for the NextGen Supercomputing Club at KIET Group of Institutions. The club focuses on:

-   High-Performance Computing (HPC)
-   Artificial Intelligence & Machine Learning
-   Quantum Computing & Simulation
-   GPU Programming & Optimization

**Tagline**: "Building Production Brains"

## Team

### Core Members
-   **President**: Shreya Jain
-   **Vice President**: Samarth Shukla
-   **PR Head**: Ujjawal Tyagi
-   **Graphics Head**: Preeti Singh
-   **Event Management**: Srashti Gupta & Vidisha Goel
-   **Technical Leads**: Ronak Goel & Vinayak Rastogi
-   **Treasurer**: Divyansh Verma

### Mentors
-   Dr. Gaurav Srivastava
-   Dr. Richa Singh
-   Dr. Bikki Kumar

### Leadership
-   **HOD**: Dr. Rekha Kashyap
-   **Director**: Dr. Manoj Goel
-   **Director Academics**: Dr. Adesh Kumar Pandey

## Known Issues

-   Browser TTS may require initial user interaction (a button click) to function.
-   Continuous mode may occasionally be activated by loud background noise.
-   AudioSphere performance is dependent on the user's GPU capabilities.

## Future Enhancements

-   [ ] Multi-language support
-   [ ] Voice cloning integration
-   [ ] Mobile responsive design
-   [ ] Conversation export feature
-   [ ] Custom wake word detection

## License

This project is developed for the NextGen Supercomputing Club at KIET Group of Institutions.

## Contributing

Contributions are welcome. Please feel free to submit issues or pull requests to improve the project.

***

**Built by the NextGen Supercomputing Club**

*Where Intelligence Meets Innovation*
