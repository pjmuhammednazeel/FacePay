-- Create lightweight transactions table linking FacePay users to Bank API transactions
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

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_sender ON transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver ON transactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);

-- Display existing data if any
SELECT 'Transactions table created or already exists' AS status;
SELECT COUNT(*) AS transaction_count FROM transactions;
