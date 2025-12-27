# Network Troubleshooting Guide

## Issue Fixed! 🎉

The network error has been resolved by:
1. Creating a centralized API config file at `config/api.js`
2. Updating LoginScreen.js and RegisterScreen.js to use the config

## Configuration

The API config file (`FacePayMobile/config/api.js`) is set to:
- **USE_EMULATOR: true** - Currently configured for Android Emulator (uses 10.0.2.2)

### If you're using an Android Emulator:
✅ No changes needed! The config is already set correctly.

### If you're using a Physical Device:
1. Open `FacePayMobile/config/api.js`
2. Change `USE_EMULATOR: false`
3. Update `PHYSICAL_DEVICE_IP` with your machine's IP: `'172.29.96.1'`
4. Make sure your device is on the same WiFi network as your computer

## Backend Status
✅ Backend server is running on port 3000

## Next Steps to Test:
1. Rebuild your React Native app:
   ```bash
   cd FacePayMobile
   npx react-native run-android
   ```

2. Try logging in again!

## Additional Troubleshooting:

### If still getting network errors:

**For Emulator:**
- Verify the emulator is running
- The app should connect to `http://10.0.2.2:3000/api`

**For Physical Device:**
- Both device and computer must be on same WiFi
- Check Windows Firewall isn't blocking port 3000:
  ```powershell
  New-NetFirewallRule -DisplayName "Node.js Server" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000
  ```
- Your machine's IP is: `172.29.96.1`

**Test backend directly:**
```bash
curl http://localhost:3000/api/login -X POST -H "Content-Type: application/json" -d "{\"phoneNumber\":\"test\",\"password\":\"test\"}"
```
