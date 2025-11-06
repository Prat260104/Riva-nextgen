# NextGen Face Recognition



NextGen Face Recognition is a **real-time face recognition system** built with Python using **PyTorch, Facenet-PyTorch, and OpenCV**. It can recognize multiple people in real-time, even under minor occlusions like glasses, with high accuracy using a few images per person.

---

## Features

- Real-time webcam-based face recognition
- Handles multiple faces at once
- Works with **5–10 images per person**, including variations (with/without glasses)
- Easy to add new people on the fly
- Works cross-platform: **Windows and Mac**
- Optimized for **accuracy and speed** with frame skipping and embedding averaging
- Supports both **CPU and GPU** (if available)

---

### 1. Clone the repository

```bash
git clone https://github.com/Prat260104/NextGen-FaceRecognition.git
cd NextGen-FaceRecognition
```

2. Create a virtual environment (recommended)

```bash
# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```


```bash
# Windows
python -m venv venv
venv\Scripts\activate
```

3. Install dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```



4. Run the face recognition
```bash
# Make sure your virtual environment is activated
python main.py
```

