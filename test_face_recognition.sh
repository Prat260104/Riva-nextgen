#!/bin/bash

echo "🧪 Testing Face Recognition Setup"
echo "=================================="
echo ""

echo "1️⃣ Checking Python dependencies..."
python3 -c "import cv2, numpy, pickle; print('✅ Dependencies OK')" || echo "❌ Dependencies missing"
echo ""

echo "2️⃣ Checking face database..."
python3 -c "import pickle; db = pickle.load(open('Face-Recognition-using-Facenet/face_db_lite.pkl', 'rb')); print(f'✅ Database OK - {len(db)} faces enrolled: {list(db.keys())}')" || echo "❌ Database not found"
echo ""

echo "3️⃣ Checking backend service..."
python3 -c "from backend.face_recognition_lite import get_lite_service; s = get_lite_service(); print('✅ Service OK')" || echo "❌ Service error"
echo ""

echo "4️⃣ Checking backend server..."
curl -s http://localhost:5000/api/health > /dev/null && echo "✅ Backend running" || echo "❌ Backend not running - Start with: cd backend && node server.js"
echo ""

echo "=================================="
echo "✅ Setup complete! Now test in browser."
