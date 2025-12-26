# FacePay - Complete Setup Guide

This guide will help you set up the complete FacePay system with mobile app and backend.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Expo CLI
- Android/iOS device or emulator

## Backend Setup

### 1. Install PostgreSQL
Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)

### 2. Create Database
Open PostgreSQL command line (psql) and run:
```sql
CREATE DATABASE facepay;
```

### 3. Set Up Backend
```powershell
cd FacePayBackend
npm install
```

### 4. Configure Environment
Create a `.env` file in the `FacePayBackend` directory:
```
PORT=3000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=facepay
DB_PASSWORD=your_actual_password_here
DB_PORT=5432
```

Replace `your_actual_password_here` with your PostgreSQL password.

### 5. Start Backend Server
```powershell
npm start
```

The server will run on `http://localhost:3000` and automatically create the users table.

## Mobile App Setup

### 1. Install Dependencies
```powershell
cd FacePayMobile
npm install
```

### 2. Start Mobile App
```powershell
npm start
```

### 3. Run on Device/Emulator
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on physical device

## Important Notes

### For Physical Devices
If testing on a physical device, you need to update the API_URL in both:
- `FacePayMobile/screens/RegisterScreen.js`
- `FacePayMobile/screens/LoginScreen.js`

Change from:
```javascript
const API_URL = 'http://localhost:3000/api';
```

To your computer's local IP:
```javascript
const API_URL = 'http://YOUR_COMPUTER_IP:3000/api';
```

Find your IP:
- Windows: Run `ipconfig` in PowerShell
- Look for "IPv4 Address" under your active network adapter

### Testing the System

1. Start the backend server first
2. Start the mobile app
3. Navigate to Register screen
4. Fill in the registration form:
   - Phone Number: Your phone number
   - Account Number: Your bank account number
   - Bank Name: Your bank name
   - Password: Create a secure password
5. Click Register
6. After successful registration, login with your credentials

## Database Schema

The system creates a `users` table with the following structure:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### POST /api/register
Register a new user

**Request:**
```json
{
  "phoneNumber": "1234567890",
  "accountNumber": "1234567890",
  "bankName": "Example Bank",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "phone_number": "1234567890",
    "account_number": "1234567890",
    "bank_name": "Example Bank",
    "created_at": "2025-12-26T..."
  }
}
```

### POST /api/login
Login with credentials

**Request:**
```json
{
  "phoneNumber": "1234567890",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "phoneNumber": "1234567890",
    "accountNumber": "1234567890",
    "bankName": "Example Bank"
  }
}
```

## Troubleshooting

### Backend Issues
- **Database connection error**: Check PostgreSQL is running and credentials in `.env` are correct
- **Port already in use**: Change PORT in `.env` file
- **Module not found**: Run `npm install` in FacePayBackend directory

### Mobile App Issues
- **Cannot connect to server**: 
  - Check backend is running
  - Update API_URL with correct IP address
  - Ensure device and computer are on same network
- **Navigation errors**: Clear cache with `npx expo start -c`

## Security Notes

- Passwords are hashed using bcrypt before storing
- Never commit `.env` file to version control
- Use strong passwords for PostgreSQL
- In production, use environment variables and HTTPS
- Add input validation and sanitization for production use

## Next Steps

After basic registration/login is working, you can:
1. Add user authentication tokens (JWT)
2. Implement payment functionality
3. Add face recognition for authentication
4. Create a user dashboard
5. Add transaction history
6. Implement payment processing
