-- Create admins table for FacePay admin authentication
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Insert default admin user (username: admin, password: 123)
INSERT INTO admins (username, password) 
VALUES ('admin', '123')
ON CONFLICT (username) DO NOTHING;

-- Verify admin was created
SELECT * FROM admins;

-- Usage: Run this SQL file in your facepay_db database
-- psql -d facepay_db -f create_admins_table.sql

