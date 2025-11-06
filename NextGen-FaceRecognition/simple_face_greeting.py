import os
import cv2
import numpy as np
import requests
import time

# RIVA Integration
RIVA_GREET_URL = "http://localhost:5000/api/greet"

def send_greeting_to_riva(person_name):
    try:
        response = requests.post(RIVA_GREET_URL, json={"dignitary": person_name})
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ RIVA greeted: {person_name}")
                return True
    except Exception as e:
        print(f"❌ Failed to send greeting: {e}")
    return False

# Dignitary Database
DIGNITARIES = {
    "Gaurav": "Dr. Gaurav Srivastava, our esteemed mentor",
    "Richa": "Dr. Richa Singh, our respected mentor", 
    "Rekha": "Dr. Rekha Kashyap, Head of Department",
    "Manoj": "Dr. Manoj Goel, our Director",
    "Adesh": "Dr. Adesh Kumar Pandey, Director Academics",
    "Rajeev": "Dr. Rajeev, our respected faculty",
    "Abhinav": "Abhinav, our valued team member"
}

# Simple OpenCV face recognition
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
recognizer = cv2.face.LBPHFaceRecognizer_create()

def load_training_data():
    faces = []
    labels = []
    label_dict = {}
    current_label = 0
    
    dataset_path = "dataset"
    
    for person_name in os.listdir(dataset_path):
        person_folder = os.path.join(dataset_path, person_name)
        if not os.path.isdir(person_folder):
            continue
            
        label_dict[current_label] = person_name
        print(f"Loading {person_name}...")
        
        for img_name in os.listdir(person_folder):
            img_path = os.path.join(person_folder, img_name)
            img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
            if img is None:
                continue
                
            detected_faces = face_cascade.detectMultiScale(img, 1.3, 5)
            for (x, y, w, h) in detected_faces:
                face = img[y:y+h, x:x+w]
                face = cv2.resize(face, (100, 100))
                faces.append(face)
                labels.append(current_label)
        
        current_label += 1
    
    if faces:
        recognizer.train(faces, np.array(labels))
        print(f"✅ Training complete! Loaded {len(set(labels))} people")
        return label_dict
    return {}

# Load training data
print("🔄 Loading training data...")
label_dict = load_training_data()

# Face recognition loop
video_capture = cv2.VideoCapture(0)
last_greeting_time = {}

while True:
    ret, frame = video_capture.read()
    if not ret:
        break
        
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    
    for (x, y, w, h) in faces:
        face = gray[y:y+h, x:x+w]
        face = cv2.resize(face, (100, 100))
        
        label, confidence = recognizer.predict(face)
        
        if confidence < 80:  # More lenient threshold
            name = label_dict.get(label, "Unknown")
            
            # Check if dignitary and greet
            current_time = time.time()
            if (name in DIGNITARIES and 
                (name not in last_greeting_time or 
                 current_time - last_greeting_time[name] > 300)):
                
                formal_name = DIGNITARIES[name]
                if send_greeting_to_riva(formal_name):
                    last_greeting_time[name] = current_time
                    print(f"🎤 Greeted: {formal_name}")
            
            color = (0, 255, 0) if name in DIGNITARIES else (255, 255, 0)
            cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
            cv2.putText(frame, f"{name} ({confidence:.0f})", (x, y-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        else:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
            cv2.putText(frame, "Unknown", (x, y-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
    
    cv2.putText(frame, f"Monitoring: {len(DIGNITARIES)} dignitaries", (10, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.imshow("RIVA Greeting System", frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

video_capture.release()
cv2.destroyAllWindows()