-- ==========================================
-- Investment Platform - Complete Database Schema
-- ==========================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) UNIQUE NOT NULL,
  product_revenue_wallet DECIMAL(10, 2) DEFAULT 0.00,
  withdrawable_wallet DECIMAL(10, 2) DEFAULT 0.00,
  is_admin BOOLEAN DEFAULT FALSE,
  referred_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create product_plans table
CREATE TABLE IF NOT EXISTS product_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  price DECIMAL(10, 2) NOT NULL,
  daily_income DECIMAL(10, 2) NOT NULL,
  total_return DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create investments table
CREATE TABLE IF NOT EXISTS investments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  plan_id INTEGER,
  plan_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  purchase_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active',
  days_left INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  gst_amount DECIMAL(10, 2) NOT NULL,
  net_amount DECIMAL(10, 2) NOT NULL,
  method VARCHAR(50) NOT NULL, -- 'bank' or 'upi'
  details TEXT NOT NULL,
  request_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  processed_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create recharges table
CREATE TABLE IF NOT EXISTS recharges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  utr VARCHAR(255) NOT NULL,
  request_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  processed_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create balance_adjustments table for admin actions
CREATE TABLE IF NOT EXISTS balance_adjustments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  admin_id INTEGER REFERENCES users(id),
  adjustment_date TIMESTAMP DEFAULT NOW()
);

-- Create daily_profits table to track processed daily profits
CREATE TABLE IF NOT EXISTS daily_profits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  investment_id INTEGER REFERENCES investments(id),
  amount DECIMAL(10, 2) NOT NULL,
  processed_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample product plans
INSERT INTO product_plans (name, category, price, daily_income, total_return, duration_days) VALUES
('Starter Plan', 'beginner', 490.00, 80.00, 720.00, 9),
('Smart Saver', 'beginner', 750.00, 85.00, 1190.00, 14),
('Bronze Booster', 'intermediate', 1000.00, 100.00, 1500.00, 15),
('Silver Growth', 'intermediate', 1500.00, 115.00, 2300.00, 20),
('Gold Income', 'advanced', 2000.00, 135.00, 3105.00, 23),
('Platinum Plan', 'advanced', 2500.00, 160.00, 3840.00, 24),
('Elite Earning', 'premium', 3000.00, 180.00, 4500.00, 25),
('VIP Profiter', 'premium', 3500.00, 200.00, 5400.00, 27),
('Executive Growth', 'premium', 4000.00, 220.00, 6160.00, 28),
('Royal Investor', 'premium', 5000.00, 250.00, 7500.00, 30);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_purchase_date ON investments(purchase_date);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_request_date ON withdrawals(request_date);
CREATE INDEX IF NOT EXISTS idx_recharges_user_id ON recharges(user_id);
CREATE INDEX IF NOT EXISTS idx_recharges_request_date ON recharges(request_date);
CREATE INDEX IF NOT EXISTS idx_daily_profits_user_id ON daily_profits(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_profits_investment_id ON daily_profits(investment_id);
CREATE INDEX IF NOT EXISTS idx_daily_profits_processed_date ON daily_profits(processed_date);

-- Create function to increment user product revenue wallet
CREATE OR REPLACE FUNCTION increment_user_product_revenue_wallet(user_id INTEGER, amount DECIMAL)
RETURNS VOID AS $
BEGIN
  UPDATE users
  SET product_revenue_wallet = product_revenue_wallet + amount
  WHERE id = user_id;
END;
$ LANGUAGE plpgsql;

-- Create function to increment user withdrawable wallet
CREATE OR REPLACE FUNCTION increment_user_withdrawable_wallet(user_id INTEGER, amount DECIMAL)
RETURNS VOID AS $
BEGIN
  UPDATE users
  SET withdrawable_wallet = withdrawable_wallet + amount
  WHERE id = user_id;
END;
$ LANGUAGE plpgsql;

-- Create function to decrement user withdrawable wallet
CREATE OR REPLACE FUNCTION decrement_user_withdrawable_wallet(user_id INTEGER, amount DECIMAL)
RETURNS BOOLEAN AS $
DECLARE
  current_balance DECIMAL;
BEGIN
  SELECT withdrawable_wallet INTO current_balance FROM users WHERE id = user_id;
  
  IF current_balance >= amount THEN
    UPDATE users
    SET withdrawable_wallet = withdrawable_wallet - amount
    WHERE id = user_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$ LANGUAGE plpgsql;

-- Update existing investments to have days_left value based on their plan
-- This is a one-time migration script to populate the days_left column for existing investments
UPDATE investments 
SET days_left = product_plans.duration_days
FROM product_plans 
WHERE investments.plan_id = product_plans.id 
AND investments.days_left IS NULL;