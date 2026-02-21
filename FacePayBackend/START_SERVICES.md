# Starting FacePay Services

## Quick Start

### 1. Start the Python Face Recognition Service (REQUIRED FIRST)
```bash
cd FacePayBackend
python insightface_server.py
```

**Wait for this message:** `✓ Model loaded and ready!`

This service:
- Loads the ArcFace model once and keeps it in memory
- Reduces face recognition time from **8 seconds to <1 second**
- Must be running before starting the Node backend

---

### 2. Start the Node.js Backend (in a new terminal)
```bash
cd FacePayBackend
npm start
```

**Wait for:** `Server listening on port 3000`

---

### 3. Start the Mobile App (in a new terminal)
```bash
cd FacePayMobile
npm start
```

Then press `a` for Android or `i` for iOS

---

## Service Health Checks

**Python Service (Port 5001):**
```bash
curl http://127.0.0.1:5001/health
# Should return: {"status": "ready", "model": "buffalo_l", "provider": "CPUExecutionProvider"}
```

**Node Backend (Port 3000):**
```bash
curl http://127.0.0.1:3000/api/health
# Should return: {"status":"OK","message":"FacePay API is running"}
```

---

## Performance

**Before (spawning Python each time):**
- Face scan time: **~8 seconds**
- Model loaded every request

**After (persistent Python service):**
- Face scan time: **<1 second** ⚡
- Model loaded once, kept in memory

---

## Troubleshooting

**"Face recognition service unavailable"**
- Make sure Python service is running first
- Check: `python insightface_server.py`

**"InsightFace server not responding"**
- Verify port 5001 is not in use: `netstat -ano | findstr 5001`
- Restart Python service

**Slow recognition (>2 seconds)**
- Python service might not be running
- Check health: `curl http://127.0.0.1:5001/health`
