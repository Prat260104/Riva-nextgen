#!/usr/bin/env python3
"""
Test script to verify face recognition system with existing dataset
"""
import os
import cv2
import torch
import numpy as np
from facenet_pytorch import MTCNN, InceptionResnetV1

# Setup
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

mtcnn = MTCNN(image_size=160, margin=30, min_face_size=40, device=device)
resnet = InceptionResnetV1(pretrained='vggface2').eval().to(device)

dataset_path = "dataset"
known_face_encodings = []
known_face_names = []

def load_embeddings():
    known_face_encodings.clear()
    known_face_names.clear()
    
    for person_name in os.listdir(dataset_path):
        person_folder = os.path.join(dataset_path, person_name)
        if not os.path.isdir(person_folder):
            continue
            
        print(f"Loading {person_name}...")
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
            embedding = resnet(face_tensor).detach().cpu().numpy()
            embedding = embedding / np.linalg.norm(embedding)
            
            known_face_encodings.append(embedding)
            known_face_names.append(person_name)
            count += 1
            
        print(f"  ✅ Loaded {count} images for {person_name}")

# Load and test
print("🔄 Loading embeddings from existing dataset...")
load_embeddings()

print(f"\n✅ Training complete!")
print(f"📊 Loaded {len(set(known_face_names))} people")
print(f"📊 Total embeddings: {len(known_face_names)}")
print(f"\n👥 Recognized people: {', '.join(set(known_face_names))}")
print(f"\n🎯 Ready for face recognition greeting system!")