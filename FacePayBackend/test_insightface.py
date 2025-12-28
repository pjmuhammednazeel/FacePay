#!/usr/bin/env python3
"""
Test script to verify InsightFace installation and functionality
Run this to ensure your Python environment is correctly set up
"""

import sys

def test_imports():
    """Test if all required modules can be imported"""
    print("Testing imports...")
    
    try:
        import numpy
        print("✓ numpy imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import numpy: {e}")
        return False
    
    try:
        import cv2
        print("✓ opencv-python imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import cv2: {e}")
        return False
    
    try:
        import onnxruntime
        print("✓ onnxruntime imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import onnxruntime: {e}")
        return False
    
    try:
        import insightface
        print("✓ insightface imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import insightface: {e}")
        return False
    
    return True

def test_model_loading():
    """Test if InsightFace model can be loaded"""
    print("\nTesting model loading...")
    
    try:
        from insightface.app import FaceAnalysis
        
        print("Initializing FaceAnalysis (this may take a moment)...")
        app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
        
        print("Preparing model...")
        app.prepare(ctx_id=0, det_size=(640, 640))
        
        print("✓ Model loaded successfully!")
        return True
        
    except Exception as e:
        print(f"✗ Failed to load model: {e}")
        return False

def test_face_detection():
    """Test face detection on a sample image if available"""
    print("\nTesting face detection...")
    
    try:
        import cv2
        import numpy as np
        from insightface.app import FaceAnalysis
        
        # Create a test image (black square)
        test_img = np.zeros((640, 640, 3), dtype=np.uint8)
        
        app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
        app.prepare(ctx_id=0, det_size=(640, 640))
        
        # Try to detect faces (should find none in black image)
        faces = app.get(test_img)
        
        print(f"✓ Face detection works (found {len(faces)} faces in test image)")
        return True
        
    except Exception as e:
        print(f"✗ Face detection failed: {e}")
        return False

def print_system_info():
    """Print system information"""
    print("\n" + "="*50)
    print("System Information")
    print("="*50)
    
    print(f"Python version: {sys.version}")
    
    try:
        import numpy
        print(f"NumPy version: {numpy.__version__}")
    except:
        pass
    
    try:
        import cv2
        print(f"OpenCV version: {cv2.__version__}")
    except:
        pass
    
    try:
        import onnxruntime
        print(f"ONNX Runtime version: {onnxruntime.__version__}")
    except:
        pass
    
    try:
        import insightface
        print(f"InsightFace version: {insightface.__version__}")
    except:
        pass

def main():
    """Main test function"""
    print("="*50)
    print("InsightFace Installation Test")
    print("="*50)
    print()
    
    print_system_info()
    print()
    
    # Test imports
    if not test_imports():
        print("\n❌ Import test failed. Please install missing dependencies:")
        print("   pip install -r requirements.txt")
        return 1
    
    # Test model loading
    if not test_model_loading():
        print("\n❌ Model loading failed. This could be due to:")
        print("   - Insufficient memory")
        print("   - Network issues (first time downloads model)")
        print("   - Missing ONNX runtime dependencies")
        return 1
    
    # Test face detection
    if not test_face_detection():
        print("\n❌ Face detection test failed.")
        return 1
    
    print("\n" + "="*50)
    print("✅ ALL TESTS PASSED!")
    print("="*50)
    print("\nYour InsightFace setup is working correctly.")
    print("You can now run the FacePay backend server.")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
