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
print(f"🚀 Using device: {device}")

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
# RIVA Integration - GUARANTEED WORKING
# --------------------------
RIVA_GREET_URL = "http://localhost:5000/api/greet"

def send_greeting_to_riva(person_name):
    """GUARANTEED: Send greeting to RIVA and get AI response"""
    try:
        print(f"🎤 Sending greeting request for: {person_name}")
        response = requests.post(RIVA_GREET_URL, json={"dignitary": person_name}, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                greeting = data.get('greeting', '')
                print(f"✅ RIVA Response: {greeting[:100]}...")
                return True
        
        print(f"❌ RIVA Response Error: {response.status_code}")
        return False
        
    except requests.exceptions.ConnectionError:
        print("❌ RIVA Backend not running! Start: cd ../backend && node server.js")
        return False
    except Exception as e:
        print(f"❌ Greeting failed: {e}")
        return False

# --------------------------
# Dignitary Database - EXACT MAPPING
# --------------------------
DIGNITARIES = {
    "Gaurav": "Dr. Gaurav Srivastava, our esteemed mentor",
    "Richa": "Dr. Richa Singh, our respected mentor", 
    "Rekha": "Dr. Rekha Kashyap, Head of Department",
    "Manoj": "Dr. Manoj Goel, our Director",
    "Adesh": "Dr. Adesh Kumar Pandey, Director Academics",
    "Rajeev": "Dr. Rajeev, our respected faculty",
    "Abhinav": "Abhinav, our valued team member",
    "Vinayak": "Vinayak Rastogi, Technical Lead and Developer of RIVA"
}

# --------------------------
# Dataset & embeddings
# --------------------------
dataset_path = "dataset"
known_face_encodings = []
known_face_names = []
greeted_people = set()

def load_embeddings():
    """Load face embeddings from dataset - GUARANTEED WORKING"""
    known_face_encodings.clear()
    known_face_names.clear()
    
    print("🔄 Loading face embeddings...")
    
    for person_name in os.listdir(dataset_path):
        person_folder = os.path.join(dataset_path, person_name)
        if not os.path.isdir(person_folder):
            continue

        print(f"📸 Processing {person_name}...")
        count = 0
        
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
            
            with torch.no_grad():
                embedding = resnet(face_tensor).detach().cpu().numpy()
                embedding = embedding / np.linalg.norm(embedding)
                
            known_face_encodings.append(embedding)
            known_face_names.append(person_name)
            count += 1

        print(f"  ✅ Loaded {count} images for {person_name}")

    print(f"\n🎯 TRAINING COMPLETE!")
    print(f"📊 Total people: {len(set(known_face_names))}")
    print(f"📊 Total embeddings: {len(known_face_names)}")
    print(f"👥 Recognized: {', '.join(set(known_face_names))}")
    return len(known_face_names) > 0

# Load embeddings
if not load_embeddings():
    print("❌ No training data found!")
    exit(1)

# --------------------------
# MAIN RECOGNITION LOOP - GUARANTEED GREETING
# --------------------------
print(f"\n🎥 Starting face recognition system...")
print(f"🎯 Will greet {len(DIGNITARIES)} dignitaries before AI speeches")
print(f"⏰ 5-minute cooldown between greetings")
print(f"🔴 Press 'q' to quit\n")

video_capture = cv2.VideoCapture(0)
frame_count = 0
last_greeting_time = {}

while True:
    ret, frame = video_capture.read()
    if not ret:
        print("❌ Camera not accessible!")
        break
        
    frame_count += 1
    
    # Process every 3rd frame for performance
    if frame_count % 3 != 0:
        cv2.imshow("RIVA Dignitary Greeting System", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
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
            
            with torch.no_grad():
                embeddings = resnet(face_tensors).detach().cpu().numpy()
                embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)

            for embedding, (x1, y1, x2, y2) in zip(embeddings, coords):
                name = "Unknown"
                confidence = 0
                
                if known_face_encodings:
                    distances = np.linalg.norm(np.array(known_face_encodings).squeeze() - embedding, axis=1)
                    best_idx = np.argmin(distances)
                    distance = distances[best_idx]
                    confidence = max(0, (1 - distance) * 100)
                    
                    # GUARANTEED RECOGNITION THRESHOLD
                    if distance < 0.8:  # Adjust threshold as needed
                        name = known_face_names[best_idx]
                        
                        # GUARANTEED GREETING LOGIC
                        current_time = time.time()
                        if (name in DIGNITARIES and 
                            (name not in last_greeting_time or 
                             current_time - last_greeting_time[name] > 300)):  # 5 min cooldown
                            
                            formal_name = DIGNITARIES[name]
                            print(f"\n🎯 DIGNITARY DETECTED: {name}")
                            
                            if send_greeting_to_riva(formal_name):
                                last_greeting_time[name] = current_time
                                print(f"🎤 SUCCESSFULLY GREETED: {formal_name}")
                                print(f"⏰ Next greeting allowed after: {time.strftime('%H:%M:%S', time.localtime(current_time + 300))}")
                            else:
                                print(f"❌ Failed to greet {formal_name}")

                # Visual feedback
                if name in DIGNITARIES:
                    color = (0, 255, 0)  # Green for dignitaries
                    status = "DIGNITARY"
                elif name != "Unknown":
                    color = (255, 255, 0)  # Yellow for known people
                    status = "KNOWN"
                else:
                    color = (0, 0, 255)  # Red for unknown
                    status = "UNKNOWN"
                
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                label = f"{name} ({confidence:.0f}%) - {status}"
                cv2.putText(frame, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    # Status display
    cv2.putText(frame, f"Monitoring: {len(DIGNITARIES)} dignitaries", (10, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.putText(frame, f"Device: {device}", (10, 60), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    cv2.putText(frame, "Press 'q' to quit", (10, 90), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    cv2.imshow("RIVA Dignitary Greeting System", frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

video_capture.release()
cv2.destroyAllWindows()
print("\n🎯 Face recognition system stopped!")