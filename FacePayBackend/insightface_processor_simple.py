#!/usr/bin/env python3
"""
InsightFace Processor Wrapper - Minimal version
This version suppresses all debug output from ONNX/InsightFace
"""

import sys
import json
import os

# Set environment to suppress debug output
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['ONNX_DISABLE_PROVIDER_REGISTRATION'] = '1'

# Suppress warnings
import warnings
warnings.filterwarnings('ignore')

# Suppress all output by redirecting stderr
import io
import contextlib

# Import required libraries
import numpy as np
import cv2

# Initialize global app variable
app = None
app_initialized = False

def get_app():
    """Lazy load the FaceAnalysis model"""
    global app, app_initialized
    
    if app is None and not app_initialized:
        try:
            # Suppress all output during import and initialization
            with contextlib.redirect_stderr(io.StringIO()), contextlib.redirect_stdout(io.StringIO()):
                from insightface.app import FaceAnalysis
                app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
                app.prepare(ctx_id=0, det_size=(640, 640))
            app_initialized = True
        except Exception as e:
            return None
    
    return app

def extract_embedding(image_path):
    """Extract face embedding from image"""
    try:
        # Get or initialize app
        model = get_app()
        if model is None:
            return {'error': 'Failed to initialize InsightFace model'}
        
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            return {'error': 'Failed to read image file'}
        
        # Detect and extract
        with contextlib.redirect_stderr(io.StringIO()), contextlib.redirect_stdout(io.StringIO()):
            faces = model.get(img)
        
        if len(faces) == 0:
            return {'error': 'No face detected in image'}
        
        # Get largest face
        largest_face = max(faces, key=lambda x: (x.bbox[2] - x.bbox[0]) * (x.bbox[3] - x.bbox[1]))
        
        # Extract embedding
        embedding_list = largest_face.embedding.tolist()
        
        return {
            'success': True,
            'embedding': embedding_list,
            'num_faces': len(faces)
        }
        
    except Exception as e:
        return {'error': f'Error: {str(e)}'}

def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        result = {'error': 'No image path provided'}
    else:
        result = extract_embedding(sys.argv[1])
    
    # Output ONLY JSON - no other text
    json.dump(result, sys.stdout)
    sys.stdout.flush()
    
    # Exit code
    sys.exit(0 if 'success' in result or 'error' in result else 1)

if __name__ == '__main__':
    main()
