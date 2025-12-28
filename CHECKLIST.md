# Installation Verification Checklist

Use this checklist to verify your FacePay ArcFace implementation is correctly set up.

## Pre-Installation Checks

- [ ] Node.js 16+ installed (`node --version`)
- [ ] Python 3.8+ installed (`python --version` or `python3 --version`)
- [ ] PostgreSQL 12+ installed and running
- [ ] pip installed (`pip --version` or `pip3 --version`)
- [ ] At least 4GB free RAM
- [ ] Stable internet connection (for model download)

## Installation Steps

### Backend Setup

- [ ] Navigated to FacePayBackend directory
- [ ] Ran `pip install -r requirements.txt`
- [ ] All Python packages installed successfully
- [ ] Ran `npm install` 
- [ ] All Node packages installed successfully
- [ ] Created `temp` directory
- [ ] Created `.env` file with database credentials
- [ ] Database `facepay` created in PostgreSQL
- [ ] Database schema updated (ran `update_schema.sql`)

### Mobile Setup

- [ ] Navigated to FacePayMobile directory
- [ ] Ran `npm install`
- [ ] All packages installed successfully
- [ ] Updated `config/api.js` with correct backend IP
- [ ] Installed Expo Go app on mobile device

## Verification Tests

### Python Environment

- [ ] Ran `python test_insightface.py` successfully
- [ ] All import tests passed ✓
- [ ] Model loading test passed ✓
- [ ] Face detection test passed ✓
- [ ] No error messages displayed

### Backend Server

- [ ] Started server with `npm start`
- [ ] Server running on port 3000
- [ ] No error messages in console
- [ ] Visited `http://localhost:3000/api/health`
- [ ] Received `{"status":"OK"}` response

### Database Connection

- [ ] Can connect to PostgreSQL database
- [ ] `users` table exists
- [ ] `face_embedding` column exists (FLOAT8[] or JSONB)
- [ ] Can insert test data

### Mobile App

- [ ] Started with `npm start`
- [ ] QR code displayed
- [ ] Scanned QR with Expo Go app
- [ ] App loaded successfully
- [ ] No red error screens
- [ ] Can see Home screen

## Feature Tests

### Registration Flow

- [ ] Opened registration screen
- [ ] Filled in all fields
- [ ] Selected face photo from gallery
- [ ] Face embedding extracted successfully
- [ ] Received success message
- [ ] User created in database
- [ ] Can see user in PostgreSQL (`SELECT * FROM users;`)

### Login Flow

- [ ] Opened login screen
- [ ] Entered registered phone and password
- [ ] Login successful
- [ ] Redirected to dashboard
- [ ] User details displayed correctly

### Dashboard

- [ ] Dashboard loads successfully
- [ ] Account information displayed
- [ ] Phone number shown
- [ ] Account number shown
- [ ] Bank name shown
- [ ] "Scan Face - Receive Payment" button visible

### Payment Flow (Requires 2+ registered users)

- [ ] Clicked "Scan Face - Receive Payment"
- [ ] Payment screen opened
- [ ] Camera permission granted
- [ ] Camera preview visible
- [ ] Captured face photo OR selected from gallery
- [ ] Face processing started (loading indicator)
- [ ] Receiver identified successfully
- [ ] Receiver name displayed
- [ ] Receiver account shown
- [ ] Similarity score shown (>50%)
- [ ] Entered payment amount
- [ ] Payment processed successfully
- [ ] Confirmation message displayed

### ArcFace Functionality

- [ ] Backend endpoint `/api/extract-arcface-embedding` works
- [ ] Returns 512-dimensional embedding
- [ ] Backend endpoint `/api/identify-receiver` works
- [ ] Correctly identifies registered users
- [ ] Similarity score >0.5 for correct matches
- [ ] Similarity score <0.5 for different people
- [ ] Backend endpoint `/api/make-payment` works

## Performance Checks

- [ ] First face processing: 2-5 seconds (acceptable)
- [ ] Subsequent processing: <2 seconds (good)
- [ ] Face detection works in various lighting
- [ ] App responsive, no freezing
- [ ] Server handles multiple requests

## Security Checks

- [ ] Passwords stored as hashes (not plain text)
- [ ] Face embeddings stored as arrays (not images)
- [ ] Cannot see actual face images in database
- [ ] CORS configured appropriately
- [ ] Database credentials not in code

## Troubleshooting (If any checks failed)

### Python Issues
```bash
pip install --upgrade insightface onnxruntime opencv-python numpy
python test_insightface.py
```

### Node/Backend Issues
```bash
cd FacePayBackend
rm -rf node_modules
npm install
npm start
```

### Mobile Issues
```bash
cd FacePayMobile
rm -rf node_modules
npm install
npx expo start --clear
```

### Database Issues
```bash
# Check if PostgreSQL is running
# Windows: services.msc, find PostgreSQL
# Linux/Mac: sudo systemctl status postgresql

# Test connection
psql -U postgres -d facepay -c "SELECT 1;"
```

### Camera Issues
```bash
cd FacePayMobile
# Rebuild native app
npx expo run:android
# or
npx expo run:ios
```

## Post-Installation Tasks

- [ ] Created at least 2 test user accounts
- [ ] Tested payment between users
- [ ] Verified similarity scores are accurate
- [ ] Documented any issues encountered
- [ ] Saved configuration settings
- [ ] Reviewed security best practices
- [ ] Read all documentation files

## Production Readiness (Optional)

- [ ] Environment variables configured for production
- [ ] Database credentials secured
- [ ] HTTPS enabled for backend
- [ ] Rate limiting implemented
- [ ] Error logging configured
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Load testing completed
- [ ] Security audit performed

## Final Verification

Run these commands for a final check:

### Backend Health
```bash
curl http://localhost:3000/api/health
# Expected: {"status":"OK","message":"FacePay API is running"}
```

### Python Script
```bash
cd FacePayBackend
python test_insightface.py
# Expected: "✅ ALL TESTS PASSED!"
```

### Database Query
```bash
psql -U postgres -d facepay -c "SELECT COUNT(*) FROM users;"
# Expected: Number of registered users
```

## Success Criteria

✅ All checks passed
✅ Can register users with face photos
✅ Can login to dashboard
✅ Can scan faces and identify receivers
✅ Can complete payment transactions
✅ Similarity scores >50% for matches
✅ No errors in logs

## If All Checks Pass

🎉 **Congratulations!** Your FacePay ArcFace implementation is working correctly!

You can now:
1. Test with more users
2. Experiment with different photos
3. Monitor performance
4. Plan production deployment

## Additional Resources

- **QUICKSTART.md** - Quick setup guide
- **INSTALLATION.md** - Detailed installation steps
- **ARCFACE_IMPLEMENTATION.md** - Technical documentation
- **README.md** - Project overview

## Notes Section

Use this space to note any issues or configurations specific to your setup:

```
Date: _______________
Setup By: _______________

Notes:
_______________________________________________
_______________________________________________
_______________________________________________

Issues Encountered:
_______________________________________________
_______________________________________________
_______________________________________________

Resolutions:
_______________________________________________
_______________________________________________
_______________________________________________
```

---

**Checklist Version:** 1.0
**Last Updated:** December 28, 2025
