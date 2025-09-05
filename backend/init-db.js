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
          created_at TIMESTAMP DEFAULT NOW()
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
    
    // Insert sample product plans
    const { error: insertError } = await supabase
      .from('product_plans')
      .upsert([
        { id: 1, name: 'Basic Plan', price: 500.00, daily_income: 50.00, total_return: 1500.00, duration_days: 30 },
        { id: 2, name: 'Silver Plan', price: 1000.00, daily_income: 120.00, total_return: 3600.00, duration_days: 30 },
        { id: 3, name: 'Gold Plan', price: 5000.00, daily_income: 650.00, total_return: 19500.00, duration_days: 30 },
        { id: 4, name: 'Platinum Plan', price: 10000.00, daily_income: 1400.00, total_return: 42000.00, duration_days: 30 }
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
      'CREATE INDEX IF NOT EXISTS idx_recharges_user_id ON recharges(user_id);'
    ];
    
    for (const indexSql of indexes) {
      const { error: indexError } = await supabase.rpc('execute_sql', { sql: indexSql });
      if (indexError) {
        console.error(`Error creating index: ${indexSql}`, indexError);
      } else {
        console.log(`Index created successfully: ${indexSql}`);
      }
    }
    
    console.log('Database initialization completed!');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

initializeDatabase();