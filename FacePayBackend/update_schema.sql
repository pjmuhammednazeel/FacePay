-- Add face_embedding column to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS face_embedding FLOAT8[];

-- Optionally remove the old facial_data column if it exists
ALTER TABLE users DROP COLUMN IF EXISTS facial_data;
