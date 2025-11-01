import os
import cv2
import numpy as np
import pickle
import base64
from io import BytesIO
from PIL import Image

class FaceRecognitionLite:
    """Lightweight face recognition optimized for low-spec machines"""
    
    def __init__(self):
        # Use OpenCV's Haar Cascade (much lighter than MTCNN)
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        
        # Load face database
        self.db_path = os.path.join(os.path.dirname(__file__), 
                                    '../Face-Recognition-using-Facenet/face_db_lite.pkl')
        self.face_db = {}
        self.load_database()
    
    def load_database(self):
        """Load lightweight face database"""
        if os.path.exists(self.db_path):
            with open(self.db_path, 'rb') as f:
                self.face_db = pickle.load(f)
    
    def extract_face_features(self, face_img):
        """Extract simple histogram-based features (lightweight)"""
        # Resize to standard size
        face_img = cv2.resize(face_img, (64, 64))
        
        # Convert to grayscale
        gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
        
        # Histogram of Oriented Gradients (HOG) - lightweight feature
        hist = cv2.calcHist([gray], [0], None, [32], [0, 256])
        hist = cv2.normalize(hist, hist).flatten()
        
        return hist
    
    def recognize_face(self, image_data):
        """
        Lightweight face recognition from base64 image
        Returns: {'success': bool, 'name': str, 'confidence': float}
        """
        try:
            # Decode base64 image
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            img_bytes = base64.b64decode(image_data)
            img = Image.open(BytesIO(img_bytes))
            
            # Convert to OpenCV format
            img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
            
            # Resize for faster processing
            scale = 0.5
            small_img = cv2.resize(img_cv, None, fx=scale, fy=scale)
            gray = cv2.cvtColor(small_img, cv2.COLOR_BGR2GRAY)
            
            # Detect faces (Haar Cascade - very fast)
            faces = self.face_cascade.detectMultiScale(
                gray, 
                scaleFactor=1.1, 
                minNeighbors=5, 
                minSize=(30, 30)
            )
            
            if len(faces) == 0:
                return {'success': False, 'message': 'No face detected'}
            
            # Process first detected face
            x, y, w, h = faces[0]
            
            # Scale back to original coordinates
            x, y, w, h = int(x/scale), int(y/scale), int(w/scale), int(h/scale)
            face_roi = img_cv[y:y+h, x:x+w]
            
            # Extract features
            features = self.extract_face_features(face_roi)
            
            # Compare with database
            if not self.face_db:
                return {'success': False, 'message': 'Face database is empty'}
            
            best_match = None
            best_score = 0
            
            for name, db_features in self.face_db.items():
                # Cosine similarity
                similarity = np.dot(features, db_features) / (
                    np.linalg.norm(features) * np.linalg.norm(db_features)
                )
                
                if similarity > best_score:
                    best_score = similarity
                    best_match = name
            
            # Threshold for recognition (lower than FaceNet)
            if best_score > 0.50:
                return {
                    'success': True,
                    'name': best_match,
                    'confidence': float(best_score)
                }
            else:
                return {
                    'success': False,
                    'message': 'Unknown face',
                    'confidence': float(best_score)
                }
                
        except Exception as e:
            return {'success': False, 'message': str(e)}

# Singleton instance
_lite_service = None

def get_lite_service():
    global _lite_service
    if _lite_service is None:
        _lite_service = FaceRecognitionLite()
    return _lite_service
