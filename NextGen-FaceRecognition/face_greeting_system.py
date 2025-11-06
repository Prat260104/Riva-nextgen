import os
import cv2
import torch
import numpy as np
import requests
import time
from facenet_pytorch import MTCNN, InceptionResnetV1

# --------------------------
# Device & models
# --------------------------
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

mtcnn = MTCNN(
    image_size=160,
    margin=30,
    min_face_size=40,
    thresholds=[0.7, 0.8, 0.8],
    keep_all=True,
    device=device
)

resnet = InceptionResnetV1(pretrained='vggface2').eval().to(device)

# --------------------------
# RIVA Integration
# --------------------------
RIVA_GREET_URL = "http://localhost:5000/api/greet"

def send_greeting_to_riva(person_name):
    """Send greeting request to RIVA backend"""
    try:
        response = requests.post(RIVA_GREET_URL, json={"dignitary": person_name})
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ RIVA greeted: {person_name}")
                print(f"🎤 Greeting: {data.get('greeting', '')}")
                return True
    except Exception as e:
        print(f"❌ Failed to send greeting: {e}")
    return False

# --------------------------
# Dignitary Database (mapped to existing dataset folders)
# --------------------------
DIGNITARIES = {
    "Gaurav": "Dr. Gaurav Srivastava, our esteemed mentor",
    "Richa": "Dr. Richa Singh, our respected mentor", 
    "Rekha": "Dr. Rekha Kashyap, Head of Department",
    "Manoj": "Dr. Manoj Goel, our Director",
    "Adesh": "Dr. Adesh Kumar Pandey, Director Academics",
    "Rajeev": "Dr. Rajeev, our respected faculty",
    "Abhinav": "Abhinav, our valued team member"
}

# --------------------------
# Dataset & embeddings
# --------------------------
dataset_path = "dataset"
os.makedirs(dataset_path, exist_ok=True)
known_face_encodings = []
known_face_names = []
greeted_people = set()  # Track who we've already greeted

def load_embeddings():
    known_face_encodings.clear()
    known_face_names.clear()
    for person_name in os.listdir(dataset_path):
        person_folder = os.path.join(dataset_path, person_name)
        if not os.path.isdir(person_folder):
            continue

        for img_name in os.listdir(person_folder):
            img_path = os.path.join(person_folder, img_name)
            img = cv2.imread(img_path)
            if img is None:
                continue
            img = img[:,:,::-1]  # BGR -> RGB

            boxes, _ = mtcnn.detect(img)
            if boxes is None:
                continue
            x1, y1, x2, y2 = map(int, boxes[0])
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(img.shape[1], x2), min(img.shape[0], y2)
            face = img[y1:y2, x1:x2]
            if face.size == 0:
                continue
            face = cv2.resize(face, (160,160))

            face_tensor = torch.tensor(face).permute(2,0,1).unsqueeze(0).float()/255.0
            face_tensor = face_tensor.to(device)
            embedding = resnet(face_tensor).detach().cpu().numpy()
            embedding = embedding / np.linalg.norm(embedding)
            known_face_encodings.append(embedding)
            known_face_names.append(person_name)

load_embeddings()
print(f"Loaded {len(set(known_face_names))} people for greeting system.")

# --------------------------
# Face Recognition & Greeting
# --------------------------
video_capture = cv2.VideoCapture(0)
frame_count = 0
last_greeting_time = {}

while True:
    ret, frame = video_capture.read()
    if not ret:
        break
    frame_count += 1

    if frame_count % 3 != 0:  # Process every 3rd frame
        continue

    rgb_frame = frame[:,:,::-1]
    boxes, _ = mtcnn.detect(rgb_frame)
    
    if boxes is not None:
        faces, coords = [], []
        for box in boxes:
            x1, y1, x2, y2 = map(int, box)
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(frame.shape[1], x2), min(frame.shape[0], y2)
            face = rgb_frame[y1:y2, x1:x2]
            if face.size == 0:
                continue
            face = cv2.resize(face, (160,160))
            faces.append(face)
            coords.append((x1, y1, x2, y2))
        
        if faces:
            face_tensors = torch.tensor(np.array(faces)).permute(0,3,1,2).float()/255.0
            face_tensors = face_tensors.to(device)
            embeddings = resnet(face_tensors).detach().cpu().numpy()
            embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)

            for embedding, (x1, y1, x2, y2) in zip(embeddings, coords):
                name = "Unknown"
                if known_face_encodings:
                    distances = np.linalg.norm(np.array(known_face_encodings).squeeze() - embedding, axis=1)
                    best_idx = np.argmin(distances)
                    threshold = 0.8
                    if distances[best_idx] < threshold:
                        name = known_face_names[best_idx]
                        
                        # Check if this is a dignitary and we haven't greeted them recently
                        current_time = time.time()
                        if (name in DIGNITARIES and 
                            (name not in last_greeting_time or 
                             current_time - last_greeting_time[name] > 300)):  # 5 min cooldown
                            
                            formal_name = DIGNITARIES[name]
                            if send_greeting_to_riva(formal_name):
                                last_greeting_time[name] = current_time
                                print(f"🎤 Greeted: {formal_name}")

                # Visual feedback
                color = (0, 255, 0) if name in DIGNITARIES else (255, 255, 0)
                cv2.rectangle(frame, (x1,y1), (x2,y2), color, 2)
                display_name = DIGNITARIES.get(name, name)
                cv2.putText(frame, display_name[:20], (x1,y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    # Status display
    cv2.putText(frame, f"Monitoring: {len(DIGNITARIES)} dignitaries", (10, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.putText(frame, "Press 'q' to quit", (10, 60), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    cv2.imshow("RIVA Greeting System", frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

video_capture.release()
cv2.destroyAllWindows()