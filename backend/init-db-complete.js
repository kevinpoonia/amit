const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_API_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function initializeDatabase() {
  try {
    console.log('Initializing database tables...');
    
    // Create users table
    const { error: usersError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          mobile VARCHAR(20),
          balance DECIMAL(10, 2) DEFAULT 0.00,
          recharge_balance DECIMAL(10, 2) DEFAULT 0.00,
          is_admin BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
    });
    
    if (usersError) {
      console.error('Error creating users table:', usersError);
    } else {
      console.log('Users table created successfully');
    }
    
    // Create product_plans table
    const { error: plansError } = await supabase.rpc('execute_sql', {
      sql: `
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
      `
    });
    
    if (plansError) {
      console.error('Error creating product_plans table:', plansError);
    } else {
      console.log('Product plans table created successfully');
    }
    
    // Create investments table
    const { error: investmentsError } = await supabase.rpc('execute_sql', {
      sql: `
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
      `
    });
    
    if (investmentsError) {
      console.error('Error creating investments table:', investmentsError);
    } else {
      console.log('Investments table created successfully');
    }
    
    // Create withdrawals table
    const { error: withdrawalsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS withdrawals (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          amount DECIMAL(10, 2) NOT NULL,
          gst_amount DECIMAL(10, 2) NOT NULL,
          net_amount DECIMAL(10, 2) NOT NULL,
          method VARCHAR(50) NOT NULL,
          details TEXT NOT NULL,
          request_date TIMESTAMP DEFAULT NOW(),
          status VARCHAR(50) DEFAULT 'pending',
          processed_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });
    
    if (withdrawalsError) {
      console.error('Error creating withdrawals table:', withdrawalsError);
    } else {
      console.log('Withdrawals table created successfully');
    }
    
    // Create recharges table
    const { error: rechargesError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS recharges (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          amount DECIMAL(10, 2) NOT NULL,
          utr VARCHAR(255) NOT NULL,
          request_date TIMESTAMP DEFAULT NOW(),
          status VARCHAR(50) DEFAULT 'pending',
          processed_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });
    
    if (rechargesError) {
      console.error('Error creating recharges table:', rechargesError);
    } else {
      console.log('Recharges table created successfully');
    }
    
    // Create balance_adjustments table
    const { error: adjustmentsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS balance_adjustments (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          amount DECIMAL(10, 2) NOT NULL,
          reason TEXT NOT NULL,
          admin_id INTEGER REFERENCES users(id),
          adjustment_date TIMESTAMP DEFAULT NOW()
        );
      `
    });
    
    if (adjustmentsError) {
      console.error('Error creating balance_adjustments table:', adjustmentsError);
    } else {
      console.log('Balance adjustments table created successfully');
    }
    
    // Create daily_profits table
    const { error: dailyProfitsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS daily_profits (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          investment_id INTEGER REFERENCES investments(id),
          amount DECIMAL(10, 2) NOT NULL,
          processed_date TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });
    
    if (dailyProfitsError) {
      console.error('Error creating daily_profits table:', dailyProfitsError);
    } else {
      console.log('Daily profits table created successfully');
    }
    
    // Insert sample product plans
    const { error: insertError } = await supabase
      .from('product_plans')
      .upsert([
        { id: 1, name: 'Starter Plan', category: 'beginner', price: 490.00, daily_income: 80.00, total_return: 720.00, duration_days: 9 },
        { id: 2, name: 'Smart Saver', category: 'beginner', price: 750.00, daily_income: 85.00, total_return: 1190.00, duration_days: 14 },
        { id: 3, name: 'Bronze Booster', category: 'intermediate', price: 1000.00, daily_income: 100.00, total_return: 1500.00, duration_days: 15 },
        { id: 4, name: 'Silver Growth', category: 'intermediate', price: 1500.00, daily_income: 115.00, total_return: 2300.00, duration_days: 20 },
        { id: 5, name: 'Gold Income', category: 'advanced', price: 2000.00, daily_income: 135.00, total_return: 3105.00, duration_days: 23 },
        { id: 6, name: 'Platinum Plan', category: 'advanced', price: 2500.00, daily_income: 160.00, total_return: 3840.00, duration_days: 24 },
        { id: 7, name: 'Elite Earning', category: 'premium', price: 3000.00, daily_income: 180.00, total_return: 4500.00, duration_days: 25 },
        { id: 8, name: 'VIP Profiter', category: 'premium', price: 3500.00, daily_income: 200.00, total_return: 5400.00, duration_days: 27 },
        { id: 9, name: 'Executive Growth', category: 'premium', price: 4000.00, daily_income: 220.00, total_return: 6160.00, duration_days: 28 },
        { id: 10, name: 'Royal Investor', category: 'premium', price: 5000.00, daily_income: 250.00, total_return: 7500.00, duration_days: 30 }
      ], { onConflict: 'id' });
    
    if (insertError) {
      console.error('Error inserting sample product plans:', insertError);
    } else {
      console.log('Sample product plans inserted successfully');
    }
    
    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
      'CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_recharges_user_id ON recharges(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_investments_purchase_date ON investments(purchase_date);',
      'CREATE INDEX IF NOT EXISTS idx_withdrawals_request_date ON withdrawals(request_date);',
      'CREATE INDEX IF NOT EXISTS idx_recharges_request_date ON recharges(request_date);',
      'CREATE INDEX IF NOT EXISTS idx_daily_profits_user_id ON daily_profits(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_daily_profits_investment_id ON daily_profits(investment_id);',
      'CREATE INDEX IF NOT EXISTS idx_daily_profits_processed_date ON daily_profits(processed_date);'
    ];
    
    for (const indexSql of indexes) {
      const { error: indexError } = await supabase.rpc('execute_sql', { sql: indexSql });
      if (indexError) {
        console.error(`Error creating index: ${indexSql}`, indexError);
      } else {
        console.log(`Index created successfully: ${indexSql}`);
      }
    }
    
    // Create functions
    const functions = [
      `CREATE OR REPLACE FUNCTION increment_user_balance(user_id INTEGER, amount DECIMAL)
      RETURNS VOID AS $$
      BEGIN
        UPDATE users
        SET balance = balance + amount
        WHERE id = user_id;
      END;
      $$ LANGUAGE plpgsql;`,
      
      `CREATE OR REPLACE FUNCTION decrement_user_balance(user_id INTEGER, amount DECIMAL)
      RETURNS BOOLEAN AS $$
      DECLARE
        current_balance DECIMAL;
      BEGIN
        SELECT balance INTO current_balance FROM users WHERE id = user_id;
        
        IF current_balance >= amount THEN
          UPDATE users
          SET balance = balance - amount
          WHERE id = user_id;
          RETURN TRUE;
        ELSE
          RETURN FALSE;
        END IF;
      END;
      $$ LANGUAGE plpgsql;`
    ];
    
    for (const functionSql of functions) {
      const { error: functionError } = await supabase.rpc('execute_sql', { sql: functionSql });
      if (functionError) {
        console.error(`Error creating function: ${functionSql}`, functionError);
      } else {
        console.log(`Function created successfully: ${functionSql}`);
      }
    }
    
    console.log('Database initialization completed!');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

initializeDatabase();