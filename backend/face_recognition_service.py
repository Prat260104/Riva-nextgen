import os
import sys
import torch
import numpy as np
import pickle
from facenet_pytorch import MTCNN, InceptionResnetV1
from sklearn.metrics.pairwise import cosine_similarity
from PIL import Image
import io
import base64

class FaceRecognitionService:
    def __init__(self):
        # Device setup
        self.device = torch.device('mps' if torch.backends.mps.is_available() else 
                                   'cuda' if torch.cuda.is_available() else 'cpu')
        self.mtcnn_device = torch.device('cpu') if self.device.type == 'mps' else self.device
        
        print(f"Face Recognition - Using device: {self.device}")
        
        # Initialize models
        self.mtcnn = MTCNN(keep_all=True, device=self.mtcnn_device)
        self.resnet = InceptionResnetV1(pretrained='vggface2').eval().to(self.device)
        
        # Load face database
        self.db_path = os.path.join(os.path.dirname(__file__), '../Face-Recognition-using-Facenet/face_db.pkl')
        self.face_db = {}
        self.load_database()
        
    def load_database(self):
        """Load face embeddings database"""
        if os.path.exists(self.db_path):
            with open(self.db_path, 'rb') as f:
                self.face_db = pickle.load(f)
            print(f"Loaded {len(self.face_db)} faces from database")
        else:
            print("No face database found. Run enrollment first.")
    
    def recognize_face(self, image_data):
        """
        Recognize face from base64 image data
        Returns: {'success': bool, 'name': str, 'confidence': float}
        """
        try:
            # Decode base64 image
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            img_bytes = base64.b64decode(image_data)
            img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
            
            # Detect faces
            boxes, probs = self.mtcnn.detect(img)
            faces = self.mtcnn(img)
            
            if faces is None:
                return {'success': False, 'message': 'No face detected'}
            
            # Handle different tensor formats
            if isinstance(faces, torch.Tensor):
                if faces.ndim == 4:
                    face_list = [faces[i] for i in range(faces.shape[0])]
                elif faces.ndim == 3:
                    face_list = [faces]
                else:
                    face_list = []
            else:
                face_list = [faces] if not isinstance(faces, list) else faces
            
            if not face_list:
                return {'success': False, 'message': 'No face detected'}
            
            # Process first detected face
            face_tensor = face_list[0].to(torch.float32)
            
            # Generate embedding
            with torch.no_grad():
                emb = self.resnet(face_tensor.unsqueeze(0).to(self.device)).cpu().numpy()
            
            # Compare with database
            if not self.face_db:
                return {'success': False, 'message': 'Face database is empty'}
            
            names = list(self.face_db.keys())
            db_embeddings = np.vstack([self.face_db[n] for n in names])
            
            sims = cosine_similarity(emb, db_embeddings)[0]
            idx = np.argmax(sims)
            score = sims[idx]
            
            if score > 0.55:
                return {
                    'success': True,
                    'name': names[idx],
                    'confidence': float(score)
                }
            else:
                return {
                    'success': False,
                    'message': 'Unknown face',
                    'confidence': float(score)
                }
                
        except Exception as e:
            print(f"Face recognition error: {e}")
            return {'success': False, 'message': str(e)}

# Singleton instance
_face_service = None

def get_face_service():
    global _face_service
    if _face_service is None:
        _face_service = FaceRecognitionService()
    return _face_service
