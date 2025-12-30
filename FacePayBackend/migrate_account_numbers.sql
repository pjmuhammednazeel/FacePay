-- Migration: Convert account numbers back to numeric format
-- This script updates all user account numbers from ACC-#### format back to numeric (0001, 0002, 0003)
-- to match Bank API format

-- First, check current account numbers before migration
SELECT id, account_number FROM users;

-- Update account numbers back to numeric format
-- Handles:
--   ACC-0003 → 0003
--   ACC-123 → 0123
--   ACC-1 → 0001
UPDATE users
SET account_number = 
  CASE 
    -- Already numeric, keep as is
    WHEN account_number NOT LIKE 'ACC-%' THEN account_number
    -- Convert ACC-#### format back to numeric (4-digit padded)
    ELSE LPAD(REPLACE(account_number, 'ACC-', ''), 4, '0')
  END
WHERE account_number LIKE 'ACC-%';

-- Verify the migration
SELECT id, account_number FROM users;

-- If you need to rollback:
-- UPDATE users SET account_number = 'ACC-' || LPAD(account_number, 4, '0');
