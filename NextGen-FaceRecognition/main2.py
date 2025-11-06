import os
import cv2
import torch
import numpy as np
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
# Dataset & embeddings
# --------------------------
dataset_path = "dataset"
os.makedirs(dataset_path, exist_ok=True)
known_face_encodings = []
known_face_names = []

# --------------------------
# Augmentation helper
# --------------------------
def augment_face(face):
    """
    Generate small augmentations for better robustness.
    Flip, slight brightness variation.
    """
    aug_faces = [face.copy()]  # original
    aug_faces.append(np.fliplr(face).copy())  # horizontal flip

    # small brightness variations
    for alpha in [0.9, 1.1]:  # darker, brighter
        aug = np.clip(face * alpha, 0, 255).astype(np.uint8)
        aug_faces.append(aug)

    return aug_faces

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

            # Augment each face
            for f in augment_face(face):
                face_tensor = torch.tensor(f).permute(2,0,1).unsqueeze(0).float()/255.0
                face_tensor = face_tensor.to(device)
                embedding = resnet(face_tensor).detach().cpu().numpy()
                embedding = embedding / np.linalg.norm(embedding)  # normalize
                known_face_encodings.append(embedding)
                known_face_names.append(person_name)

load_embeddings()
print(f"Loaded {len(set(known_face_names))} people, {len(known_face_names)} embeddings.")

# --------------------------
# Real-time webcam recognition
# --------------------------
video_capture = cv2.VideoCapture(0)
frame_count = 0

while True:
    ret, frame = video_capture.read()
    if not ret:
        break
    frame_count += 1

    # Skip frames to reduce lag
    if frame_count % 2 != 0:
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
                    threshold = 0.85
                    if distances[best_idx] < threshold:
                        name = known_face_names[best_idx]

                cv2.rectangle(frame, (x1,y1),(x2,y2),(0,255,0),2)
                cv2.putText(frame,name,(x1,y1-10),cv2.FONT_HERSHEY_SIMPLEX,0.9,(0,255,0),2)

    cv2.imshow("Face Recognition", frame)
    key = cv2.waitKey(1) & 0xFF

    # Add new person
    if key == ord('a'):
        new_name = input("Enter new person name: ").strip()
        if new_name:
            person_folder = os.path.join(dataset_path, new_name)
            os.makedirs(person_folder, exist_ok=True)
            for i in range(8):  # 8–9 images
                ret, new_frame = video_capture.read()
                if not ret:
                    continue
                cv2.imshow(f"Capturing {new_name}", new_frame)
                cv2.waitKey(500)
                photo_path = os.path.join(person_folder, f"{i+1}.jpg")
                cv2.imwrite(photo_path, new_frame)
            print(f"Saved photos for {new_name}, updating embeddings...")
            load_embeddings()

    if key == ord('q'):
        break

video_capture.release()
cv2.destroyAllWindows()
