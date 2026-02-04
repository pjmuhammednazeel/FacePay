const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const pool = require('./db');
const { validateAccountAndPhone, getAccountBalance, initiateTransfer } = require('./bankApi');
const insightFaceService = require('./insightFaceService');
const livenessDetectionService = require('./livenessDetectionService');
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
  const { senderId, receiverId, amount, faceSimilarity } = req.body;

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

    const senderData = sender.rows[0];
    const receiverData = receiver.rows[0];

    console.log(`Processing payment: ${senderData.name} (${senderData.account_number}) -> ${receiverData.name} (${receiverData.account_number}), Amount: ₹${amount}`);

    // Check sender's account balance with bank API
    console.log(`Checking balance for account: ${senderData.account_number}`);
    const balanceCheck = await getAccountBalance(senderData.account_number);
    console.log('Balance check result:', balanceCheck);
    
    if (!balanceCheck.valid || balanceCheck.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient funds in account'
      });
    }

    // Initiate transfer through bank API
    console.log(`Initiating transfer from ${senderData.account_number} to ${receiverData.account_number}`);
    const transferResult = await initiateTransfer(
      senderData.account_number,
      receiverData.account_number,
      amount
    );
    console.log('Transfer result:', transferResult);

    // Store transaction in FacePay DB (best-effort)
    try {
      await pool.query(
        `INSERT INTO transactions (sender_id, receiver_id, amount, face_match_similarity, status)
         VALUES ($1, $2, $3, $4, $5)`
        , [senderId, receiverId, amount, faceSimilarity || null, 'completed']
      );
    } catch (dbError) {
      console.warn('Failed to store transaction record:', dbError.message);
    }

    // Return bank API transaction data
    console.log('Payment processed successfully');
    
    res.json({
      success: true,
      message: 'Payment processed successfully via face recognition',
      transaction: {
        from: senderData.name,
        fromAccount: senderData.account_number,
        to: receiverData.name,
        toAccount: receiverData.account_number,
        amount: amount,
        faceSimilarity: faceSimilarity,
        bankTransactionIdFrom: transferResult.raw?.from_transaction?.id,
        bankTransactionIdTo: transferResult.raw?.to_transaction?.id,
        senderNewBalance: transferResult.raw?.from_account?.balance,
        receiverNewBalance: transferResult.raw?.to_account?.balance,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Payment error:', error.message);
    
    // Determine if it's a bank API error or internal error
    const isBankError = error.message.includes('bank') || error.message.includes('transfer');
    
    res.status(isBankError ? 402 : 500).json({
      success: false,
      message: error.message || 'Server error during payment processing',
      errorType: isBankError ? 'bank_error' : 'server_error'
    });
  }
});

// Transactions listing endpoint
app.get('/api/transactions', async (req, res) => {
  const { userId, limit = 50, offset = 0 } = req.query;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'userId is required'
    });
  }

  try {
    const result = await pool.query(
      `SELECT 
         t.id,
         t.amount,
         t.status,
         t.created_at,
         t.face_match_similarity,
         s.id AS sender_id,
         s.name AS sender_name,
         s.account_number AS sender_account,
         s.bank_name AS sender_bank,
         r.id AS receiver_id,
         r.name AS receiver_name,
         r.account_number AS receiver_account,
         r.bank_name AS receiver_bank
       FROM transactions t
       JOIN users s ON t.sender_id = s.id
       JOIN users r ON t.receiver_id = r.id
       WHERE t.sender_id = $1 OR t.receiver_id = $1
       ORDER BY t.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, Number(limit), Number(offset)]
    );

    res.json({
      success: true,
      transactions: result.rows
    });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
});

// Liveness Detection endpoint
// Detects if a face is from a live person or spoofed (photo, video, mask, etc.)
app.post('/api/detect-liveness', async (req, res) => {
  console.log('=== Received detect-liveness request ===');
  const { image } = req.body;

  if (!image) {
    console.log('No image provided in request body');
    return res.status(400).json({
      success: false,
      message: 'Image data is required'
    });
  }

  try {
    console.log('Calling livenessDetectionService.detectLiveness...');
    const livenessResult = await livenessDetectionService.detectLiveness(image);
    
    if (!livenessResult.success) {
      console.warn('Liveness detection failed:', livenessResult.error);
      return res.status(400).json({
        success: false,
        message: livenessResult.error || 'Liveness detection failed'
      });
    }

    console.log(`Liveness score: ${livenessResult.liveness_score.toFixed(2)}, Is Live: ${livenessResult.is_live}`);
    
    res.json({
      success: true,
      message: 'Liveness detection completed',
      liveness_score: livenessResult.liveness_score,
      is_live: livenessResult.is_live,
      confidence: livenessResult.confidence,
      details: livenessResult.details
    });

  } catch (error) {
    console.error('Liveness detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during liveness detection'
    });
  }
});

// Verify Liveness with Threshold endpoint
// More strict liveness verification for sensitive operations
app.post('/api/verify-liveness', async (req, res) => {
  console.log('=== Received verify-liveness request ===');
  const { image, threshold = 0.5 } = req.body;

  if (!image) {
    console.log('No image provided in request body');
    return res.status(400).json({
      success: false,
      verified: false,
      message: 'Image data is required'
    });
  }

  try {
    console.log(`Calling livenessDetectionService.verifyLiveness with threshold: ${threshold}...`);
    const verificationResult = await livenessDetectionService.verifyLiveness(image, threshold);
    
    if (!verificationResult.success) {
      console.warn('Liveness verification failed:', verificationResult.error);
      return res.status(400).json({
        success: false,
        verified: false,
        message: verificationResult.error || 'Liveness verification failed'
      });
    }

    console.log(`Verification result: verified=${verificationResult.verified}, liveness_score=${verificationResult.liveness_score.toFixed(2)}`);
    
    res.json({
      success: true,
      verified: verificationResult.verified,
      message: verificationResult.message,
      liveness_score: verificationResult.liveness_score,
      is_live: verificationResult.is_live,
      confidence: verificationResult.confidence,
      threshold: verificationResult.threshold,
      details: verificationResult.details
    });

  } catch (error) {
    console.error('Liveness verification error:', error);
    res.status(500).json({
      success: false,
      verified: false,
      message: 'Server error during liveness verification'
    });
  }
});

// Change Password endpoint
app.post('/api/change-password', async (req, res) => {
  const { phoneNumber, currentPassword, newPassword } = req.body;

  if (!phoneNumber || !currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Phone number, current password, and new password are required'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters'
    });
  }

  try {
    // Find user by phone number
    const userResult = await pool.query(
      'SELECT * FROM users WHERE phone_number = $1',
      [phoneNumber]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, user.id]
    );

    console.log(`Password changed for user: ${phoneNumber}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change'
    });
  }
});

// Extract ArcFace Embedding with Liveness Check endpoint
// Combines embedding extraction with liveness detection
app.post('/api/extract-embedding-with-liveness', async (req, res) => {
  console.log('=== Received extract-embedding-with-liveness request ===');
  const { image, liveness_threshold = 0.5 } = req.body;

  if (!image) {
    console.log('No image provided in request body');
    return res.status(400).json({
      success: false,
      message: 'Image data is required'
    });
  }

  try {
    // First, check liveness
    console.log('Step 1: Checking liveness...');
    const livenessResult = await livenessDetectionService.verifyLiveness(image, liveness_threshold);
    
    if (!livenessResult.verified) {
      console.warn('Liveness verification failed');
      return res.status(400).json({
        success: false,
        message: 'Face is not live. Liveness verification failed.',
        liveness_verified: false,
        liveness_score: livenessResult.liveness_score
      });
    }

    console.log('Step 2: Liveness verified. Extracting embedding...');
    
    // If liveness check passed, extract embedding
    const embedding = await insightFaceService.extractEmbedding(image);
    
    console.log(`Successfully extracted embedding with ${embedding.length} dimensions`);
    
    res.json({
      success: true,
      message: 'Embedding extracted and liveness verified',
      embedding: embedding,
      liveness_verified: true,
      liveness_score: livenessResult.liveness_score,
      liveness_details: livenessResult.details
    });

  } catch (error) {
    console.error('Error in extract-embedding-with-liveness:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during embedding extraction with liveness check'
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
