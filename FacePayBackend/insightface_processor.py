#!/usr/bin/env python3
"""
InsightFace ArcFace Processor
This script processes face images and extracts ArcFace embeddings using InsightFace library
"""

import sys
import json
import os
import numpy as np
import cv2
import warnings
import subprocess

# Suppress all warnings
warnings.filterwarnings('ignore')

# Suppress TensorFlow/ONNX warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['ONNX_DISABLE_PROVIDER_REGISTRATION'] = '1'

# Redirect stderr to suppress debug messages
import io
sys.stderr = io.StringIO()

from insightface.app import FaceAnalysis

# Restore stderr
sys.stderr = sys.__stderr__

# Initialize InsightFace app with ArcFace model
app = None

def initialize_model():
    """Initialize the InsightFace model with ArcFace"""
    global app
    if app is None:
        # Suppress output during model initialization
        import logging
        logging.getLogger().setLevel(logging.CRITICAL)
        
        # Redirect stderr again during initialization
        stderr_backup = sys.stderr
        sys.stderr = io.StringIO()
        
        try:
            app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
            app.prepare(ctx_id=0, det_size=(640, 640))
        finally:
            sys.stderr = stderr_backup
    
    return app

def extract_face_embedding(image_path):
    """
    Extract face embedding from an image using ArcFace
    
    Args:
        image_path (str): Path to the image file
        
    Returns:
        dict: JSON response with embedding or error
    """
    try:
        # Initialize model
        model = initialize_model()
        
        # Read image
        img = cv2.imread(image_path)
        
        if img is None:
            return {
                'error': 'Failed to read image'
            }
        
        # Detect faces and extract embeddings
        faces = model.get(img)
        
        if len(faces) == 0:
            return {
                'error': 'No face detected in the image'
            }
        
        # Get the largest face (in case multiple faces are detected)
        largest_face = max(faces, key=lambda x: (x.bbox[2] - x.bbox[0]) * (x.bbox[3] - x.bbox[1]))
        
        # Extract embedding (512-dimensional vector for ArcFace)
        embedding = largest_face.embedding
        
        # Convert to list for JSON serialization
        embedding_list = embedding.tolist()
        
        # Get additional face information
        bbox = largest_face.bbox.tolist()
        det_score = float(largest_face.det_score)
        
        return {
            'success': True,
            'embedding': embedding_list,
            'bbox': bbox,
            'det_score': det_score,
            'num_faces': len(faces)
        }
        
    except Exception as e:
        return {
            'error': f'Error processing image: {str(e)}'
        }

def main():
    """Main function to process command line arguments"""
    if len(sys.argv) < 2:
        sys.stdout.write(json.dumps({'error': 'No image path provided'}))
        sys.stdout.flush()
        sys.exit(1)
    
    image_path = sys.argv[1]
    result = extract_face_embedding(image_path)
    
    # Output ONLY JSON, nothing else
    sys.stdout.write(json.dumps(result))
    sys.stdout.flush()
    
    # Exit with appropriate code
    if 'error' in result:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == '__main__':
    main()
