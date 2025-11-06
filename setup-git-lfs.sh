#!/bin/bash

# Initialize Git LFS
git lfs install

# Track large video files with Git LFS
git lfs track "*.mp4"
git lfs track "Riva-2/Riva-main/frontend/public/*.mp4"

# Add .gitattributes
git add .gitattributes

# Remove videos from gitignore (so they can be tracked by LFS)
sed -i '/^\*\.mp4$/d' .gitignore
sed -i '/^!intro\.mp4$/d' .gitignore
sed -i '/^!rotate\.mp4$/d' .gitignore

# Add all video files
git add Riva-2/Riva-main/frontend/public/*.mp4

# Commit
git commit -m "Add large video files with Git LFS"

echo "✅ Git LFS setup complete!"
echo "Now run: git push origin main"
