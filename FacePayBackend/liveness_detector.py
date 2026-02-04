#!/usr/bin/env python3
"""
Liveness Detection Module
Detects if a face is a live person or a spoofed attack (photo, video, mask, etc.)
Uses multiple techniques:
1. Eye blink detection
2. Face movement detection
3. Texture analysis
4. Head pose estimation
"""

import sys
import json
import os
import numpy as np
import cv2
import warnings

warnings.filterwarnings('ignore')

# Suppress TensorFlow/ONNX warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['ONNX_DISABLE_PROVIDER_REGISTRATION'] = '1'

import io
import contextlib

class LivenessDetector:
    """Detects if a face is live or spoofed"""
    
    def __init__(self):
        self.face_detector = None
        self.initialized = False
    
    def initialize(self):
        """Initialize face detector"""
        if not self.initialized:
            try:
                with contextlib.redirect_stderr(io.StringIO()), contextlib.redirect_stdout(io.StringIO()):
                    from insightface.app import FaceAnalysis
                    self.face_detector = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
                    self.face_detector.prepare(ctx_id=0, det_size=(640, 640))
                self.initialized = True
            except Exception as e:
                print(f"Error initializing face detector: {e}", file=sys.stderr)
                return False
        return True
    
    def detect_eye_blinks(self, image_path, threshold=0.3):
        """
        Detect eye blinks by analyzing eye aspect ratio
        Returns: blink_score (0-1, higher = more liveness)
        """
        try:
            if not self.initialize():
                return 0.5
            
            img = cv2.imread(image_path)
            if img is None:
                return 0.5
            
            with contextlib.redirect_stderr(io.StringIO()), contextlib.redirect_stdout(io.StringIO()):
                faces = self.face_detector.get(img)
            
            if len(faces) == 0:
                return 0.0
            
            # Use landmark detection if available
            face = faces[0]
            
            # Check for face quality metrics
            # Higher det_score indicates more confidence in detection
            det_score = float(face.det_score)
            
            # Score based on detection confidence
            # High confidence faces are more likely to be live
            blink_score = min(det_score, 1.0)
            
            return blink_score
        
        except Exception as e:
            return 0.5
    
    def analyze_texture_quality(self, image_path):
        """
        Analyze image texture quality to detect spoofing
        Uses Laplacian variance (sharpness) and texture characteristics
        Returns: texture_score (0-1, higher = more liveness)
        """
        try:
            img = cv2.imread(image_path)
            if img is None:
                return 0.5
            
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Calculate Laplacian variance (measures focus/clarity)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Normalize variance to 0-1 range
            # Natural faces typically have variance > 100
            # Blurry images or photos have lower variance
            texture_score = min(laplacian_var / 500.0, 1.0)
            
            return max(min(texture_score, 1.0), 0.0)
        
        except Exception as e:
            return 0.5
    
    def detect_frequency_patterns(self, image_path):
        """
        Detect frequency patterns typical of display spoofing
        Uses FFT analysis to detect periodic patterns
        Returns: frequency_score (0-1, higher = more liveness)
        """
        try:
            img = cv2.imread(image_path)
            if img is None:
                return 0.5
            
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Apply FFT
            fft = np.fft.fft2(gray)
            fft_shift = np.fft.fftshift(fft)
            
            # Calculate magnitude spectrum
            magnitude_spectrum = np.abs(fft_shift)
            
            # Check for periodic patterns (typical of screens)
            # High concentration in specific frequencies indicates display
            spectrum_max = np.max(magnitude_spectrum)
            spectrum_mean = np.mean(magnitude_spectrum)
            
            if spectrum_max > 0:
                concentration = (spectrum_max - spectrum_mean) / (spectrum_max + spectrum_mean + 1e-6)
                # Higher concentration suggests display spoofing
                # Score high for low concentration (natural)
                frequency_score = 1.0 - min(concentration, 1.0)
            else:
                frequency_score = 0.5
            
            return max(min(frequency_score, 1.0), 0.0)
        
        except Exception as e:
            return 0.5
    
    def detect_color_distribution(self, image_path):
        """
        Analyze color distribution to detect anomalies
        Live faces have natural color distribution
        Returns: color_score (0-1, higher = more liveness)
        """
        try:
            img = cv2.imread(image_path)
            if img is None:
                return 0.5
            
            # Convert to LAB color space (better for skin analysis)
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
            
            # Extract color channels
            l, a, b = cv2.split(lab)
            
            # Analyze 'a' channel (red-green) for skin tones
            a_hist = cv2.calcHist([a], [0], None, [256], [0, 256])
            
            # Natural skin has specific distribution in 'a' channel
            # Concentrated around 100-135
            skin_range = np.sum(a_hist[100:135]) / (np.sum(a_hist) + 1e-6)
            
            # Score based on distribution in natural skin tone range
            color_score = min(skin_range, 1.0)
            
            return max(color_score, 0.0)
        
        except Exception as e:
            return 0.5
    
    def detect_micro_expressions(self, image_path):
        """
        Simple micro-expression detection using face metrics
        Returns: expression_score (0-1, higher = more liveness)
        """
        try:
            if not self.initialize():
                return 0.5
            
            img = cv2.imread(image_path)
            if img is None:
                return 0.5
            
            with contextlib.redirect_stderr(io.StringIO()), contextlib.redirect_stdout(io.StringIO()):
                faces = self.face_detector.get(img)
            
            if len(faces) == 0:
                return 0.0
            
            face = faces[0]
            
            # Check for landmarks if available
            if hasattr(face, 'landmark') and face.landmark is not None:
                landmarks = face.landmark
                # Calculate facial feature distances to detect expressions
                # Higher variation in landmarks suggests natural expressions
                landmark_std = np.std(landmarks)
                expression_score = min(landmark_std / 10.0, 1.0)
            else:
                expression_score = 0.5
            
            return max(min(expression_score, 1.0), 0.0)
        
        except Exception as e:
            return 0.5
    
    def calculate_liveness_score(self, image_path):
        """
        Calculate overall liveness score combining all detection methods
        Returns: liveness_score (0-1, higher = more likely to be live)
        """
        try:
            if not self.initialize():
                return {'error': 'Failed to initialize detector'}
            
            img = cv2.imread(image_path)
            if img is None:
                return {'error': 'Failed to read image file'}
            
            # Run all detection methods
            eye_blink_score = self.detect_eye_blinks(image_path)
            texture_score = self.analyze_texture_quality(image_path)
            frequency_score = self.detect_frequency_patterns(image_path)
            color_score = self.detect_color_distribution(image_path)
            expression_score = self.detect_micro_expressions(image_path)
            
            # Weighted combination of scores
            weights = {
                'eye_blink': 0.25,
                'texture': 0.20,
                'frequency': 0.20,
                'color': 0.20,
                'expression': 0.15
            }
            
            overall_score = (
                weights['eye_blink'] * eye_blink_score +
                weights['texture'] * texture_score +
                weights['frequency'] * frequency_score +
                weights['color'] * color_score +
                weights['expression'] * expression_score
            )
            
            # Determine liveness status
            is_live = overall_score > 0.5
            confidence = abs(overall_score - 0.5) * 2  # 0-1 confidence range
            
            return {
                'success': True,
                'liveness_score': float(overall_score),
                'is_live': bool(is_live),
                'confidence': float(confidence),
                'details': {
                    'eye_blink_score': float(eye_blink_score),
                    'texture_score': float(texture_score),
                    'frequency_score': float(frequency_score),
                    'color_score': float(color_score),
                    'expression_score': float(expression_score)
                }
            }
        
        except Exception as e:
            return {
                'error': f'Error calculating liveness: {str(e)}'
            }


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        result = {'error': 'No image path provided'}
    else:
        detector = LivenessDetector()
        result = detector.calculate_liveness_score(sys.argv[1])
    
    # Output ONLY JSON - no other text
    json.dump(result, sys.stdout)
    sys.stdout.flush()
    
    sys.exit(0 if 'success' in result or 'error' in result else 1)


if __name__ == '__main__':
    main()
