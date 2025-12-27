const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const pool = require('./db');
const { validateAccountAndPhone } = require('./bankApi');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// Registration endpoint
app.post('/api/register', async (req, res) => {
  const { phoneNumber, accountNumber, bankName, password, faceEmbedding } = req.body;

  // Validation
  if (!phoneNumber || !accountNumber || !bankName || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields are required' 
    });
  }

  if (!faceEmbedding || !Array.isArray(faceEmbedding)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Face embedding data is required' 
    });
  }

  try {
    // Validate account and phone with bank API
    const bankValidation = await validateAccountAndPhone(phoneNumber, accountNumber, bankName);
    
    if (!bankValidation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: bankValidation.message,
        bankValidation: false
      });
    }

    // Check if phone number already exists in FacePay
    const userExists = await pool.query(
      'SELECT * FROM users WHERE phone_number = $1',
      [phoneNumber]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number already registered in FacePay' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user with face embedding and name from bank
    const newUser = await pool.query(
      `INSERT INTO users (name, phone_number, account_number, bank_name, password_hash, face_embedding) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, phone_number, account_number, bank_name, created_at`,
      [bankValidation.accountDetails.name, phoneNumber, accountNumber, bankName, passwordHash, faceEmbedding]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully with facial embedding',
      bankValidation: true,
      accountHolder: bankValidation.accountDetails.name,
      user: newUser.rows[0]
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { phoneNumber, password } = req.body;

  if (!phoneNumber || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Phone number and password are required' 
    });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE phone_number = $1',
      [phoneNumber]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phone_number,
        accountNumber: user.account_number,
        bankName: user.bank_name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// Facial recognition login endpoint
app.post('/api/login-with-face', async (req, res) => {
  const { phoneNumber, faceEmbedding } = req.body;

  if (!phoneNumber || !faceEmbedding || !Array.isArray(faceEmbedding)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Phone number and face embedding are required' 
    });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE phone_number = $1',
      [phoneNumber]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = result.rows[0];
    const storedEmbedding = user.face_embedding;

    // Calculate similarity between embeddings
    const similarity = calculateCosineSimilarity(faceEmbedding, storedEmbedding);
    const threshold = 0.6; // Threshold for face match

    if (similarity < threshold) {
      return res.status(401).json({ 
        success: false, 
        message: 'Face does not match. Similarity: ' + similarity.toFixed(2),
        similarity: similarity
      });
    }

    res.json({
      success: true,
      message: 'Facial authentication successful',
      similarity: similarity,
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        accountNumber: user.account_number,
        bankName: user.bank_name
      }
    });

  } catch (error) {
    console.error('Facial recognition login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during facial recognition' 
    });
  }
});

// Calculate cosine similarity between two embeddings
function calculateCosineSimilarity(embedding1, embedding2) {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same length');
  }

  const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
  const magnitude1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
  const magnitude2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FacePay API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
