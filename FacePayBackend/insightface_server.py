#!/usr/bin/env python3
"""
Persistent InsightFace Server
Keeps the ArcFace model loaded in memory for fast face recognition
"""

import sys
import json
import os
import base64
import io
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

# Set environment to suppress debug output
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['ONNX_DISABLE_PROVIDER_REGISTRATION'] = '1'

# Suppress warnings
import warnings
warnings.filterwarnings('ignore')

# Import required libraries
import numpy as np
import cv2

# Suppress output during import
import contextlib
with contextlib.redirect_stderr(io.StringIO()), contextlib.redirect_stdout(io.StringIO()):
    from insightface.app import FaceAnalysis

# Global model instance (loaded once)
app = None
model_loaded = False

def load_model():
    """Load InsightFace model once at startup"""
    global app, model_loaded
    
    if model_loaded:
        return True
    
    try:
        print("Loading InsightFace buffalo_l model...", file=sys.stderr)
        app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
        app.prepare(ctx_id=0, det_size=(640, 640))
        model_loaded = True
        print("✓ Model loaded and ready!", file=sys.stderr)
        return True
    except Exception as e:
        print(f"✗ Failed to load model: {e}", file=sys.stderr)
        return False

def extract_embedding(image_data):
    """Extract face embedding from base64 image"""
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {'success': False, 'error': 'Failed to decode image'}
        
        # Detect faces (model already loaded)
        faces = app.get(img)
        
        if len(faces) == 0:
            return {'success': False, 'error': 'No face detected in image'}
        
        # Get largest face
        largest_face = max(faces, key=lambda x: (x.bbox[2] - x.bbox[0]) * (x.bbox[3] - x.bbox[1]))
        
        # Extract embedding
        embedding_list = largest_face.embedding.tolist()
        
        return {
            'success': True,
            'embedding': embedding_list,
            'num_faces': len(faces),
            'confidence': float(largest_face.det_score) if hasattr(largest_face, 'det_score') else 1.0
        }
        
    except Exception as e:
        return {'success': False, 'error': f'Processing error: {str(e)}'}

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Handle requests in separate threads"""
    daemon_threads = True

class InsightFaceHandler(BaseHTTPRequestHandler):
    """HTTP request handler for InsightFace operations"""
    
    def log_message(self, format, *args):
        """Suppress default HTTP logging"""
        pass
    
    def do_POST(self):
        """Handle POST requests"""
        if self.path == '/extract-embedding':
            try:
                # Read request body
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                request_json = json.loads(post_data.decode('utf-8'))
                
                # Extract embedding
                image_data = request_json.get('image', '')
                result = extract_embedding(image_data)
                
                # Send response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode('utf-8'))
                
            except Exception as e:
                # Error response
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_response = {'success': False, 'error': str(e)}
                self.wfile.write(json.dumps(error_response).encode('utf-8'))
        
        elif self.path == '/health':
            # Health check endpoint
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            health_status = {
                'status': 'ready' if model_loaded else 'loading',
                'model': 'buffalo_l',
                'provider': 'CPUExecutionProvider'
            }
            self.wfile.write(json.dumps(health_status).encode('utf-8'))
        
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            health_status = {
                'status': 'ready' if model_loaded else 'loading',
                'model': 'buffalo_l',
                'provider': 'CPUExecutionProvider'
            }
            self.wfile.write(json.dumps(health_status).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def main():
    """Start the persistent InsightFace server"""
    PORT = 5001
    
    print(f"Starting InsightFace server on port {PORT}...", file=sys.stderr)
    
    # Load model at startup
    if not load_model():
        print("Failed to load model. Exiting.", file=sys.stderr)
        sys.exit(1)
    
    # Start server
    server = ThreadedHTTPServer(('127.0.0.1', PORT), InsightFaceHandler)
    print(f"✓ InsightFace server running on http://127.0.0.1:{PORT}", file=sys.stderr)
    print("Ready to process face recognition requests...", file=sys.stderr)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...", file=sys.stderr)
        server.shutdown()
        sys.exit(0)

if __name__ == '__main__':
    main()
