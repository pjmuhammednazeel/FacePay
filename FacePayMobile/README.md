# FacePayMobile (Expo)

A minimal React Native app using Expo with a single Home screen.

## Prerequisites (Windows)
- Node.js LTS (recommended: 18.x or 20.x)
- Expo Go installed on your iOS/Android device

> Note: If you see errors with Node 22, switch to Node 18 or 20.

## Install dependencies
```powershell
Push-Location "C:\Main Project\FacePay\FacePayMobile"
npm install
Pop-Location
```

## Run the app
```powershell
Push-Location "C:\Main Project\FacePay\FacePayMobile"
npm run start
Pop-Location
```
- Scan the QR code with Expo Go.

## Project structure
- `App.js`: Home screen UI
- `app.json`: Expo config
- `babel.config.js`: Babel preset for Expo
- `package.json`: Scripts and dependencies

## Next steps
- Add navigation (expo-router or React Navigation)
- Add Login and Register screens
