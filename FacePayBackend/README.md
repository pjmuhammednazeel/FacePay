# FacePay Backend

Backend API for FacePay mobile application.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create PostgreSQL database:
```sql
CREATE DATABASE facepay;
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your PostgreSQL credentials:
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=facepay
DB_PASSWORD=your_password_here
DB_PORT=5432
PORT=3000
```

5. Run the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### POST /api/register
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
