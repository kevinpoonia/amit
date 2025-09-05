-- Migration script to add recharge_balance column to users table
-- This script should be run on existing databases to add the new column

-- Add recharge_balance column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS recharge_balance DECIMAL(10, 2) DEFAULT 0.00;

-- Update existing users to have recharge_balance equal to their current balance
-- This is a one-time migration script to initialize the recharge_balance column for existing users
UPDATE users 
SET recharge_balance = balance
WHERE recharge_balance IS NULL OR recharge_balance = 0;

-- Add a comment to explain the purpose of the recharge_balance column
COMMENT ON COLUMN users.recharge_balance IS 'Tracks only recharge money, separate from profit money in the balance column';