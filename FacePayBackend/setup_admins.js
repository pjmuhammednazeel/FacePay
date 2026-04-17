const pool = require('./db');

async function setup() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `);
    console.log('Admins table created (or already exists)');

    await pool.query(`
      INSERT INTO admins (username, password)
      VALUES ('admin', '123')
      ON CONFLICT (username) DO NOTHING;
    `);
    console.log('Default admin created: username=admin, password=123');

    const result = await pool.query('SELECT id, username FROM admins');
    console.log('All admins:', result.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

setup();
