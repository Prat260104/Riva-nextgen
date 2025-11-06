#!/usr/bin/env python3
"""
Setup script to create dignitary folders for face recognition
"""
import os

# Create dataset directory
dataset_path = "dataset"
os.makedirs(dataset_path, exist_ok=True)

# List of dignitaries to create folders for
dignitaries = [
    "Dr_Gaurav_Srivastava",
    "Dr_Richa_Singh", 
    "Dr_Bikki_Kumar",
    "Dr_Rekha_Kashyap",
    "Dr_Manoj_Goel",
    "Dr_Adesh_Kumar_Pandey",
    "Shreya_Jain",
    "Samarth_Shukla",
    "Ujjawal_Tyagi",
    "Preeti_Singh",
    "Srashti_Gupta",
    "Vidisha_Goel",
    "Ronak_Goel",
    "Vinayak_Rastogi",
    "Divyansh_Verma"
]

print("🎯 Setting up dignitary folders...")

for dignitary in dignitaries:
    folder_path = os.path.join(dataset_path, dignitary)
    os.makedirs(folder_path, exist_ok=True)
    print(f"📁 Created folder: {folder_path}")

print(f"\n✅ Setup complete! Created {len(dignitaries)} dignitary folders.")
print("\n📸 Next steps:")
print("1. Add 5-8 photos of each dignitary to their respective folders")
print("2. Run: python face_greeting_system.py")
print("3. Start RIVA backend: cd ../backend && node server.js")
print("4. The system will automatically greet recognized dignitaries!")