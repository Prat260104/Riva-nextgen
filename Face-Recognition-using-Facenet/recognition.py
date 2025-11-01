import cv2
import torch
import numpy as np
import pickle
from facenet_pytorch import MTCNN, InceptionResnetV1
from sklearn.metrics.pairwise import cosine_similarity
import time
import subprocess
import sys

# Mac MPS GPU support
device = torch.device('mps') if torch.backends.mps.is_available() else torch.device('cpu')

# Run MTCNN on CPU when MPS is active to avoid the MPS adaptive-pool bug
mtcnn_device = torch.device('cpu') if device.type == 'mps' else device
print(f"Using device for embeddings: {device}")
print(f"Using device for MTCNN (face detection): {mtcnn_device}")

mtcnn = MTCNN(keep_all=True, device=mtcnn_device)
resnet = InceptionResnetV1(pretrained='vggface2').eval().to(device)

DB_PATH = "face_db.pkl"
with open(DB_PATH, 'rb') as f:
    face_db = pickle.load(f)

names = list(face_db.keys())
db_embeddings = np.vstack([face_db[n] for n in names])

last_seen = {}
COOLDOWN = 3.0  # seconds

cap = cv2.VideoCapture(0)
# Short test-run mode (useful for automated verification). Set env FR_TEST=1 to enable and
# FR_MAX_FRAMES to the maximum number of frames to process before exiting.
import os
import argparse

# Prefer an explicit CLI flag for test mode so the script doesn't accidentally run
# in short-test mode because of an environment variable. Use --test to enable.
parser = argparse.ArgumentParser(description='Face recognition live/demo')
parser.add_argument('--test', action='store_true', help='Run short test and exit after --max-frames')
parser.add_argument('--max-frames', type=int, default=int(os.getenv('FR_MAX_FRAMES', '30')),
                    help='Maximum frames to process in test mode')
args = parser.parse_args()

# TEST_RUN is enabled only if --test is passed. Ignore FR_TEST env var to avoid
# accidental short-run behavior; if FR_TEST is set, print a warning so the user can unset it.
if os.getenv('FR_TEST', '') == '1' and not args.test:
    print("Warning: FR_TEST environment variable is set. It will be ignored unless you pass --test.")
TEST_RUN = args.test
MAX_FRAMES = args.max_frames

frame_count = 0
if TEST_RUN:
    print(f"TEST_RUN is ON: the script will exit after {MAX_FRAMES} frames. To run live, start without FR_TEST env var (e.g. `python recognition.py`).")
else:
    print("Running in live mode. Press 'q' in the window to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        continue

    img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    # Detect bounding boxes (and probs) and also get cropped face tensors
    boxes, probs = mtcnn.detect(img_rgb)
    faces = mtcnn(img_rgb)

    if faces is not None:
        # mtcnn may return:
        # - a single tensor with shape (3, H, W)
        # - a batched tensor with shape (N, 3, H, W)
        # - a list of tensors
        if isinstance(faces, torch.Tensor):
            if faces.ndim == 4:
                face_list = [faces[i] for i in range(faces.shape[0])]
            elif faces.ndim == 3:
                face_list = [faces]
            else:
                face_list = []
        elif isinstance(faces, (list, tuple)):
            face_list = faces
        else:
            face_list = [faces]

        for i, face_tensor in enumerate(face_list):
            # Ensure float dtype and correct shape (3,H,W)
            if isinstance(face_tensor, torch.Tensor):
                face_tensor = face_tensor.to(torch.float32)
            with torch.no_grad():
                emb = resnet(face_tensor.unsqueeze(0).to(device)).cpu().numpy()
            sims = cosine_similarity(emb, db_embeddings)[0]
            idx = np.argmax(sims)
            score = sims[idx]
            if score > 0.55:
                name = names[idx]
                now = time.time()
                if name not in last_seen or now - last_seen[name] > COOLDOWN:
                    last_seen[name] = now
                    print(f"{name} recognized!")
                    # Speak the recognition out loud on macOS using the `say` command.
                    # Run asynchronously so we don't block the recognition loop.
                    try:
                        # Greeting templates: per-person override or default template
                        GREETINGS = {
                            'Prateek': f"Hello {name}, how are you? How can I assist you today?"
                        }
                        greeting = GREETINGS.get(name, f"Hello {name}, how are you? How can I assist you today?")
                        if sys.platform == 'darwin':
                            # Speak asynchronously so we don't block the recognition loop.
                            subprocess.Popen(["say", greeting])
                        else:
                            # On other platforms you could use pyttsx3 or another TTS lib.
                            pass
                    except Exception as _err:
                        # Don't crash the main loop for a TTS failure; just log.
                        print('TTS failed:', _err)
                label = f"{name}"
            else:
                label = "Unknown"
            # Draw the bounding box and put the label next to the face if box available
            if boxes is not None and i < len(boxes) and boxes[i] is not None:
                x1, y1, x2, y2 = boxes[i]
                x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                # Box
                color = (0, 255, 0) if label != "Unknown" else (0, 0, 255)
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                # Label above box
                text_pos = (x1, max(10, y1 - 10))
                cv2.putText(frame, label, text_pos, cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
            else:
                # Fallback to top-left if no box
                cv2.putText(frame, label, (10,30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
    else:
        cv2.putText(frame, "No face", (10,30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)

    cv2.imshow("Face Recognition", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

    if TEST_RUN:
        frame_count += 1
        if frame_count >= MAX_FRAMES:
            print(f"TEST_RUN: reached {frame_count} frames, exiting")
            break

cap.release()
cv2.destroyAllWindows()
