#!/bin/bash
# Quick setup and run script for Face Recognition system

# Colors for pretty output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Face Recognition System Setup${NC}"
echo "================================"

# 1. Create virtual environment if it doesn't exist
if [ ! -d "venv311_new" ]; then
    echo -e "${GREEN}Creating virtual environment...${NC}"
    python3 -m venv venv311_new
fi

# 2. Activate virtual environment
echo -e "${GREEN}Activating virtual environment...${NC}"
source venv311_new/bin/activate

# 3. Install/upgrade dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
pip install --upgrade pip
pip install -r requirements.txt

# 4. Create enrollment directory if it doesn't exist
if [ ! -d "enroll_images" ]; then
    echo -e "${GREEN}Creating enrollment directory...${NC}"
    mkdir -p enroll_images
    echo "Add face images to enroll_images/<person_name>/ directories"
fi

# 5. Check if we have any enrolled faces
if [ -f "face_db.pkl" ]; then
    echo -e "${GREEN}Face database exists.${NC}"
else
    echo -e "${GREEN}No face database found.${NC}"
    echo "To enroll faces:"
    echo "1. Create a folder in enroll_images/ with the person's name"
    echo "2. Add clear face photos to that folder"
    echo "3. Run: python auto_enrollment.py"
fi

# 6. Show usage
echo -e "\n${BLUE}Usage:${NC}"
echo "1. Enroll faces:     python auto_enrollment.py"
echo "2. Run recognition:   python recognition.py"
echo "3. Test mode:        python recognition.py --test --max-frames 30"
echo -e "\nPress 'q' in the camera window to quit recognition"