import os
import torch
from PIL import Image
from facenet_pytorch import MTCNN, InceptionResnetV1
import pickle

# Device
device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')

# If MPS backend is available, run MTCNN on CPU to avoid an MPS adaptive-pool bug
# (adaptive pooling on MPS can raise "input sizes must be divisible by output sizes").
mtcnn_device = torch.device('cpu') if device.type == 'mps' else device
print("Using device for embeddings:", device)
print("Using device for MTCNN (face detection):", mtcnn_device)

# MTCNN (run detection on mtcnn_device)
mtcnn = MTCNN(image_size=160, margin=20, min_face_size=20, device=mtcnn_device)

# FaceNet
resnet = InceptionResnetV1(pretrained='vggface2').eval().to(device)

# Paths
ENROLL_DIR = "enroll_images"
DB_PATH = "face_db.pkl"

# Load or create DB
face_db = {}
if os.path.exists(DB_PATH):
    with open(DB_PATH, 'rb') as f:
        face_db = pickle.load(f)

def enroll_person(person_name, person_dir):
    embeddings = []

    for file in os.listdir(person_dir):
        if file.startswith("."):
            continue
        img_path = os.path.join(person_dir, file)
        img = Image.open(img_path).convert('RGB')

        # ----- MPS safe resize -----
        w, h = img.size
        min_size = 160
        max_dim = 1024

        # Resize too small images
        if w < min_size or h < min_size:
            scale = max(min_size/w, min_size/h)
            img = img.resize((int(w*scale), int(h*scale)))

        # Resize too large images
        if max(img.size) > max_dim:
            scale = max_dim / max(img.size)
            img = img.resize((int(img.size[0]*scale), int(img.size[1]*scale)))

        # Detect face
        face_tensor = mtcnn(img)
        if face_tensor is None:
            print(f"No face detected in {file}, skipping.")
            continue

        # Add batch dim if missing
        if face_tensor.ndim == 3:
            face_tensor = face_tensor.unsqueeze(0)

        # Embedding
        with torch.no_grad():
            embedding = resnet(face_tensor.to(device))
        embeddings.append(embedding.squeeze().cpu())

    if embeddings:
        embeddings_stack = torch.stack(embeddings)
        face_db[person_name] = embeddings_stack.mean(0)
        print(f"Enrollment successful for {person_name}.")
    else:
        print(f"No faces enrolled for {person_name}.")

# Main
for person_name in os.listdir(ENROLL_DIR):
    person_dir = os.path.join(ENROLL_DIR, person_name)
    if os.path.isdir(person_dir):
        enroll_person(person_name, person_dir)

# Save DB
with open(DB_PATH, 'wb') as f:
    pickle.dump(face_db, f)

print(f"\nFace database saved to {DB_PATH}. Total persons enrolled: {len(face_db)}")
