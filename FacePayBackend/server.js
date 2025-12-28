const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const pool = require('./db');
const { validateAccountAndPhone } = require('./bankApi');
const insightFaceService = require('./insightFaceService');
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
      [
        bankValidation.accountDetails.name, 
        phoneNumber, 
        accountNumber, 
        bankName, 
        passwordHash, 
        faceEmbedding ? JSON.stringify(faceEmbedding) : null
      ]
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

// Extract ArcFace embedding from image using InsightFace
app.post('/api/extract-arcface-embedding', async (req, res) => {
  console.log('=== Received extract-arcface-embedding request ===');
  const { image } = req.body;

  if (!image) {
    console.log('No image provided in request body');
    return res.status(400).json({
      success: false,
      message: 'Image data is required'
    });
  }

  try {
    console.log('Calling insightFaceService.extractEmbedding...');
    const embedding = await insightFaceService.extractEmbedding(image);
    console.log(`Successfully extracted embedding with ${embedding.length} dimensions`);
    console.log(`First 10 values: ${JSON.stringify(embedding.slice(0, 10))}`);
    
    const response = {
      success: true,
      embedding: embedding,
      dimension: embedding.length
    };
    
    console.log('Sending response...');
    res.json(response);
    console.log('Response sent successfully');
  } catch (error) {
    console.error('ArcFace embedding extraction error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extract face embedding: ' + error.message
    });
  }
});

// Identify receiver by face embedding
app.post('/api/identify-receiver', async (req, res) => {
  console.log('=== Received identify-receiver request ===');
  const { faceEmbedding, senderId } = req.body;
  console.log(`Embedding dimensions: ${faceEmbedding?.length || 'undefined'}`);
  console.log(`Sender ID: ${senderId}`);

  if (!faceEmbedding || !Array.isArray(faceEmbedding)) {
    console.log('Invalid embedding format');
    return res.status(400).json({
      success: false,
      message: 'Face embedding is required'
    });
  }

  try {
    // Get all users except the sender
    const usersQuery = senderId 
      ? 'SELECT id, name, phone_number, account_number, bank_name, face_embedding FROM users WHERE id != $1'
      : 'SELECT id, name, phone_number, account_number, bank_name, face_embedding FROM users';
    
    const params = senderId ? [senderId] : [];
    const users = await pool.query(usersQuery, params);
    console.log(`Found ${users.rows.length} users in database`);

    if (users.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No users found'
      });
    }

    // Find best matching face using ArcFace similarity
    const storedEmbeddings = users.rows.map(user => {
      // Parse embedding from database
      let embedding = user.face_embedding;
      if (typeof embedding === 'string') {
        try {
          embedding = JSON.parse(embedding);
        } catch (e) {
          console.warn(`Failed to parse embedding for user ${user.id}`);
          embedding = [];
        }
      }
      
      return {
        id: user.id,
        name: user.name,
        phoneNumber: user.phone_number,
        accountNumber: user.account_number,
        bankName: user.bank_name,
        embedding: embedding
      };
    });

    // Use higher threshold for ArcFace (0.5 is good for ArcFace)
    const bestMatch = insightFaceService.findBestMatch(faceEmbedding, storedEmbeddings, 0.5);
    console.log(`Best match: ${bestMatch ? bestMatch.name + ' (similarity: ' + bestMatch.similarity + ')' : 'none'}`);

    if (!bestMatch) {
      return res.status(404).json({
        success: false,
        message: 'No matching face found. Please ensure the receiver is registered.'
      });
    }

    console.log('Sending successful receiver identification response');
    res.json({
      success: true,
      message: 'Receiver identified successfully',
      receiver: {
        id: bestMatch.id,
        name: bestMatch.name,
        phoneNumber: bestMatch.phoneNumber,
        accountNumber: bestMatch.accountNumber,
        bankName: bestMatch.bankName,
        similarity: bestMatch.similarity
      }
    });

  } catch (error) {
    console.error('Receiver identification error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during face identification: ' + error.message
    });
  }
});

// Make payment endpoint
app.post('/api/make-payment', async (req, res) => {
  const { senderId, receiverId, amount } = req.body;

  if (!senderId || !receiverId || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Sender ID, receiver ID, and amount are required'
    });
  }

  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be greater than 0'
    });
  }

  if (senderId === receiverId) {
    return res.status(400).json({
      success: false,
      message: 'Cannot send payment to yourself'
    });
  }

  try {
    // Get sender and receiver information
    const sender = await pool.query('SELECT * FROM users WHERE id = $1', [senderId]);
    const receiver = await pool.query('SELECT * FROM users WHERE id = $1', [receiverId]);

    if (sender.rows.length === 0 || receiver.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sender or receiver not found'
      });
    }

    // In a real application, you would:
    // 1. Check sender's bank balance
    // 2. Initiate bank transfer via bank API
    // 3. Record transaction in database
    // 4. Send notifications

    // For now, we'll simulate a successful payment
    // You should create a transactions table to store payment history
    
    res.json({
      success: true,
      message: 'Payment processed successfully',
      transaction: {
        from: sender.rows[0].name,
        to: receiver.rows[0].name,
        amount: amount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during payment processing'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FacePay API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
