# FacePayMobile (Expo)

A React Native mobile app for FacePay payment system with user registration and authentication.

## Features
- User Registration with phone number, bank account details, and password
- User Login with authentication
- Navigation between Home, Login, and Register screens
- Integration with PostgreSQL backend

## Prerequisites (Windows)
- Node.js LTS (recommended: 18.x or 20.x)
- Expo Go installed on your iOS/Android device
- Backend server running (see FacePayBackend/README.md)

> Note: If you see errors with Node 22, switch to Node 18 or 20.

## Install dependencies
```powershell
Push-Location "C:\Main Project\FacePay\FacePayMobile"
npm install
Pop-Location
```

## Configuration

### For Physical Devices
If testing on a physical device, update the API_URL in:
- `screens/RegisterScreen.js`
- `screens/LoginScreen.js`

Change from `http://localhost:3000/api` to `http://YOUR_COMPUTER_IP:3000/api`

Find your IP with `ipconfig` in PowerShell.

## Run the app
```powershell
Push-Location "C:\Main Project\FacePay\FacePayMobile"
npm run start
Pop-Location
```
- Scan the QR code with Expo Go
- Ensure backend server is running first

## Project structure
- `App.js`: Main app with navigation setup
- `screens/`: All screen components
  - `HomeScreen.js`: Landing page with login/register buttons
  - `LoginScreen.js`: User login form
  - `RegisterScreen.js`: User registration form
- `app.json`: Expo config
- `babel.config.js`: Babel preset for Expo
- `package.json`: Scripts and dependencies

## Next steps
- Add JWT authentication tokens
- Implement payment functionality
- Add face recognition
- Create user dashboard
