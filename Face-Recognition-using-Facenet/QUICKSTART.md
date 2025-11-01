# Face Recognition System
# Quick Reference Card

## Setup
```bash
# 1. Create and activate environment
python3 -m venv venv311_new
source venv311_new/bin/activate   # MacOS/Linux
# or .\venv311_new\Scripts\activate  # Windows

# 2. Install requirements
pip install -r requirements.txt

# 3. Quick setup (MacOS/Linux)
chmod +x setup.sh
./setup.sh
```

## Enrolling Faces
1. Create person folder:
```bash
mkdir -p enroll_images/PersonName
```

2. Add photos to folder:
- Clear, front-facing photos
- Good lighting
- One face per image

3. Run enrollment:
```bash
python auto_enrollment.py
```

## Running Recognition
```bash
# Live mode (press 'q' to quit):
python recognition.py

# Test mode:
python recognition.py --test --max-frames 30
```

## Troubleshooting
- Grant camera permissions to Terminal/IDE
- Check enrollment images are clear
- Ensure good lighting for recognition
- Press 'q' to quit camera window