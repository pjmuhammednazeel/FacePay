# FacePay - Secure Payment System with ArcFace Recognition

A mobile payment application that uses **ArcFace facial recognition** powered by InsightFace for secure, biometric-based transactions.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![Node](https://img.shields.io/badge/node-16+-green.svg)
![React Native](https://img.shields.io/badge/react--native-0.81-61dafb.svg)

## 🚀 Features

### Core Functionality
- 🔐 **Biometric Authentication**: ArcFace face recognition with 512-dimensional embeddings
- 💳 **Face-Based Payments**: Identify receivers by scanning their face
- 🏦 **Bank Integration**: Validate accounts with banking APIs
- 📱 **Mobile App**: React Native app with Expo
- 🖥️ **Backend API**: Node.js + Express + PostgreSQL
- 🤖 **AI Processing**: InsightFace ArcFace model for face recognition

### Security Features
- High-accuracy face matching (>50% similarity threshold)
- Encrypted password storage with bcrypt
- Secure face embedding storage
- Bank account validation
- Transaction verification

## 📋 Prerequisites

- **Node.js** 16+ and npm
- **Python** 3.8+ with pip
- **PostgreSQL** 12+
- **Expo Go** app on mobile device
- **4GB RAM** minimum for InsightFace

## ⚡ Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd FacePay
```

### 2. Automated Setup

**Windows:**
```bash
.\setup_arcface.bat
```

**Linux/Mac:**
```bash
chmod +x setup_arcface.sh
./setup_arcface.sh
```

### 3. Configure Environment

**Backend** - Create `FacePayBackend/.env`:
```env
PORT=3000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=facepay
DB_PASSWORD=your_password
DB_PORT=5432
```

**Mobile** - Update `FacePayMobile/config/api.js`:
```javascript
export const API_URL = 'http://YOUR_IP:3000/api';
```

### 4. Start Services

**Terminal 1 - Backend:**
```bash
cd FacePayBackend
npm start
```

**Terminal 2 - Mobile:**
```bash
cd FacePayMobile
npm start
```

Scan QR code with Expo Go app.

## 📱 How to Use

### Register Users
1. Open FacePay app
2. Click "Register"
3. Enter phone, account, bank details
4. Select clear face photo
5. Wait for ArcFace embedding extraction
6. Complete registration

### Make Payment
1. Login to your account
2. Open Dashboard
3. Click "Scan Face - Receive Payment"
4. Capture receiver's face (camera or gallery)
5. System identifies receiver with confidence score
6. Enter payment amount
7. Confirm payment

## 🏗️ Architecture

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Backend API    │
│  (Node.js)      │
└────────┬────────┘
         │
    ┌────┴─────┐
    ▼          ▼
┌─────────┐ ┌──────────────┐
│  PostgreSQL│ │ InsightFace  │
│  Database  │ │ (Python)     │
└─────────┘ └──────────────┘
```

## 📁 Project Structure

```
FacePay/
├── FacePayBackend/              # Backend API
│   ├── server.js                # Express server
│   ├── insightFaceService.js    # Face recognition service
│   ├── insightface_processor.py # ArcFace processing
│   ├── db.js                    # Database connection
│   ├── bankApi.js               # Bank validation
│   ├── requirements.txt         # Python dependencies
│   └── package.json             # Node dependencies
│
├── FacePayMobile/               # Mobile app
│   ├── App.js                   # Main navigation
│   ├── screens/                 # App screens
│   │   ├── HomeScreen.js
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── DashboardScreen.js
│   │   └── PaymentScreen.js     # NEW: Face payment
│   ├── utils/
│   │   └── faceEmbedding.js     # Face utilities
│   └── config/
│       └── api.js               # API configuration
│
├── QUICKSTART.md                # Quick start guide
├── INSTALLATION.md              # Detailed setup
├── ARCFACE_IMPLEMENTATION.md    # Technical docs
├── IMPLEMENTATION_SUMMARY.md    # Feature summary
├── setup_arcface.sh             # Linux/Mac setup
└── setup_arcface.bat            # Windows setup
```

## 🔧 API Endpoints

### Authentication
- `POST /api/register` - Register user with face embedding
- `POST /api/login` - Login with credentials
- `POST /api/login-with-face` - Login with face (legacy)

### ArcFace Operations
- `POST /api/extract-arcface-embedding` - Extract face embedding
- `POST /api/identify-receiver` - Identify user by face
- `POST /api/make-payment` - Process payment

### System
- `GET /api/health` - Health check

## 🧪 Testing

### Test Backend Setup
```bash
cd FacePayBackend
python test_insightface.py
```

### Test API
```bash
curl http://localhost:3000/api/health
```

### Test Mobile
1. Ensure backend running
2. Start mobile app
3. Register test users
4. Test payment flow

## 📊 Performance

- **Face Detection**: 1-2 seconds
- **Embedding Extraction**: 512-dimensional vector
- **Identification**: <500ms (100 users)
- **Similarity Threshold**: 0.5 (50%)
- **Accuracy**: High (ArcFace model)

## 🔒 Security

- **Face Embeddings**: 512-dimensional, non-reversible
- **Passwords**: Bcrypt hashed (10 rounds)
- **Similarity Threshold**: 50% minimum for match
- **SQL Injection**: Protected with parameterized queries
- **CORS**: Configurable for production

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[INSTALLATION.md](INSTALLATION.md)** - Detailed installation guide
- **[ARCFACE_IMPLEMENTATION.md](ARCFACE_IMPLEMENTATION.md)** - Technical architecture
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Complete feature list
- **[FacePayBackend/README.md](FacePayBackend/README.md)** - Backend documentation
- **[FacePayMobile/README.md](FacePayMobile/README.md)** - Mobile app documentation

## 🐛 Troubleshooting

### Python Import Errors
```bash
pip install -r FacePayBackend/requirements.txt
```

### Camera Not Working
```bash
cd FacePayMobile
npx expo run:android
```

### Connection Failed
- Check backend is running on port 3000
- Update API_URL with correct IP
- Ensure same network for phone and computer

### No Face Detected
- Use good lighting
- Face should be frontal and clear
- Try different photo

See [INSTALLATION.md](INSTALLATION.md) for more troubleshooting.

## 🚀 Production Deployment

### Recommendations
1. Use HTTPS for all endpoints
2. Implement rate limiting
3. Enable GPU acceleration
4. Add monitoring and logging
5. Implement liveness detection
6. Set up database backups
7. Use environment-specific configs

### Performance Optimization
- Use GPU for face processing
- Implement embedding caching
- Optimize database queries
- Use CDN for static assets

## 🔮 Future Enhancements

- [ ] Liveness detection (anti-spoofing)
- [ ] Multiple face handling
- [ ] Transaction history
- [ ] Push notifications
- [ ] QR code backup option
- [ ] Biometric 2FA
- [ ] Analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [InsightFace](https://github.com/deepinsight/insightface) - Face recognition models
- [ArcFace Paper](https://arxiv.org/abs/1801.07698) - Face recognition algorithm
- [Expo](https://expo.dev/) - React Native framework
- [PostgreSQL](https://www.postgresql.org/) - Database

## 📞 Support

For issues or questions:
1. Check documentation files
2. Review troubleshooting section
3. Check server and mobile logs
4. Test Python script independently

## 🎯 Tech Stack

**Frontend:**
- React Native (0.81.5)
- Expo SDK (~54.0)
- React Navigation
- Expo Camera

**Backend:**
- Node.js (16+)
- Express.js
- PostgreSQL
- Python 3.8+

**AI/ML:**
- InsightFace (0.7.3)
- ONNX Runtime
- OpenCV
- ArcFace Model (buffalo_l)

---

**Made with ❤️ for secure, biometric payments**
