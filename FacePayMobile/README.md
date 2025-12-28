# FacePayMobile - ArcFace Edition

A React Native mobile app for FacePay payment system with **ArcFace facial recognition** powered by InsightFace.

## Features

- ✅ User registration with **ArcFace face embeddings**
- ✅ Password-based authentication
- ✅ **Face-based receiver identification** for payments
- ✅ Camera integration for live face capture
- ✅ Gallery image selection
- ✅ Real-time payment processing
- ✅ Bank account integration
- ✅ User dashboard with account information

## Prerequisites (Windows)

- **Node.js LTS** (recommended: 18.x or 20.x)
- **Expo Go** app installed on your iOS/Android device
- **Backend server** running with InsightFace (see FacePayBackend/README.md)

> Note: If you see errors with Node 22, switch to Node 18 or 20.

## Quick Setup

### Option 1: Automated Setup (Recommended)

**Windows:**
```powershell
cd "C:\Main Project\FacePay"
.\setup_arcface.bat
```

**Linux/Mac:**
```bash
cd /path/to/FacePay
chmod +x setup_arcface.sh
./setup_arcface.sh
```

### Option 2: Manual Setup

```powershell
Push-Location "C:\Main Project\FacePay\FacePayMobile"
npm install
Pop-Location
```

## Configuration

Update `config/api.js` with your backend server IP:

```javascript
// For localhost (Android emulator)
export const API_URL = 'http://10.0.2.2:3000/api';

// For physical device (find IP with ipconfig)
export const API_URL = 'http://192.168.1.x:3000/api';

// For iOS simulator
export const API_URL = 'http://localhost:3000/api';
```

**Find your IP:**
- Windows: `ipconfig`
- Mac/Linux: `ifconfig` or `ip addr`

## Run the app

```powershell
Push-Location "C:\Main Project\FacePay\FacePayMobile"
npm run start
Pop-Location
```

1. Scan the QR code with **Expo Go** app
2. Ensure backend server is running first
3. Grant camera permissions when prompted

## Project Structure

```
FacePayMobile/
├── App.js                    # Main app with navigation
├── screens/
│   ├── HomeScreen.js         # Landing page
│   ├── LoginScreen.js        # User login
│   ├── RegisterScreen.js     # User registration with face
│   ├── DashboardScreen.js    # User dashboard
│   └── PaymentScreen.js      # NEW: Face-based payment
├── utils/
│   └── faceEmbedding.js      # Face processing utilities
├── config/
│   └── api.js                # API configuration
└── assets/                   # App assets
```

## New Features: Face-Based Payments

### Payment Flow

1. **Login** to your account
2. Navigate to **Dashboard**
3. Click **"Scan Face - Receive Payment"**
4. **Capture** receiver's face or **select from gallery**
5. System **identifies receiver** using ArcFace
6. View **receiver details** and **confidence score**
7. Enter **payment amount**
8. Complete **payment**

### Camera Usage

The app requires camera permissions for:
- Face capture during registration
- Receiver identification during payments

**Grant permissions when prompted**

### PaymentScreen Features

- **Live Camera**: Front-facing camera for face capture
- **Gallery Selection**: Choose photo from device
- **Face Detection**: Automatic face detection with visual frame
- **Receiver Identification**: Real-time identification using ArcFace
- **Confidence Display**: Shows similarity score (0-100%)
- **Payment Processing**: Secure payment completion
- `app.json`: Expo config
- `babel.config.js`: Babel preset for Expo
- `package.json`: Scripts and dependencies

## Next steps
- Add JWT authentication tokens
- Implement payment functionality
- Add face recognition
- Create user dashboard
