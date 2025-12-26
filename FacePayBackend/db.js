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
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      phone_number VARCHAR(20) UNIQUE NOT NULL,
      account_number VARCHAR(50) NOT NULL,
      bank_name VARCHAR(100) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      face_embedding FLOAT8[] NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  try {
    await pool.query(query);
    console.log('Users table created or already exists');
  } catch (error) {
    console.error('Error creating users table:', error);
  }
};

createUsersTable();

module.exports = pool;
