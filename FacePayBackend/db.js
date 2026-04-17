const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'facepay',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Create users table if it doesn't exist
const createUsersTable = async () => {
  try {
    // Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        phone_number VARCHAR(20) UNIQUE NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        bank_name VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        face_embedding TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table created or already exists');
    
    // Add or update columns as needed
    try {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS name VARCHAR(255);
      `);
    } catch (e) {
      // Column might already exist
    }
    
    // Drop and recreate face_embedding column if it's the wrong type
    try {
      const result = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'face_embedding'
      `);
      
      if (result.rows.length > 0 && result.rows[0].data_type !== 'text') {
        console.log('Converting face_embedding column to TEXT type...');
        await pool.query(`
          ALTER TABLE users 
          DROP COLUMN IF EXISTS face_embedding CASCADE
        `);
        await pool.query(`
          ALTER TABLE users 
          ADD COLUMN face_embedding TEXT
        `);
        console.log('Face embedding column converted to TEXT');
      }
    } catch (e) {
      console.log('Could not check/convert face_embedding column:', e.message);
    }
    
  } catch (error) {
    console.error('Error creating users table:', error);
  }
};

const createTransactionsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        bank_transaction_id_from INTEGER,
        bank_transaction_id_to INTEGER,
        face_match_similarity FLOAT,
        status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON transactions(receiver_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);`);
    console.log('Transactions table created or already exists');
  } catch (error) {
    console.error('Error creating transactions table:', error);
  }
};

createUsersTable();
createTransactionsTable();

module.exports = pool;
