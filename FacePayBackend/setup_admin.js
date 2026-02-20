const bcrypt = require('bcryptjs');
const pool = require('./db');

async function setupAdminUser() {
  try {
    console.log('Setting up admin user...');

    // Create admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Admins table created/verified');

    // Hash the password '123'
    const password = '123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    console.log('✓ Password hashed');

    // Insert admin user
    await pool.query(
      `INSERT INTO admins (username, password_hash) 
       VALUES ($1, $2) 
       ON CONFLICT (username) 
       DO UPDATE SET password_hash = $2, updated_at = CURRENT_TIMESTAMP`,
      ['admin', passwordHash]
    );
    console.log('✓ Admin user created/updated');

    console.log('\n✅ Admin setup complete!');
    console.log('Username: admin');
    console.log('Password: 123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    process.exit(1);
  }
}

setupAdminUser();
