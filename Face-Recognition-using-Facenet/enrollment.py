import os
from PIL import Image
import torch
import numpy as np
import pickle
from facenet_pytorch import MTCNN, InceptionResnetV1

# Mac M1/M2/M3 GPU support
device = torch.device('mps') if torch.backends.mps.is_available() else 'cpu'
print(f"Using device: {device}")

mtcnn = MTCNN(keep_all=False, device=device)
resnet = InceptionResnetV1(pretrained='vggface2').eval().to(device)

DB_PATH = "face_db.pkl"
face_db = {}

if os.path.exists(DB_PATH):
    with open(DB_PATH, 'rb') as f:
        face_db = pickle.load(f)

person_name = input("Enter person name: ")
images_folder = f"enroll_images/{person_name}/"
image_files = [os.path.join(images_folder, f) for f in os.listdir(images_folder) if f.endswith(('.jpg','.png'))]

embeddings = []

for img_path in image_files:
    img = Image.open(img_path).convert('RGB')
    face_tensor = mtcnn(img)
    if face_tensor is None:
        print(f"No face detected in {img_path}")
        continue
    with torch.no_grad():
        emb = resnet(face_tensor.unsqueeze(0).to(device)).cpu().numpy()
    embeddings.append(emb[0])

if len(embeddings) == 0:
    print("No faces detected, enrollment failed.")
else:
    mean_emb = np.mean(np.vstack(embeddings), axis=0)
    face_db[person_name] = mean_emb
    with open(DB_PATH, 'wb') as f:
        pickle.dump(face_db, f)
    print(f"{person_name} enrolled successfully with {len(embeddings)} images!")
