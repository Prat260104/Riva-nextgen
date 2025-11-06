#!/usr/bin/env python3
"""
Production Face Recognition Service for RIVA
Runs as a background service and provides API endpoint for frontend
"""
import os
import cv2
import torch
import numpy as np
import requests
import time
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
from facenet_pytorch import MTCNN, InceptionResnetV1
import base64
from io import BytesIO
from PIL import Image

# Flask app setup
app = Flask(__name__)
CORS(app)

# --------------------------
# Device & models
# --------------------------
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"🚀 Face Recognition Service - Using device: {device}")

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
# Dignitary Database
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
# Global variables
# --------------------------
known_face_encodings = []
known_face_names = []
model_loaded = False

def load_embeddings():
    """Load face embeddings from dataset"""
    global known_face_encodings, known_face_names, model_loaded
    
    known_face_encodings.clear()
    known_face_names.clear()
    
    dataset_path = "dataset"
    if not os.path.exists(dataset_path):
        print(f"❌ Dataset path not found: {dataset_path}")
        return False
    
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

    model_loaded = len(known_face_names) > 0
    print(f"\n🎯 Model loaded: {model_loaded}")
    print(f"📊 Total people: {len(set(known_face_names))}")
    print(f"📊 Total embeddings: {len(known_face_names)}")
    return model_loaded

def recognize_face_from_image(image_data):
    """Recognize face from base64 image data"""
    if not model_loaded:
        return {"success": False, "error": "Model not loaded"}
    
    try:
        # Decode base64 image
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        img = np.array(image)
        
        if len(img.shape) == 3 and img.shape[2] == 4:  # RGBA
            img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)
        elif len(img.shape) == 3 and img.shape[2] == 3:  # RGB
            pass  # Already RGB
        else:
            return {"success": False, "error": "Invalid image format"}
        
        # Detect faces
        boxes, _ = mtcnn.detect(img)
        if boxes is None:
            return {"success": False, "error": "No face detected"}
        
        # Process first detected face
        x1, y1, x2, y2 = map(int, boxes[0])
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(img.shape[1], x2), min(img.shape[0], y2)
        face = img[y1:y2, x1:x2]
        
        if face.size == 0:
            return {"success": False, "error": "Invalid face region"}
        
        face = cv2.resize(face, (160,160))
        face_tensor = torch.tensor(face).permute(2,0,1).unsqueeze(0).float()/255.0
        face_tensor = face_tensor.to(device)
        
        with torch.no_grad():
            embedding = resnet(face_tensor).detach().cpu().numpy()
            embedding = embedding / np.linalg.norm(embedding)
        
        # Compare with known faces
        if known_face_encodings:
            distances = np.linalg.norm(np.array(known_face_encodings).squeeze() - embedding, axis=1)
            best_idx = np.argmin(distances)
            distance = distances[best_idx]
            confidence = max(0, (1 - distance) * 100)
            
            # Recognition threshold
            if distance < 0.8:  # Adjust as needed
                name = known_face_names[best_idx]
                return {
                    "success": True,
                    "name": name,
                    "confidence": round(confidence, 1),
                    "is_dignitary": name in DIGNITARIES
                }
        
        return {"success": False, "error": "Face not recognized"}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

# --------------------------
# API Endpoints
# --------------------------
@app.route('/api/recognize-dignitary', methods=['POST'])
def recognize_dignitary():
    """API endpoint for face recognition"""
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({"success": False, "error": "Image data required"}), 400
        
        result = recognize_face_from_image(data['image'])
        
        if result["success"] and result.get("is_dignitary"):
            return jsonify({
                "success": True,
                "name": result["name"],
                "confidence": result["confidence"]
            })
        else:
            return jsonify({"success": False, "name": None, "confidence": 0})
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/face-service/status', methods=['GET'])
def service_status():
    """Check service status"""
    return jsonify({
        "status": "running",
        "model_loaded": model_loaded,
        "device": str(device),
        "dignitaries_count": len(DIGNITARIES),
        "embeddings_count": len(known_face_names)
    })

@app.route('/api/face-service/reload', methods=['POST'])
def reload_model():
    """Reload face recognition model"""
    success = load_embeddings()
    return jsonify({
        "success": success,
        "model_loaded": model_loaded,
        "embeddings_count": len(known_face_names)
    })

if __name__ == '__main__':
    print("🎯 Starting RIVA Face Recognition Service...")
    
    # Load model on startup
    if load_embeddings():
        print("✅ Face recognition service ready!")
        print(f"🌐 Starting API server on http://localhost:5001")
        app.run(host='0.0.0.0', port=5001, debug=False, threaded=True)
    else:
        print("❌ Failed to load face recognition model!")
        print("📁 Make sure 'dataset' folder exists with dignitary photos")
        exit(1)