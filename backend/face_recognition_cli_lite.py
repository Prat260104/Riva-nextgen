#!/usr/bin/env python3
import sys
import json
import argparse
from face_recognition_lite import get_lite_service

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--image', required=True, help='Base64 encoded image')
    args = parser.parse_args()
    
    service = get_lite_service()
    result = service.recognize_face(args.image)
    
    print(json.dumps(result))

if __name__ == '__main__':
    main()
