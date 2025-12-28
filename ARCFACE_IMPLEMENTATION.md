# ArcFace Implementation with InsightFace

This document explains the ArcFace facial recognition implementation using InsightFace for the FacePay application.

## Overview

The implementation uses **InsightFace's ArcFace** model for high-accuracy facial recognition when scanning receiver faces for payments. ArcFace provides superior face recognition compared to basic embedding methods.

## Architecture

### Frontend (React Native)
- **PaymentScreen.js**: New screen for scanning receiver's face
- **faceEmbedding.js**: Updated to support ArcFace embedding extraction via backend API
- Uses Expo Camera for face capture

### Backend (Node.js + Python)
- **insightFaceService.js**: Node.js service that interfaces with Python
- **insightface_processor.py**: Python script using InsightFace library for face processing
- **server.js**: Updated with new API endpoints

## Features

1. **Face Detection**: Detects faces in images with high accuracy
2. **ArcFace Embeddings**: Extracts 512-dimensional face embeddings
3. **Face Matching**: Identifies receivers by comparing face embeddings
4. **Payment Flow**: Complete payment workflow after receiver identification

## Installation

### Backend Setup

1. **Install Python dependencies**:
```bash
cd FacePayBackend
pip install -r requirements.txt
```

2. **Install Node.js dependencies** (if not already done):
```bash
npm install
```

### Mobile Setup

1. **Install dependencies**:
```bash
cd FacePayMobile
npm install
```

2. **Ensure Expo Camera is properly configured** in your Android/iOS project

## API Endpoints

### 1. Extract ArcFace Embedding
```
POST /api/extract-arcface-embedding
Body: { image: "base64_encoded_image" }
Response: { success: true, embedding: [...], dimension: 512 }
```

### 2. Identify Receiver by Face
```
POST /api/identify-receiver
Body: { faceEmbedding: [...], senderId: 123 }
Response: { 
  success: true, 
  receiver: {
    id, name, phoneNumber, accountNumber, bankName, similarity
  }
}
```

### 3. Make Payment
```
POST /api/make-payment
Body: { senderId: 123, receiverId: 456, amount: 1000 }
Response: { success: true, transaction: {...} }
```

## How It Works

### 1. Face Scanning Flow
1. User opens Payment screen from Dashboard
2. Camera captures receiver's face
3. Image sent to backend for ArcFace processing
4. Backend extracts 512-dimensional embedding using InsightFace
5. Embedding compared against all registered users
6. Best match returned if similarity > 0.5 threshold

### 2. Payment Flow
1. Receiver identified successfully
2. User enters payment amount
3. Payment processed through backend
4. Transaction recorded and confirmation shown

## InsightFace Model Details

- **Model**: buffalo_l (Large model for better accuracy)
- **Embedding Dimension**: 512
- **Detection Size**: 640x640
- **Similarity Threshold**: 0.5 (adjustable)
- **Provider**: CPU (can be changed to GPU if available)

## Configuration

### Adjust Similarity Threshold
In `server.js` endpoint `/api/identify-receiver`:
```javascript
const bestMatch = insightFaceService.findBestMatch(faceEmbedding, storedEmbeddings, 0.5);
// Change 0.5 to desired threshold (0.3-0.7 recommended)
```

### Use GPU Acceleration (Optional)
In `insightface_processor.py`:
```python
app = FaceAnalysis(name='buffalo_l', providers=['CUDAExecutionProvider'])
```

## Troubleshooting

### Python Script Errors
- Ensure Python is in system PATH
- Verify all dependencies installed: `pip list | grep insightface`
- Check Python version: Python 3.8+ required

### No Face Detected
- Ensure good lighting
- Face should be clearly visible and frontal
- Try adjusting detection size in Python script

### Low Similarity Scores
- Ensure high-quality images during registration
- Check lighting conditions during capture
- Consider lowering threshold (not recommended below 0.3)

### Performance Issues
- Consider using GPU provider for faster processing
- Implement caching for frequently accessed embeddings
- Optimize image resolution before processing

## Security Considerations

1. **Data Privacy**: Face embeddings are stored securely in database
2. **Threshold**: Adjust based on security requirements
3. **Liveness Detection**: Consider adding anti-spoofing measures
4. **Encryption**: Ensure HTTPS for API communication

## Future Enhancements

1. **Liveness Detection**: Add blink detection or 3D face analysis
2. **Multiple Faces**: Handle scenarios with multiple people
3. **Face Quality Check**: Validate image quality before processing
4. **Caching**: Cache embeddings for faster matching
5. **GPU Support**: Implement GPU acceleration for production
6. **Transaction History**: Add transaction logging and history

## Resources

- [InsightFace Documentation](https://github.com/deepinsight/insightface)
- [ArcFace Paper](https://arxiv.org/abs/1801.07698)
- [ONNX Runtime](https://onnxruntime.ai/)

## Notes

- First-time model loading may take a few seconds
- Ensure adequate server resources for face processing
- Consider implementing rate limiting for API endpoints
- Monitor server logs for processing errors
