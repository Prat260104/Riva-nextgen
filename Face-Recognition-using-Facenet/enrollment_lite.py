import os
import cv2
import numpy as np
import pickle

print("🚀 Lightweight Face Enrollment (CPU-only, optimized for low-spec machines)")

# Haar Cascade for face detection
cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
face_cascade = cv2.CascadeClassifier(cascade_path)

ENROLL_DIR = "enroll_images"
DB_PATH = "face_db_lite.pkl"

# Load or create DB
face_db = {}
if os.path.exists(DB_PATH):
    with open(DB_PATH, 'rb') as f:
        face_db = pickle.load(f)
    print(f"📦 Loaded existing database with {len(face_db)} faces")

def extract_face_features(face_img):
    """Extract lightweight histogram features"""
    face_img = cv2.resize(face_img, (64, 64))
    gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
    hist = cv2.calcHist([gray], [0], None, [32], [0, 256])
    hist = cv2.normalize(hist, hist).flatten()
    return hist

def enroll_person(person_name, person_dir):
    features_list = []
    
    for file in os.listdir(person_dir):
        if file.startswith("."):
            continue
        
        img_path = os.path.join(person_dir, file)
        img = cv2.imread(img_path)
        
        if img is None:
            print(f"⚠️  Could not read {file}")
            continue
        
        # Resize for faster processing
        scale = 0.5
        small_img = cv2.resize(img, None, fx=scale, fy=scale)
        gray = cv2.cvtColor(small_img, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(30, 30))
        
        if len(faces) == 0:
            print(f"❌ No face detected in {file}")
            continue
        
        # Get first face
        x, y, w, h = faces[0]
        x, y, w, h = int(x/scale), int(y/scale), int(w/scale), int(h/scale)
        face_roi = img[y:y+h, x:x+w]
        
        # Extract features
        features = extract_face_features(face_roi)
        features_list.append(features)
        print(f"✅ Processed {file}")
    
    if features_list:
        # Average all features
        avg_features = np.mean(features_list, axis=0)
        face_db[person_name] = avg_features
        print(f"🎉 Enrolled {person_name} with {len(features_list)} images")
    else:
        print(f"❌ No faces enrolled for {person_name}")

# Main enrollment
print(f"\n📂 Scanning {ENROLL_DIR}...\n")

for person_name in os.listdir(ENROLL_DIR):
    person_dir = os.path.join(ENROLL_DIR, person_name)
    if os.path.isdir(person_dir):
        print(f"👤 Enrolling: {person_name}")
        enroll_person(person_name, person_dir)
        print()

# Save database
with open(DB_PATH, 'wb') as f:
    pickle.dump(face_db, f)

print(f"💾 Database saved to {DB_PATH}")
print(f"✅ Total persons enrolled: {len(face_db)}")
print(f"📊 Database size: {os.path.getsize(DB_PATH) / 1024:.2f} KB")
