-- Fix permissions for admins table
-- Run this in pgAdmin connected to facepay_db database

-- Grant all privileges on the admins table to facepay_user
GRANT ALL PRIVILEGES ON TABLE admins TO facepay_user;

-- Grant usage and select on the sequence for the id column
GRANT USAGE, SELECT ON SEQUENCE admins_id_seq TO facepay_user;

-- Grant all privileges on all tables in the public schema (for safety)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO facepay_user;

-- Grant all privileges on all sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO facepay_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO facepay_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO facepay_user;

-- Verify permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name='admins';
