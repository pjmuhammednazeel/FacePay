# Quick Start Guide - ArcFace Facial Recognition

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Dependencies

**Windows:**
```bash
.\setup_arcface.bat
```

**Linux/Mac:**
```bash
chmod +x setup_arcface.sh && ./setup_arcface.sh
```

### Step 2: Configure

**Backend** - Create `FacePayBackend/.env`:
```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/facepay
```

**Mobile** - Update `FacePayMobile/config/api.js`:
```javascript
export const API_URL = 'http://YOUR_IP:3000/api';
```
Replace `YOUR_IP` with your computer's IP address (find with `ipconfig` on Windows or `ifconfig` on Mac/Linux)

### Step 3: Start Backend

```bash
cd FacePayBackend
npm start
```

Expected output: `Server is running on port 3000`

### Step 4: Start Mobile App

```bash
cd FacePayMobile
npm start
```

Scan QR code with Expo Go app on your phone.

## 📱 How to Use

### Register Users (Do this first!)

1. Open FacePay app
2. Click "Register"
3. Fill in details
4. Select a clear face photo
5. Wait for face embedding extraction
6. Complete registration

**Register at least 2 users to test payment flow**

### Make a Payment

1. Login as User 1
2. Click "Scan Face - Receive Payment"
3. Capture or select User 2's face photo
4. Wait for identification (2-3 seconds)
5. Verify receiver details and similarity score
6. Enter payment amount
7. Click "Make Payment"

## ✅ Verification

Test each step:

1. ✅ Backend health check: Visit `http://localhost:3000/api/health`
2. ✅ Mobile connects: App loads without errors
3. ✅ Registration works: Can register new user with face
4. ✅ Login works: Can login with credentials
5. ✅ Face scan works: Payment screen opens camera
6. ✅ Identification works: Receiver identified from face
7. ✅ Payment works: Payment completes successfully

## 🐛 Quick Troubleshooting

**"Module not found: insightface"**
```bash
pip install insightface
```

**"Camera not working"**
```bash
cd FacePayMobile
npx expo run:android
```

**"Network request failed"**
- Check backend is running on port 3000
- Update API_URL with correct IP address
- Ensure phone and computer on same network

**"No face detected"**
- Use good lighting
- Face should be frontal and clear
- Try a different photo

**"Low similarity score"**
- Use high-quality photos during registration
- Ensure same person in both photos
- Check lighting and face angle

## 📊 Expected Results

- **Similarity Score**: 0.5 - 0.9 for correct matches
- **Processing Time**: 1-3 seconds per face
- **Confidence**: >50% for valid matches

## 🎯 Tips for Best Results

1. **Registration Photos**:
   - Use clear, well-lit photos
   - Face should be frontal
   - No glasses or masks
   - High resolution

2. **Payment Scanning**:
   - Good lighting
   - Hold steady
   - Face directly toward camera
   - Remove glasses if possible

3. **Testing**:
   - Register 2-3 test users first
   - Use different photos for each
   - Test with various lighting
   - Verify similarity scores

## 📚 More Information

- **Full Documentation**: See `ARCFACE_IMPLEMENTATION.md`
- **Installation Guide**: See `INSTALLATION.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`

## 🆘 Still Having Issues?

1. Check server logs in terminal
2. Check mobile logs in Expo Dev Tools
3. Test Python script directly:
   ```bash
   cd FacePayBackend
   python insightface_processor.py path/to/image.jpg
   ```
4. Verify database connection
5. Check all dependencies installed

## 🎉 Success!

Once you see:
- ✅ Receiver identified with >50% similarity
- ✅ Payment completes successfully
- ✅ Transaction confirmation shown

Your ArcFace implementation is working correctly!

---

**Need Help?** Check the detailed guides:
- `INSTALLATION.md` - Complete setup instructions
- `ARCFACE_IMPLEMENTATION.md` - Technical architecture
- `IMPLEMENTATION_SUMMARY.md` - Full feature list
