# ArcFace Installation Guide

This guide will help you set up the ArcFace facial recognition system for FacePay.

## Prerequisites

- **Python 3.8+** installed and in PATH
- **Node.js 16+** and npm
- **Git** (optional)
- **Expo CLI** for mobile development
- At least **4GB RAM** for InsightFace model

## Quick Setup

### Windows Users

1. Open PowerShell or Command Prompt in the FacePay directory
2. Run the setup script:
```bash
.\setup_arcface.bat
```

### Linux/Mac Users

1. Open Terminal in the FacePay directory
2. Make the script executable:
```bash
chmod +x setup_arcface.sh
```
3. Run the setup script:
```bash
./setup_arcface.sh
```

## Manual Setup

If the automatic script doesn't work, follow these steps:

### 1. Backend Setup

```bash
cd FacePayBackend

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
npm install

# Create temp directory
mkdir temp

cd ..
```

### 2. Mobile Setup

```bash
cd FacePayMobile

# Install dependencies
npm install

cd ..
```

### 3. Configuration

#### Backend Configuration

Create or update `.env` file in `FacePayBackend/`:
```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/facepay
```

#### Mobile Configuration

Update `FacePayMobile/config/api.js`:
```javascript
// For local development
export const API_URL = 'http://192.168.1.x:3000/api';

// Replace 192.168.1.x with your computer's IP address
```

## Testing the Installation

### 1. Test Python InsightFace

```bash
cd FacePayBackend
python insightface_processor.py test_image.jpg
```

Expected output: JSON with face embedding

### 2. Test Backend Server

```bash
cd FacePayBackend
npm start
```

Visit `http://localhost:3000/api/health` - should return `{"status":"OK"}`

### 3. Test Mobile App

```bash
cd FacePayMobile
npm start
```

Scan QR code with Expo Go app

## Troubleshooting

### Python Import Errors

**Error**: `ModuleNotFoundError: No module named 'insightface'`

**Solution**:
```bash
pip install insightface --upgrade
```

### ONNX Runtime Issues

**Error**: `OSError: [WinError 126] The specified module could not be found`

**Solution**:
- Install Visual C++ Redistributable
- Or use: `pip install onnxruntime-gpu` (if you have CUDA)

### Memory Errors

**Error**: `MemoryError` when loading model

**Solution**:
- Close other applications
- Use smaller model: Change `buffalo_l` to `buffalo_s` in `insightface_processor.py`

### Expo Camera Not Working

**Error**: Camera permission denied or not working

**Solution**:
1. Rebuild the native app:
```bash
cd FacePayMobile
npx expo run:android
# or
npx expo run:ios
```

2. Grant camera permissions in device settings

### Backend Connection Failed

**Error**: `Network request failed` in mobile app

**Solution**:
1. Find your computer's IP address:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig` or `ip addr`

2. Update `FacePayMobile/config/api.js` with correct IP

3. Ensure backend is running and firewall allows connections

## Performance Optimization

### Use GPU Acceleration

If you have an NVIDIA GPU with CUDA:

1. Install CUDA Toolkit
2. Install GPU version:
```bash
pip install onnxruntime-gpu
```

3. Update `insightface_processor.py`:
```python
app = FaceAnalysis(name='buffalo_l', providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
```

### Reduce Model Size

For lower-end devices, use smaller model:

In `insightface_processor.py`:
```python
app = FaceAnalysis(name='buffalo_s', providers=['CPUExecutionProvider'])
```

## Database Schema

Ensure your database has the correct schema:

```sql
-- Face embedding column should support arrays
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS face_embedding FLOAT8[];

-- Or use JSONB for flexibility
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS face_embedding JSONB;
```

Run the schema update:
```bash
cd FacePayBackend
psql -U youruser -d facepay -f update_schema.sql
```

## Verification Steps

1. ✅ Python dependencies installed
2. ✅ Node dependencies installed (backend & mobile)
3. ✅ Database configured and running
4. ✅ Backend server starts without errors
5. ✅ Mobile app connects to backend
6. ✅ Camera works in mobile app
7. ✅ Face detection works in registration
8. ✅ Payment screen can scan faces

## Next Steps

After successful installation:

1. **Register Test Users**: Register at least 2 users with clear face photos
2. **Test Face Recognition**: Use Payment screen to scan second user's face
3. **Verify Accuracy**: Check similarity scores (should be > 0.5 for matches)
4. **Production Deployment**: Follow security best practices for production

## Support

For issues not covered here:
1. Check `ARCFACE_IMPLEMENTATION.md` for detailed architecture
2. Review server logs in `FacePayBackend`
3. Check mobile logs in Expo Dev Tools
4. Verify Python script output manually

## Additional Resources

- [InsightFace GitHub](https://github.com/deepinsight/insightface)
- [ONNX Runtime Documentation](https://onnxruntime.ai/)
- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)
