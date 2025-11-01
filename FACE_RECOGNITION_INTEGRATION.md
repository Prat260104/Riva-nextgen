# 🎭 Face Recognition Integration Guide

## ✅ What's Been Integrated

Face recognition has been seamlessly integrated into your RIVA system without disrupting any existing features.

## 🏗️ Architecture

### Backend Components
1. **face_recognition_service.py** - Core face recognition service
   - Uses FaceNet + MTCNN for face detection
   - Loads face database from `Face-Recognition-using-Facenet/face_db.pkl`
   - GPU acceleration (MPS/CUDA) with CPU fallback
   - Returns recognized name and confidence score

2. **face_recognition_cli.py** - CLI wrapper for Node.js integration
   - Accepts base64 image data
   - Returns JSON response

3. **server.js** - New endpoint added
   - `POST /api/recognize-face` - Face recognition endpoint
   - Spawns Python process for recognition
   - No disruption to existing chat/TTS endpoints

### Frontend Components
1. **FaceRecognition.jsx** - Face recognition UI component
   - Webcam capture
   - Real-time face scanning (every 2 seconds)
   - Visual feedback for recognition status
   - Auto-stops after successful recognition

2. **AvatarDemo.jsx** - Integration with avatar ring
   - Maps recognized faces to avatars
   - Triggers avatar selection automatically
   - Example mapping: Prateek → Alex, Vinayak → Noah, Shreya → Sia

## 🎯 How It Works

1. User clicks "Start Recognition" in the face recognition panel
2. Webcam activates and captures frames every 2 seconds
3. Frame sent to backend `/api/recognize-face` endpoint
4. Python service processes image and returns name + confidence
5. If recognized (confidence > 0.55):
   - Shows "Welcome, [Name]!" message
   - Automatically selects corresponding avatar
   - Avatar ring rotates to face the recognized person
   - Camera stops after 3 seconds

## 🚀 Usage

### Access Face Recognition
1. Start your RIVA app
2. Click the avatar button (person icon) in controls
3. Face recognition panel appears in top-right corner
4. Click "Start Recognition"
5. Look at the camera
6. System recognizes you and selects your avatar

### Customize Avatar Mapping
Edit `AvatarDemo.jsx`:
```javascript
const avatarMap = {
  'YourName': 'Alex',  // Map your enrolled name to avatar
  'Friend': 'Sia',
  'Another': 'Noah'
};
```

## 📋 Prerequisites

### Enroll Faces First
Before using face recognition, enroll faces:

```bash
cd Face-Recognition-using-Facenet

# Create person folder
mkdir -p enroll_images/YourName

# Add photos (clear, front-facing, good lighting)
# Copy 3-5 photos to enroll_images/YourName/

# Run enrollment
python3 auto_enrollment.py
```

### Install Python Dependencies
```bash
cd Face-Recognition-using-Facenet
pip install -r requirements.txt
```

## 🔧 Configuration

### Adjust Recognition Threshold
In `face_recognition_service.py`, line 82:
```python
if score > 0.55:  # Change threshold (0.0 to 1.0)
```

### Change Scan Interval
In `FaceRecognition.jsx`, line 75:
```javascript
}, 2000);  // Milliseconds between scans
```

### Customize Greetings
Recognition triggers avatar selection automatically. Customize in `AvatarDemo.jsx`.

## 🎨 UI Features

- **Compact Panel**: Top-right corner, doesn't block main UI
- **Live Video Feed**: 320x240 preview
- **Status Indicators**: 
  - "Scanning..." (pulsing cyan)
  - "Welcome, [Name]!" (green, on success)
- **Stop Button**: Manual camera control

## 🔒 Privacy

- Camera only activates when user clicks "Start Recognition"
- Video feed stays local (not sent to cloud)
- Face data processed on your machine
- Auto-stops after recognition

## 🐛 Troubleshooting

### Camera Not Working
- Grant camera permissions to browser
- Check if another app is using camera
- Try different browser (Chrome recommended)

### No Face Detected
- Ensure good lighting
- Face camera directly
- Move closer to camera
- Check if face is enrolled

### Recognition Fails
- Re-enroll with more/better photos
- Adjust threshold in service
- Check face_db.pkl exists

### Python Errors
- Verify Python dependencies installed
- Check Python path in server.js
- Ensure face_db.pkl is accessible

## 🎯 Integration Points

### Existing Features (Unchanged)
✅ Voice chat with RIVA
✅ AudioSphere visualization
✅ Continuous mode
✅ Text input
✅ TTS output
✅ Conversation history
✅ Avatar ring (manual selection)

### New Features (Added)
✨ Face recognition panel
✨ Automatic avatar selection
✨ Webcam integration
✨ Real-time face scanning
✨ Visual recognition feedback

## 🚀 Future Enhancements

- [ ] Multi-face detection
- [ ] Confidence score display
- [ ] Recognition history
- [ ] Custom avatar photos
- [ ] Voice greeting on recognition
- [ ] Mobile camera support

## 📝 Notes

- Face recognition runs independently
- No impact on existing RIVA features
- Can be disabled by not clicking "Start Recognition"
- Works alongside voice commands and manual selection
- GPU accelerated when available

---

**Integration Complete! All existing features preserved. Face recognition added as optional enhancement.**
