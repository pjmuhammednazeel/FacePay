# Fast Face Recognition Setup

## The Problem
Face recognition was taking **8 seconds** because the ArcFace model was loaded from disk on every request.

## The Solution
A persistent Python server that keeps the model loaded in memory, reducing recognition time to **under 1 second**.

## Quick Start

### Option 1: Automated (Recommended)
Run the startup script:
```batch
start_backend_fast.bat
```

This will:
1. Install axios (if needed)
2. Start InsightFace server (port 5001)
3. Start Node.js backend (port 3000)

### Option 2: Manual
Open **two separate terminals**:

**Terminal 1 - InsightFace Server:**
```bash
cd FacePayBackend
python insightface_server.py
```
Wait for: `✓ Model loaded and ready!`

**Terminal 2 - Node.js Backend:**
```bash
cd FacePayBackend
npm start
```

## Performance Comparison

| Method | Time per Request | Model Loading |
|--------|------------------|---------------|
| **Old (Process spawn)** | 8 seconds | Every request |
| **New (HTTP server)** | <1 second | Once at startup |

## Architecture

### Before (Slow):
```
Mobile → Node.js → Spawn Python Process → Load Model → Process → Exit
                    [8 seconds per request]
```

### After (Fast):
```
Mobile → Node.js → HTTP Request → Python Server (model in memory) → Response
                    [<1 second per request]
```

## Files Added

- `FacePayBackend/insightface_server.py` - Persistent Python HTTP server
- `start_backend_fast.bat` - Automated startup script

## Files Modified

- `FacePayBackend/insightFaceService.js` - Now uses HTTP requests instead of process spawning
- `FacePayBackend/package.json` - Added axios dependency

## Troubleshooting

### "Face recognition service unavailable"
- Make sure `insightface_server.py` is running
- Check if port 5001 is available
- Restart the Python server

### Model loading takes too long
- First startup takes 5-10 seconds (model loads once)
- Subsequent requests are instant (<1 second)

### Port already in use
Edit `insightface_server.py` line 156:
```python
PORT = 5001  # Change to another port
```

## Health Check

Check if the server is ready:
```bash
curl http://127.0.0.1:5001/health
```

Expected response:
```json
{
  "status": "ready",
  "model": "buffalo_l",
  "provider": "CPUExecutionProvider"
}
```

## Technical Details

- **Model**: InsightFace buffalo_l (ArcFace)
- **Detection Size**: 640x640 pixels
- **Embedding Dimensions**: 512
- **Server**: Threaded HTTP server (handles concurrent requests)
- **Communication**: REST API (JSON)

## Benefits

✓ **10x faster** face recognition
✓ No more 8-second delays
✓ Model loaded once, used many times
✓ Lower resource usage (no process spawning)
✓ Better user experience
