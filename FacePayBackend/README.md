# FacePay Backend - ArcFace Edition

Backend API for FacePay mobile application with **ArcFace facial recognition** powered by InsightFace.

## Features

- ✅ User registration with facial recognition
- ✅ Password-based authentication
- ✅ **ArcFace face embeddings** (512-dimensional vectors)
- ✅ Face-based receiver identification
- ✅ Payment processing with facial verification
- ✅ Bank account validation
- ✅ PostgreSQL database integration

## Prerequisites

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **Python 3.8+** (for InsightFace)
- **pip** (Python package manager)

## Quick Setup

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
cd ..
.\setup_arcface.bat
```

**Linux/Mac:**
```bash
cd ..
chmod +x setup_arcface.sh
./setup_arcface.sh
```

### Option 2: Manual Setup

1. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

2. **Install Node.js dependencies:**
```bash
npm install
```

3. **Create temp directory:**
```bash
mkdir temp
```

4. **Create PostgreSQL database:**
```sql
CREATE DATABASE facepay;
```

5. **Run database schema:**
```bash
psql -U postgres -d facepay -f update_schema.sql
```

6. **Create `.env` file:**
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=facepay
DB_PASSWORD=your_password_here
DB_PORT=5432
PORT=3000
```

7. **Test InsightFace installation:**
```bash
python test_insightface.py
```

8. **Start the server:**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication

#### POST /api/register
Register a new user with face embedding.

**Request:**
```json
{
  "phoneNumber": "1234567890",
  "accountNumber": "ACC123456",
  "bankName": "Example Bank",
  "password": "securepassword",
  "faceEmbedding": [/* 512 float values */]
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully with facial embedding",
  "user": { /* user details */ }
}
```

#### POST /api/login
Login with phone number and password.

**Request:**
```json
{
  "phoneNumber": "1234567890",
  "password": "securepassword"
}
```

#### POST /api/login-with-face
Login using facial recognition (legacy endpoint).

### ArcFace Endpoints (NEW)

#### POST /api/extract-arcface-embedding
Extract face embedding from image using ArcFace model.

**Request:**
```json
{
  "image": "base64_encoded_image_string"
}
```

**Response:**
```json
{
  "success": true,
  "embedding": [/* 512 float values */],
  "dimension": 512
}
```

#### POST /api/identify-receiver
Identify receiver by face embedding.

**Request:**
```json
{
  "faceEmbedding": [/* 512 float values */],
  "senderId": 1
}
```

**Response:**
```json
{
  "success": true,
  "receiver": {
    "id": 2,
    "name": "John Doe",
    "phoneNumber": "9876543210",
    "accountNumber": "ACC789012",
    "bankName": "Example Bank",
    "similarity": 0.87
  }
}
```

#### POST /api/make-payment
Process payment between sender and receiver.

**Request:**
```json
{
  "senderId": 1,
  "receiverId": 2,
  "amount": 1000
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "from": "Sender Name",
    "to": "Receiver Name",
    "amount": 1000,
    "timestamp": "2025-12-28T10:30:00.000Z"
  }
}
```

#### GET /api/health
Health check endpoint.

## Database Schema

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    face_embedding FLOAT8[],  -- 512-dimensional ArcFace embedding
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Architecture

### Face Recognition Pipeline

1. **Image Capture** (Mobile) → Base64 encoding
2. **Backend receives** image data
3. **Python Script** (`insightface_processor.py`) processes with InsightFace
4. **ArcFace Model** extracts 512-dimensional embedding
5. **Similarity Calculation** using cosine similarity
6. **Best Match** selection with threshold filtering
7. **Response** with identified user and confidence score

### Components

- **server.js** - Express API server
- **insightFaceService.js** - Node.js service layer
- **insightface_processor.py** - Python ArcFace processor
- **db.js** - PostgreSQL database connection
- **bankApi.js** - Bank validation service

## Configuration

### Similarity Threshold

Default threshold is **0.5** (50% similarity). Adjust in `server.js`:

```javascript
const bestMatch = insightFaceService.findBestMatch(
  faceEmbedding, 
  storedEmbeddings, 
  0.5  // Change this value
);
```

Recommended ranges:
- **High Security**: 0.6 - 0.7
- **Balanced**: 0.5 (default)
- **Lenient**: 0.3 - 0.4 (not recommended for production)

### GPU Acceleration (Optional)

To use GPU for faster processing, update `insightface_processor.py`:

```python
app = FaceAnalysis(
    name='buffalo_l', 
    providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
)
```

Requires:
- NVIDIA GPU with CUDA
- `pip install onnxruntime-gpu`

## Testing

### Test InsightFace Setup
```bash
python test_insightface.py
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:3000/api/health

# Extract embedding (requires base64 image)
curl -X POST http://localhost:3000/api/extract-arcface-embedding \
  -H "Content-Type: application/json" \
  -d '{"image":"base64_string_here"}'
```

## Troubleshooting

### Python Script Fails
- Ensure Python 3.8+ is installed and in PATH
- Run: `pip install -r requirements.txt`
- Test: `python test_insightface.py`

### Model Download Issues
- First run downloads ~500MB model from InsightFace
- Ensure stable internet connection
- Check firewall settings

### Memory Issues
- InsightFace requires ~2GB RAM
- Use smaller model: Change `buffalo_l` to `buffalo_s` in Python script

### Face Detection Fails
- Ensure good lighting in images
- Face should be frontal and clearly visible
- Check image quality and resolution

## Performance

- **First Request**: 2-5 seconds (model loading)
- **Subsequent Requests**: <1 second (CPU), <0.1 second (GPU)
- **Embedding Dimension**: 512 floats
- **Memory Usage**: ~500MB (model) + ~100MB (Node.js)

## Security

- Passwords hashed with bcrypt (10 rounds)
- Face embeddings stored as float arrays (not reversible to images)
- SQL injection protection via parameterized queries
- CORS enabled (configure for production)

## Documentation

- **QUICKSTART.md** - Quick start guide
- **INSTALLATION.md** - Detailed installation steps
- **ARCFACE_IMPLEMENTATION.md** - Technical architecture
- **IMPLEMENTATION_SUMMARY.md** - Complete feature list

## Production Deployment

1. Use HTTPS for all API endpoints
2. Implement rate limiting
3. Enable GPU acceleration for better performance
4. Set up monitoring and logging
5. Implement database backups
6. Add transaction logging
7. Consider liveness detection for anti-spoofing

## License

MIT
Register a new user.

**Request Body:**
```json
{
  "phoneNumber": "1234567890",
  "accountNumber": "1234567890",
  "bankName": "Bank Name",
  "password": "securepassword"
}
```

### POST /api/login
Login with phone number and password.

**Request Body:**
```json
{
  "phoneNumber": "1234567890",
  "password": "securepassword"
}
```

### GET /api/health
Check API health status.
