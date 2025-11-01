# Real-time Face Recognition System

A Python-based face recognition system that uses your webcam to detect and recognize faces in real-time. Features voice feedback on MacOS and GPU acceleration support.

## Features

- 🎥 Real-time face detection and recognition
- 🗣️ Voice feedback when faces are recognized (MacOS)
- 🚀 GPU acceleration support (CUDA/MPS)
- 📸 Easy face enrollment from photos
- 🔄 Continuous recognition with cooldown
- 🎯 Bounding box display with names

## Prerequisites

- Python 3.11 or newer
- Webcam
- MacOS with MPS support (optional, falls back to CPU)
- CUDA-capable GPU (optional for Windows/Linux)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/FaceRecognition.git
cd FaceRecognition
```

2. Create and activate a virtual environment:
```bash
# Create virtual environment
python3 -m venv venv311_new

# Activate it on MacOS/Linux:
source venv311_new/bin/activate

# Or on Windows:
# .\venv311_new\Scripts\activate
```

3. Install dependencies:
```bash
# Upgrade pip first
pip install --upgrade pip

# Install required packages
pip install -r requirements.txt

# OR explicitly using the project's venv pip
# /Users/prateekrai/Desktop/FaceRecognition/venv311_new/bin/pip install --upgrade pip
# /Users/prateekrai/Desktop/FaceRecognition/venv311_new/bin/pip install -r /Users/prateekrai/Desktop/FaceRecognition/requirements.txt

# Quick check: confirm Python and torch/MPS status
# /Users/prateekrai/Desktop/FaceRecognition/venv311_new/bin/python -V
# /Users/prateekrai/Desktop/FaceRecognition/venv311_new/bin/python -c "import torch; print('PyTorch', torch.__version__); print('MPS available', torch.backends.mps.is_available())"

## Usage

### 1. Enrolling Faces

1. Create a directory for each person under `enroll_images/`:
```bash
mkdir -p enroll_images/PersonName
```

2. Add photos of the person in their directory (JPG/PNG format)

3. Run the enrollment script:
```bash
python auto_enrollment.py
```

### 2. Running Face Recognition

Start the real-time recognition:
```bash
python recognition.py
```

The system will:
- Access your webcam
- Show a window with the camera feed
- Display bounding boxes around detected faces
- Show names of recognized individuals
- Provide voice feedback on MacOS when faces are recognized

## Configuration

The system automatically uses:
- MPS acceleration on MacOS if available
- CUDA on Windows/Linux if available
- Falls back to CPU if no GPU acceleration is available

Voice feedback is enabled by default on MacOS and can be configured in the recognition script.

## Troubleshooting

1. **ImportError: No module named 'xxx'**
   - Ensure you've activated the virtual environment
   - Run `pip install -r requirements.txt` again

2. **Camera not working**
   - Check if your webcam is properly connected
   - Try a different camera index in `recognition.py`

3. **Performance issues**
   - On MacOS, ensure MPS acceleration is working
   - On Windows/Linux, check CUDA installation
   - Reduce frame processing frequency if needed

## License

[Add your chosen license here]

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

# Inspect the saved face DB (list enrolled names)
# /Users/prateekrai/Desktop/FaceRecognition/venv311_new/bin/python -c "import pickle; print('Enrolled:', list(pickle.load(open('face_db.pkl','rb')).keys()))"

# If camera index 0 doesn't work, change index in the script:
# In `recognition.py`, replace `cv2.VideoCapture(0)` with another index (1, 2, ...) or a device path.

# Troubleshooting notes (macOS):
# - Grant camera access to Terminal when prompted.
# - The code forces MTCNN to run on CPU while keeping the embedding model on MPS to avoid an MPS adaptive-pool bug.
# - To force CPU-only operation for debugging, edit the scripts to set `device = torch.device('cpu')`.

# Optional: run a short test to confirm everything is set up (5 frames)
# FR_TEST=1 FR_MAX_FRAMES=5 python recognition.py
