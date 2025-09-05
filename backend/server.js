const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 10000;

// Log the port for debugging
console.log(`Attempting to start server on port: ${PORT}`);
console.log(`Environment variables:`);
console.log(`PORT: ${process.env.PORT}`);
console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? 'SET' : 'NOT SET'}`);
console.log(`SUPABASE_API_KEY: ${process.env.SUPABASE_API_KEY ? 'SET' : 'NOT SET'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}`);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_API_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to generate random data for marketing stats
const generateMarketingStats = () => {
  // Generate realistic-looking stats
  const totalUsers = Math.floor(Math.random() * 1000000) + 9000000; // 9-10 million
  const dailyActiveUsers = Math.floor(Math.random() * 100000) + 900000; // 900k-1 million
  const totalWithdrawn = Math.floor(Math.random() * 5000000) + 95000000; // 9.5-10 crore
  const successRate = (Math.random() * 2 + 96.5).toFixed(1); // 96.5-98.5%
  const averageRating = (Math.random() * 0.5 + 4.4).toFixed(1); // 4.4-4.9
  const totalReviews = Math.floor(Math.random() * 5000) + 20000; // 20k-25k
  
  return {
    totalUsers,
    dailyActiveUsers,
    totalWithdrawn,
    successRate,
    averageRating,
    totalReviews
  };
};

// Helper function to generate fake withdrawals for popup
const generateFakeWithdrawal = () => {
  const names = [
    "Rahul Sharma", "Priya Patel", "Amit Kumar", "Sneha Gupta", 
    "Vikas Singh", "Pooja Verma", "Rajesh Mehta", "Anita Desai",
    "Suresh Reddy", "Kavita Nair", "Deepak Joshi", "Meena Iyer",
    "Sanjay Malhotra", "Neha Kapoor", "Manoj Tiwari", "Swati Bansal",
    "Arjun Rao", "Divya Pillai", "Rohan Khanna", "Tanvi Choudhury"
  ];
  
  const randomName = names[Math.floor(Math.random() * names.length)];
  const amount = Math.floor(Math.random() * 9500) + 500; // ₹500-₹10,000
  const timestamp = new Date().toLocaleTimeString();
  
  return {
    name: randomName,
    amount: amount,
    timestamp: timestamp
  };
};

// Routes

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { username, mobile, password, confirmPassword, referralCode } = req.body;

    // Validate required fields
    if (!username || !mobile || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Validate mobile number (10 digits)
    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ error: 'Mobile number must be 10 digits' });
    }

    // Check if user already exists with this mobile
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('mobile', mobile)
      .limit(1);

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return res.status(500).json({ error: 'Database error during user check' });
    }

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists with this mobile number' });
    }

    // Validate referral code if provided
    let referredById = null;
    if (referralCode) {
      // Check if referral code is a valid user ID
      const { data: referrer, error: referrerError } = await supabase
        .from('users')
        .select('id')
        .eq('id', parseInt(referralCode))
        .limit(1);

      if (referrerError) {
        console.error('Supabase referrer check error:', referrerError);
        return res.status(500).json({ error: 'Database error during referral check' });
      }

      if (referrer.length === 0) {
        return res.status(400).json({ error: 'Invalid referral code' });
      }

      referredById = parseInt(referralCode);
    }

    // Insert new user with initial balance of 0
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name: username,
          email: `${mobile}@investpro.com`, // Generate email from mobile
          password, // In a real app, you should hash the password
          mobile,
          balance: 0,
          is_admin: false, // Default to false for new users
          referred_by: referredById,
          created_at: new Date()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to register user' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: data.id, name: data.name, email: data.email, is_admin: data.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        is_admin: data.is_admin
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;

    // Validate required fields
    if (!mobile || !password) {
      return res.status(400).json({ error: 'Mobile number and password are required' });
    }

    // Validate mobile number (10 digits)
    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ error: 'Mobile number must be 10 digits' });
    }

    // Find user by mobile number
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, password, is_admin')
      .eq('mobile', mobile)
      .limit(1);

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({ error: 'Database error during login' });
    }

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid mobile number or password' });
    }

    const user = users[0];

    // Check password (in a real app, you should compare hashed passwords)
    if (user.password !== password) {
      return res.status(400).json({ error: 'Invalid mobile number or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected data endpoint
app.get('/api/data', authenticateToken, async (req, res) => {
  try {
    // Fetch user data from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, mobile, product_revenue_wallet, withdrawable_wallet, is_admin')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    res.json({
      message: 'Data fetched successfully',
      user
    });
  } catch (error) {
    console.error('Data fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product plans
app.get('/api/product-plans', authenticateToken, async (req, res) => {
  try {
    let productPlans, error;
    
    // Try to fetch with category column first
    console.log('Attempting to fetch product plans with category column');
    const resultWithCategory = await supabase
      .from('product_plans')
      .select('id, name, category, price, daily_income, total_return, duration_days')
      .order('price', { ascending: true });
    
    if (resultWithCategory.error && resultWithCategory.error.message.includes('column product_plans.category does not exist')) {
      // If category column doesn't exist, fetch without it
      console.log('Category column not found, fetching without it');
      const resultWithoutCategory = await supabase
        .from('product_plans')
        .select('id, name, price, daily_income, total_return, duration_days')
        .order('price', { ascending: true });
      
      productPlans = resultWithoutCategory.data;
      error = resultWithoutCategory.error;
    } else {
      // Either successful or a different error
      productPlans = resultWithCategory.data;
      error = resultWithCategory.error;
    }

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch product plans: ' + error.message });
    }

    // Transform the data to match the frontend expectations
    const transformedPlans = productPlans.map(plan => ({
      id: plan.id,
      name: plan.name,
      category: plan.category || 'general', // Default to 'general' if category doesn't exist
      price: plan.price,
      dailyIncome: plan.daily_income,
      totalReturn: plan.total_return,
      durationDays: plan.duration_days
    }));

    res.json({
      message: 'Product plans fetched successfully',
      plans: transformedPlans
    });
  } catch (error) {
    console.error('Product plans fetch error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Purchase product plan
app.post('/api/purchase-plan', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;

    // Fetch plan details first to get price and other information
    const { data: planData, error: planError } = await supabase
      .from('product_plans')
      .select('id, name, price, duration_days, daily_income')
      .eq('id', planId)
      .single();

    if (planError) {
      console.error('Supabase plan fetch error:', planError);
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    const plan = {
      id: planData.id,
      name: planData.name,
      price: planData.price,
      duration_days: planData.duration_days,
      daily_income: planData.daily_income
    };

    // Fetch user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('withdrawable_wallet')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Supabase user fetch error:', userError);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    // Check if user has sufficient withdrawable balance for purchase
    if (user.withdrawable_wallet < plan.price) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct plan price from user withdrawable wallet
    const newWithdrawableBalance = user.withdrawable_wallet - plan.price;
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        withdrawable_wallet: newWithdrawableBalance
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Supabase balance update error:', updateError);
      return res.status(500).json({ error: 'Failed to update user balance' });
    }

    // Record the investment
    const { error: investmentError } = await supabase
      .from('investments')
      .insert([
        {
          user_id: userId,
          plan_id: planId,
          plan_name: plan.name,
          amount: plan.price,
          purchase_date: new Date().toISOString(),
          status: 'active',
          days_left: plan.duration_days // Track days left for profit calculation
        }
      ]);

    if (investmentError) {
      // Rollback balance update if investment recording fails
      await supabase
        .from('users')
        .update({ 
          withdrawable_wallet: user.withdrawable_wallet
        })
        .eq('id', userId);
      
      console.error('Supabase investment insert error:', investmentError);
      return res.status(500).json({ error: 'Failed to record investment' });
    }

    res.json({
      message: 'Plan purchased successfully',
      newWithdrawableBalance: newWithdrawableBalance
    });
  } catch (error) {
    console.error('Purchase plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user investments
app.get('/api/investments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user investments
    const { data: investments, error } = await supabase
      .from('investments')
      .select(`
        id,
        plan_id,
        plan_name,
        amount,
        purchase_date,
        status,
        days_left,
        product_plans (id, daily_income, duration_days, total_return, price)
      `)
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false });

    if (error) {
      console.error('Supabase investments fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch investments' });
    }

    // Enhance investments with plan details and calculate profit
    const enhancedInvestments = investments.map(investment => {
      const planDetails = investment.product_plans || {};
      const profit = planDetails.total_return && planDetails.price ? 
        planDetails.total_return - planDetails.price : 0;
      
      // Calculate earned profit based on days passed
      // Profit starts after one day, so we calculate based on (duration_days - days_left)
      const daysPassed = planDetails.duration_days && investment.days_left !== undefined ? 
        planDetails.duration_days - investment.days_left : 0;
      const earnedProfit = daysPassed > 0 ? 
        daysPassed * (planDetails.daily_income || 0) : 0;
      
      return {
        ...investment,
        daily_income: planDetails.daily_income || 0,
        duration_days: planDetails.duration_days || 0,
        total_return: planDetails.total_return || 0,
        price: planDetails.price || 0,
        profit: profit,
        earned_profit: earnedProfit
      };
    });
    
    // Calculate total earned profit from all investments
    const totalEarnedProfit = enhancedInvestments.reduce((sum, investment) => sum + investment.earned_profit, 0);

    res.json({
      message: 'Investments fetched successfully',
      investments: enhancedInvestments,
      totalProfit: totalEarnedProfit
    });
  } catch (error) {
    console.error('Investments fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user financial summary (total profit and withdrawable balance)
app.get('/api/financial-summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user's wallet balances
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('product_revenue_wallet, withdrawable_wallet')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Supabase user fetch error:', userError);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    const productRevenueWallet = parseFloat(user.product_revenue_wallet) || 0;
    const withdrawableWallet = parseFloat(user.withdrawable_wallet) || 0;

    // Fetch user investments to calculate total theoretical profit
    const { data: investments, error: investmentsError } = await supabase
      .from('investments')
      .select(`
        id,
        plan_id,
        amount,
        days_left,
        status,
        product_plans (id, daily_income, duration_days)
      `)
      .eq('user_id', userId);

    if (investmentsError) {
      console.error('Supabase investments fetch error:', investmentsError);
      return res.status(500).json({ error: 'Failed to fetch investments' });
    }

    let totalEarnedProfit = 0;
    
    // Calculate total theoretical earned profit from all investments
    totalEarnedProfit = investments.reduce((sum, investment) => {
      if (investment.product_plans && investment.status === 'active') {
        const planDetails = investment.product_plans;
        // Calculate earned profit based on days passed
        // Profit starts after one day, so we calculate based on (duration_days - days_left)
        const daysPassed = planDetails.duration_days && investment.days_left !== undefined ? 
          planDetails.duration_days - investment.days_left : 0;
        const earnedProfit = daysPassed > 0 ? 
          daysPassed * (planDetails.daily_income || 0) : 0;
        return sum + earnedProfit;
      }
      return sum;
    }, 0);

    // Fetch processed daily profits to calculate actual withdrawable balance
    // This represents profits that have actually been added to the user's balance through daily recycling
    const { data: dailyProfits, error: dailyProfitsError } = await supabase
      .from('daily_profits')
      .select('amount')
      .eq('user_id', userId);

    if (dailyProfitsError) {
      console.error('Supabase daily profits fetch error:', dailyProfitsError);
      return res.status(500).json({ error: 'Failed to fetch daily profits' });
    }

    // Calculate total processed daily profits (actual withdrawable amount)
    const totalProcessedProfits = dailyProfits.reduce((sum, profit) => sum + profit.amount, 0);

    // Fetch approved withdrawals to calculate withdrawn amount
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from('withdrawals')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'approved');

    if (withdrawalsError) {
      console.error('Supabase withdrawals fetch error:', withdrawalsError);
      return res.status(500).json({ error: 'Failed to fetch withdrawals' });
    }

    // Calculate total withdrawn amount
    const totalWithdrawn = withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
    
    // Calculate withdrawable balance (total processed daily profits - total withdrawn)
    // Only profits that have been processed through daily recycling can be withdrawn
    const actualWithdrawableBalance = Math.max(0, totalProcessedProfits - totalWithdrawn);

    res.json({
      message: 'Financial summary fetched successfully',
      productRevenueWallet: productRevenueWallet,
      withdrawableWallet: withdrawableWallet,
      totalProfit: totalEarnedProfit,
      totalProcessedProfits: totalProcessedProfits,
      totalWithdrawn: totalWithdrawn,
      actualWithdrawableBalance: actualWithdrawableBalance
    });
  } catch (error) {
    console.error('Financial summary fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request withdrawal
app.post('/api/withdraw', authenticateToken, async (req, res) => {
  try {
    const { amount, method, details } = req.body; // method: 'bank' or 'upi', details: account/upi info
    const userId = req.user.id;

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }

    // Fetch user's withdrawable wallet balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('withdrawable_wallet')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Supabase user fetch error:', userError);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    // Check if user has sufficient withdrawable balance
    if (user.withdrawable_wallet < amount) {
      return res.status(400).json({ error: 'Insufficient withdrawable balance' });
    }

    // Check if user has requested a withdrawal in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { data: recentWithdrawals, error: withdrawalError } = await supabase
      .from('withdrawals')
      .select('id')
      .eq('user_id', userId)
      .gte('request_date', twentyFourHoursAgo.toISOString());

    if (withdrawalError) {
      console.error('Supabase withdrawal check error:', withdrawalError);
      return res.status(500).json({ error: 'Failed to check recent withdrawals' });
    }

    if (recentWithdrawals.length > 0) {
      return res.status(400).json({ error: 'Only one withdrawal allowed every 24 hours' });
    }

    // Deduct 18% GST from amount
    const gstAmount = amount * 0.18;
    const netAmount = amount - gstAmount;

    // Record the withdrawal request (no balance deduction at this point, as it's pending approval)
    const { error: withdrawalInsertError } = await supabase
      .from('withdrawals')
      .insert([
        {
          user_id: userId,
          amount: amount,
          gst_amount: gstAmount,
          net_amount: netAmount,
          method: method,
          details: details,
          request_date: new Date().toISOString(),
          status: 'pending' // pending, approved, rejected
        }
      ]);

    if (withdrawalInsertError) {
      console.error('Supabase withdrawal insert error:', withdrawalInsertError);
      return res.status(500).json({ error: 'Failed to record withdrawal request' });
    }

    res.json({
      message: 'Withdrawal request submitted successfully'
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user withdrawals
app.get('/api/withdrawals', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user withdrawals
    const { data: withdrawals, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('request_date', { ascending: false });

    if (error) {
      console.error('Supabase withdrawals fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch withdrawals' });
    }

    res.json({
      message: 'Withdrawals fetched successfully',
      withdrawals
    });
  } catch (error) {
    console.error('Withdrawals fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request recharge
app.post('/api/recharge', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body; // UPI Transaction Reference is not required for initial request
    const userId = req.user.id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid recharge amount' });
    }

    // Record the recharge request
    const { error: rechargeError } = await supabase
      .from('recharges')
      .insert([
        {
          user_id: userId,
          amount: amount,
          utr: '', // UTR will be provided later
          request_date: new Date().toISOString(),
          status: 'pending' // pending, approved, rejected
        }
      ]);

    if (rechargeError) {
      console.error('Supabase recharge insert error:', rechargeError);
      return res.status(500).json({ error: 'Failed to record recharge request' });
    }

    res.json({
      message: 'Recharge request submitted successfully. Waiting for admin approval.'
    });
  } catch (error) {
    console.error('Recharge request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user recharges
app.get('/api/recharges', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user recharges
    const { data: recharges, error } = await supabase
      .from('recharges')
      .select(`
        id,
        user_id,
        amount,
        utr,
        request_date,
        status,
        processed_date,
        created_at
      `)
      .eq('user_id', userId)
      .order('request_date', { ascending: false });

    if (error) {
      console.error('Supabase recharges fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch recharges' });
    }

    res.json({
      message: 'Recharges fetched successfully',
      recharges
    });
  } catch (error) {
    console.error('Recharges fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update UTR for a pending recharge
app.put('/api/recharge/:id/utr', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { utr } = req.body;
    const userId = req.user.id;

    // Validate UTR
    if (!utr || utr.length < 5) {
      return res.status(400).json({ error: 'Valid UTR is required' });
    }

    // Check if the recharge exists and belongs to the user
    const { data: recharge, error: fetchError } = await supabase
      .from('recharges')
      .select('id, user_id, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !recharge) {
      return res.status(404).json({ error: 'Recharge not found' });
    }

    // Check if recharge is still pending
    if (recharge.status !== 'pending') {
      return res.status(400).json({ error: 'Recharge is no longer pending' });
    }

    // Update the UTR
    const { error: updateError } = await supabase
      .from('recharges')
      .update({ utr: utr })
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (updateError) {
      console.error('Supabase recharge UTR update error:', updateError);
      return res.status(500).json({ error: 'Failed to update UTR' });
    }

    res.json({
      message: 'UTR updated successfully'
    });
  } catch (error) {
    console.error('Recharge UTR update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get marketing stats
app.get('/api/marketing-stats', (req, res) => {
  try {
    const stats = generateMarketingStats();
    
    // Sample fake reviews
    const fakeReviews = [
      {
        id: 1,
        name: "Rajesh Kumar",
        rating: 5,
        comment: "I withdrew ₹50,000 in a single transaction. Amazing platform!",
        date: "2025-07-15"
      },
      {
        id: 2,
        name: "Priya Sharma",
        rating: 5,
        comment: "Best investment platform I've used. Quick withdrawals and great daily returns.",
        date: "2025-07-10"
      },
      {
        id: 3,
        name: "Amit Patel",
        rating: 4,
        comment: "Reliable and trustworthy. My monthly income has helped me a lot.",
        date: "2025-07-05"
      },
      {
        id: 4,
        name: "Sneha Reddy",
        rating: 5,
        comment: "Withdrawal of ₹25,000 processed within 2 hours. Impressive!",
        date: "2025-06-28"
      },
      {
        id: 5,
        name: "Vikas Gupta",
        rating: 5,
        comment: "5 years anniversary achievement! Been with them since day one. Never disappointed.",
        date: "2025-06-20"
      }
    ];
    
    res.json({
      message: 'Marketing stats fetched successfully',
      stats,
      reviews: fakeReviews
    });
  } catch (error) {
    console.error('Marketing stats fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get fake withdrawal for popup
app.get('/api/fake-withdrawal', (req, res) => {
  try {
    const fakeWithdrawal = generateFakeWithdrawal();
    res.json({
      message: 'Fake withdrawal generated',
      withdrawal: fakeWithdrawal
    });
  } catch (error) {
    console.error('Fake withdrawal generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Copy UPI ID endpoint
app.get('/api/upi-id', (req, res) => {
  try {
    const upiId = "7047571829@upi";
    res.json({
      message: 'UPI ID fetched successfully',
      upiId: upiId
    });
  } catch (error) {
    console.error('UPI ID fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Copy referral link endpoint
app.get('/api/referral-link', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const referralLink = `https://investment-pro-official.netlify.app/referral/${userId}`;
    res.json({
      message: 'Referral link generated successfully',
      referralLink: referralLink
    });
  } catch (error) {
    console.error('Referral link generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get referral details endpoint
app.get('/api/referral-details', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get users referred by this user
    const { data: referredUsers, error: referredError } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('referred_by', userId);
      
    // If the referred_by column doesn't exist, return empty arrays
    if (referredError && referredError.message.includes('column')) {
      console.log('Referred_by column not found, returning empty referral data');
      return res.json({
        referredUsers: [],
        activeReferrals: []
      });
    }
    
    if (referredError) throw referredError;
    
    // Get investment details for referred users to determine active referrals
    const referredUserIds = referredUsers.map(user => user.id);
    let activeReferrals = [];
    
    if (referredUserIds.length > 0) {
      const { data: investments, error: investmentsError } = await supabase
        .from('investments')
        .select('user_id, plan_name, amount, purchase_date')
        .in('user_id', referredUserIds);
        
      if (investmentsError) throw investmentsError;
      
      // Group investments by user to determine who has at least one investment
      const userInvestments = {};
      investments.forEach(investment => {
        if (!userInvestments[investment.user_id]) {
          userInvestments[investment.user_id] = [];
        }
        userInvestments[investment.user_id].push(investment);
      });
      
      // Mark users with at least one investment as active referrals
      activeReferrals = referredUsers.filter(user => userInvestments[user.id] && userInvestments[user.id].length > 0);
    }
    
    res.json({
      referredUsers,
      activeReferrals
    });
  } catch (error) {
    console.error('Referral details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leader box winners endpoint
app.get('/api/leader-box-winners', authenticateToken, async (req, res) => {
  try {
    // Generate fake winners (10 entries with random amounts between 1-5 lakh)
    const fakeWinners = [];
    const firstNames = ['Raj', 'Priya', 'Amit', 'Sneha', 'Vikas', 'Anjali', 'Rohit', 'Neha', 'Deepak', 'Pooja'];
    const lastNames = ['Sharma', 'Patel', 'Singh', 'Gupta', 'Yadav', 'Kumar', 'Das', 'Reddy', 'Verma', 'Mishra'];
    
    for (let i = 0; i < 10; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const amount = Math.floor(Math.random() * 500000) + 100000; // Between 1-5 lakh
      const formattedAmount = amount.toLocaleString('en-IN');
      
      fakeWinners.push({
        id: i + 1,
        name: `${firstName} ${lastName}`,
        amount: formattedAmount,
        date: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Random date within last 7 days
      });
    }
    
    res.json({
      winners: fakeWinners
    });
  } catch (error) {
    console.error('Leader box winners error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin middleware - checks if user is admin
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(403).json({ error: 'User not found' });
    }

    if (!user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Get pending recharges (admin)
app.get('/api/admin/recharges/pending', authenticateAdmin, async (req, res) => {
  try {
    const { data: recharges, error } = await supabase
      .from('recharges')
      .select('*')
      .eq('status', 'pending')
      .order('request_date', { ascending: false });

    if (error) {
      console.error('Supabase recharges fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch pending recharges' });
    }

    res.json({
      message: 'Pending recharges fetched successfully',
      recharges
    });
  } catch (error) {
    console.error('Pending recharges fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending withdrawals (admin)
app.get('/api/admin/withdrawals/pending', authenticateAdmin, async (req, res) => {
  try {
    const { data: withdrawals, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('status', 'pending')
      .order('request_date', { ascending: false });

    if (error) {
      console.error('Supabase withdrawals fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch pending withdrawals' });
    }

    res.json({
      message: 'Pending withdrawals fetched successfully',
      withdrawals
    });
  } catch (error) {
    console.error('Pending withdrawals fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve recharge (admin)
app.post('/api/admin/recharge/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const rechargeId = req.params.id;
    const adminId = req.user.id;

    // Get the recharge request
    const { data: recharge, error: fetchError } = await supabase
      .from('recharges')
      .select('*')
      .eq('id', rechargeId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !recharge) {
      return res.status(404).json({ error: 'Pending recharge request not found' });
    }

    // Update user withdrawable wallet
    const rechargeAmount = parseFloat(recharge.amount);
    
    const { error: updateError } = await supabase.rpc('increment_user_withdrawable_wallet', {
      user_id: recharge.user_id,
      amount: rechargeAmount
    });

    if (updateError) {
      console.error('Supabase balance update error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update user balance: ' + updateError.message,
        details: {
          userId: recharge.user_id,
          rechargeAmount: recharge.amount
        }
      });
    }
    
    // Update recharge status
    const { error: rechargeUpdateError, count } = await supabase
      .from('recharges')
      .update({ 
        status: 'approved',
        processed_date: new Date().toISOString()
      })
      .eq('id', rechargeId)
      .eq('status', 'pending'); // Add this condition to ensure we only update pending recharges

    if (rechargeUpdateError) {
      console.error('Supabase recharge update error:', rechargeUpdateError);
      // Rollback user balance update
      await supabase.rpc('decrement_user_withdrawable_wallet', {
        user_id: recharge.user_id,
        amount: rechargeAmount
      });
      
      return res.status(500).json({ error: 'Failed to update recharge status: ' + rechargeUpdateError.message });
    }

    // Check if any rows were updated (recharge was actually pending)
    if (count === 0) {
      // Rollback user balance update
      await supabase.rpc('decrement_user_withdrawable_wallet', {
        user_id: recharge.user_id,
        amount: rechargeAmount
      });
      
      return res.status(400).json({ error: 'Recharge request is no longer pending or was already processed' });
    }

    res.json({
      message: 'Recharge approved successfully'
    });
  } catch (error) {
    console.error('Recharge approval error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Reject recharge (admin)
app.post('/api/admin/recharge/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const rechargeId = req.params.id;

    // Check if recharge is still pending
    const { data: recharge, error: fetchError } = await supabase
      .from('recharges')
      .select('id')
      .eq('id', rechargeId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !recharge) {
      return res.status(404).json({ error: 'Pending recharge request not found' });
    }

    // Update recharge status
    const { error: rechargeUpdateError, count } = await supabase
      .from('recharges')
      .update({ 
        status: 'rejected',
        processed_date: new Date().toISOString()
      })
      .eq('id', rechargeId)
      .eq('status', 'pending');

    if (rechargeUpdateError) {
      console.error('Supabase recharge update error:', rechargeUpdateError);
      return res.status(500).json({ error: 'Failed to update recharge status: ' + rechargeUpdateError.message });
    }

    // Check if any rows were updated (recharge was actually pending)
    if (count === 0) {
      return res.status(400).json({ error: 'Recharge request is no longer pending or was already processed' });
    }

    res.json({
      message: 'Recharge rejected successfully'
    });
  } catch (error) {
    console.error('Recharge rejection error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Approve withdrawal (admin)
app.post('/api/admin/withdrawal/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const withdrawalId = req.params.id;

    // Get the withdrawal request
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !withdrawal) {
      return res.status(404).json({ error: 'Pending withdrawal request not found' });
    }

    // Deduct amount from user's withdrawable wallet
    const { data: userData, error: userError } = await supabase.rpc('decrement_user_withdrawable_wallet', {
      user_id: withdrawal.user_id,
      amount: withdrawal.amount
    });

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found or insufficient balance' });
    }

    // Update withdrawal status
    const { error: withdrawalUpdateError, count } = await supabase
      .from('withdrawals')
      .update({ 
        status: 'approved',
        processed_date: new Date().toISOString()
      })
      .eq('id', withdrawalId)
      .eq('status', 'pending'); // Add this condition to ensure we only update pending withdrawals

    if (withdrawalUpdateError) {
      // Rollback user balance update
      await supabase.rpc('increment_user_withdrawable_wallet', {
        user_id: withdrawal.user_id,
        amount: withdrawal.amount
      });
        
      console.error('Supabase withdrawal update error:', withdrawalUpdateError);
      return res.status(500).json({ error: 'Failed to update withdrawal status: ' + withdrawalUpdateError.message });
    }

    // Check if any rows were updated (withdrawal was actually pending)
    if (count === 0) {
      // Rollback user balance update
      await supabase.rpc('increment_user_withdrawable_wallet', {
        user_id: withdrawal.user_id,
        amount: withdrawal.amount
      });
        
      return res.status(400).json({ error: 'Withdrawal request is no longer pending or was already processed' });
    }

    res.json({
      message: 'Withdrawal approved successfully'
    });
  } catch (error) {
    console.error('Withdrawal approval error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Reject withdrawal (admin)
app.post('/api/admin/withdrawal/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const withdrawalId = req.params.id;

    // Get the withdrawal request
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !withdrawal) {
      return res.status(404).json({ error: 'Pending withdrawal request not found' });
    }

    // Update withdrawal status
    const { error: withdrawalUpdateError, count } = await supabase
      .from('withdrawals')
      .update({ 
        status: 'rejected',
        processed_date: new Date().toISOString()
      })
      .eq('id', withdrawalId)
      .eq('status', 'pending'); // Add this condition to ensure we only update pending withdrawals

    if (withdrawalUpdateError) {
      console.error('Supabase withdrawal update error:', withdrawalUpdateError);
      return res.status(500).json({ error: 'Failed to update withdrawal status: ' + withdrawalUpdateError.message });
    }

    // Check if any rows were updated (withdrawal was actually pending)
    if (count === 0) {
      return res.status(400).json({ error: 'Withdrawal request is no longer pending or was already processed' });
    }

    res.json({
      message: 'Withdrawal rejected successfully'
    });
  } catch (error) {
    console.error('Withdrawal rejection error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Search users (admin)
app.get('/api/admin/users/search', authenticateAdmin, async (req, res) => {
  try {
    const query = req.query.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Search users by name, email, or mobile
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, mobile, balance')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,mobile.ilike.%${query}%`);

    if (error) {
      console.error('Supabase users search error:', error);
      return res.status(500).json({ error: 'Failed to search users' });
    }

    res.json({
      message: 'Users searched successfully',
      users
    });
  } catch (error) {
    console.error('Users search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Adjust user balance (admin)
app.post('/api/admin/user/balance-adjust', authenticateAdmin, async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    const adminId = req.user.id;

    // Validate input
    if (!userId || amount === undefined || !reason) {
      return res.status(400).json({ error: 'User ID, amount, and reason are required' });
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('withdrawable_wallet')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate new balance
    const adjustmentAmount = parseFloat(amount);
    
    let updateError;
    if (adjustmentAmount >= 0) {
      // Adding to balance
      updateError = await supabase.rpc('increment_user_withdrawable_wallet', {
        user_id: userId,
        amount: adjustmentAmount
      });
    } else {
      // Subtracting from balance
      const result = await supabase.rpc('decrement_user_withdrawable_wallet', {
        user_id: userId,
        amount: Math.abs(adjustmentAmount)
      });
      updateError = result.error;
    }

    if (updateError) {
      console.error('Supabase balance update error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update user balance: ' + updateError.message,
        details: {
          userId: userId,
          adjustmentAmount: amount
        }
      });
    }

    // Record balance adjustment
    const { error: recordError } = await supabase
      .from('balance_adjustments')
      .insert([
        {
          user_id: userId,
          amount: amount,
          reason: reason,
          admin_id: adminId,
          adjustment_date: new Date().toISOString()
        }
      ]);

    if (recordError) {
      console.error('Supabase balance adjustment record error:', recordError);
      // Rollback user balance update
      if (adjustmentAmount >= 0) {
        // Rollback addition
        await supabase.rpc('decrement_user_withdrawable_wallet', {
          user_id: userId,
          amount: adjustmentAmount
        });
      } else {
        // Rollback subtraction
        await supabase.rpc('increment_user_withdrawable_wallet', {
          user_id: userId,
          amount: Math.abs(adjustmentAmount)
        });
      }
      
      return res.status(500).json({ error: 'Failed to record balance adjustment: ' + recordError.message });
    }

    res.json({
      message: 'User balance adjusted successfully'
    });
  } catch (error) {
    console.error('Balance adjustment error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Manual daily plan recycling (admin)
app.post('/api/admin/daily-recycle', authenticateAdmin, async (req, res) => {
  try {
    // Get all active investments
    const { data: investments, error: investmentsError } = await supabase
      .from('investments')
      .select(`
        id,
        user_id,
        plan_id,
        amount,
        status,
        days_left,
        users (id, name, referred_by)
      `)
      .eq('status', 'active')
      .order('id');

    if (investmentsError) {
      console.error('Error fetching investments:', investmentsError);
      return res.status(500).json({ error: 'Failed to fetch investments' });
    }

    // Get all product plans to get daily income values
    const { data: plans, error: plansError } = await supabase
      .from('product_plans')
      .select('id, daily_income');

    if (plansError) {
      console.error('Error fetching product plans:', plansError);
      return res.status(500).json({ error: 'Failed to fetch product plans' });
    }

    // Create a map of plan_id to daily_income for quick lookup
    const planIncomeMap = {};
    plans.forEach(plan => {
      planIncomeMap[plan.id] = plan.daily_income;
    });

    // Process each investment
    let processedCount = 0;
    let totalAmountDistributed = 0;

    for (const investment of investments) {
      // Only distribute profit if days_left is greater than 0
      if (investment.days_left > 0) {
        const dailyIncome = planIncomeMap[investment.plan_id];
        
        if (dailyIncome && dailyIncome > 0) {
          // Add daily income to user's product revenue wallet
          const { error: updateUserError } = await supabase.rpc('increment_user_product_revenue_wallet', {
            user_id: investment.user_id,
            amount: dailyIncome
          });

          if (updateUserError) {
            console.error(`Error updating product revenue wallet for user ${investment.user_id}:`, updateUserError);
            // Continue with other investments even if one fails
            continue;
          }

          // Record the daily profit in the daily_profits table
          console.log(`Attempting to record daily profit for user ${investment.user_id}, investment ${investment.id}, amount ${dailyIncome}`);
          const { data: insertData, error: insertProfitError } = await supabase
            .from('daily_profits')
            .insert([
              {
                user_id: investment.user_id,
                investment_id: investment.id,
                amount: dailyIncome,
                processed_date: new Date().toISOString()
              }
            ])
            .select();

          if (insertProfitError) {
            console.error(`Error recording daily profit for user ${investment.user_id}:`, insertProfitError);
            console.error(`Investment data:`, investment);
            console.error(`Daily income:`, dailyIncome);
            // Continue with other investments even if one fails
            continue;
          }
          
          console.log(`Successfully recorded daily profit for user ${investment.user_id}, investment ${investment.id}, amount ${dailyIncome}`);
          console.log(`Insert result:`, insertData);

          // Process commissions for uplines
          if (investment.users && investment.users.referred_by) {
            // Get upline users (Level 1, Level 2, Level 3)
            const level1UplineId = investment.users.referred_by;
            
            // Get Level 1 upline details
            const { data: level1Upline, error: level1Error } = await supabase
              .from('users')
              .select('id, referred_by')
              .eq('id', level1UplineId)
              .single();

            if (!level1Error && level1Upline) {
              // Level 1 commission (30% of daily income)
              const level1Commission = dailyIncome * 0.30;
              
              // Add Level 1 commission to withdrawable wallet
              const { error: updateLevel1Error } = await supabase.rpc('increment_user_withdrawable_wallet', {
                user_id: level1Upline.id,
                amount: level1Commission
              });

              if (!updateLevel1Error) {
                // Record commission in daily_profits table
                await supabase
                  .from('daily_profits')
                  .insert([
                    {
                      user_id: level1Upline.id,
                      investment_id: investment.id,
                      amount: level1Commission,
                      processed_date: new Date().toISOString()
                    }
                  ]);
              }

              // Process Level 2 if exists
              if (level1Upline.referred_by) {
                const level2UplineId = level1Upline.referred_by;
                
                // Get Level 2 upline details
                const { data: level2Upline, error: level2Error } = await supabase
                  .from('users')
                  .select('id, referred_by')
                  .eq('id', level2UplineId)
                  .single();

                if (!level2Error && level2Upline) {
                  // Level 2 commission (2% of daily income)
                  const level2Commission = dailyIncome * 0.02;
                  
                  // Add Level 2 commission to withdrawable wallet
                  const { error: updateLevel2Error } = await supabase.rpc('increment_user_withdrawable_wallet', {
                    user_id: level2Upline.id,
                    amount: level2Commission
                  });

                  if (!updateLevel2Error) {
                    // Record commission in daily_profits table
                    await supabase
                      .from('daily_profits')
                      .insert([
                        {
                          user_id: level2Upline.id,
                          investment_id: investment.id,
                          amount: level2Commission,
                          processed_date: new Date().toISOString()
                        }
                      ]);
                  }

                  // Process Level 3 if exists
                  if (level2Upline.referred_by) {
                    const level3UplineId = level2Upline.referred_by;
                    
                    // Get Level 3 upline details
                    const { data: level3Upline, error: level3Error } = await supabase
                      .from('users')
                      .select('id')
                      .eq('id', level3UplineId)
                      .single();

                    if (!level3Error && level3Upline) {
                      // Level 3 commission (1% of daily income)
                      const level3Commission = dailyIncome * 0.01;
                      
                      // Add Level 3 commission to withdrawable wallet
                      const { error: updateLevel3Error } = await supabase.rpc('increment_user_withdrawable_wallet', {
                        user_id: level3Upline.id,
                        amount: level3Commission
                      });

                      if (!updateLevel3Error) {
                        // Record commission in daily_profits table
                        await supabase
                          .from('daily_profits')
                          .insert([
                            {
                              user_id: level3Upline.id,
                              investment_id: investment.id,
                              amount: level3Commission,
                              processed_date: new Date().toISOString()
                            }
                          ]);
                      }
                    }
                  }
                }
              }
            }
          }

          // Decrease days_left by 1
          const { error: updateInvestmentError } = await supabase
            .from('investments')
            .update({ 
              days_left: investment.days_left - 1
            })
            .eq('id', investment.id);

          if (updateInvestmentError) {
            console.error(`Error updating investment ${investment.id}:`, updateInvestmentError);
            // Continue with other investments even if one fails
            continue;
          }

          // Check if investment has completed its cycle
          if (investment.days_left - 1 === 0) {
            // Move total invested amount + total profit to withdrawable wallet
            const totalAmount = investment.amount + (dailyIncome * investment.days_left);
            
            // Update investment status to completed
            await supabase
              .from('investments')
              .update({ 
                status: 'completed'
              })
              .eq('id', investment.id);

            // Add total amount to user's withdrawable wallet
            const { error: updateWalletError } = await supabase.rpc('increment_user_withdrawable_wallet', {
              user_id: investment.user_id,
              amount: totalAmount
            });

            if (updateWalletError) {
              console.error(`Error updating withdrawable wallet for user ${investment.user_id}:`, updateWalletError);
            }
          }

          processedCount++;
          totalAmountDistributed += dailyIncome;
        }
      }
    }

    res.json({
      message: 'Daily plan recycling completed successfully',
      processedInvestments: processedCount,
      totalAmountDistributed: totalAmountDistributed
    });
  } catch (error) {
    console.error('Daily plan recycling error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Get user details (admin)
app.get('/api/admin/user/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user details
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, mobile, balance, is_admin')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User details fetched successfully',
      user
    });
  } catch (error) {
    console.error('User details fetch error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;

    // Validate required fields
    if (!mobile || !password) {
      return res.status(400).json({ error: 'Mobile number and password are required' });
    }

    // Check admin credentials
    if (mobile === '9999999999' && password === 'Admin123!') {
      // Create admin user if it doesn't exist
      const { data: existingAdmin, error: fetchError } = await supabase
        .from('users')
        .select('id, name, email, is_admin')
        .eq('mobile', '9999999999')
        .limit(1);

      let adminUser;
      if (fetchError || existingAdmin.length === 0) {
        // Create admin user
        const { data: newAdmin, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              name: 'Admin User',
              email: 'admin@investpro.com',
              password: 'Admin123!',
              mobile: '9999999999',
              balance: 0,
              is_admin: true,
              created_at: new Date()
            }
          ])
          .select()
          .single();

        if (insertError) {
          console.error('Supabase admin insert error:', insertError);
          return res.status(500).json({ error: 'Failed to create admin user' });
        }

        adminUser = newAdmin;
      } else {
        adminUser = existingAdmin[0];
        // Ensure admin flag is set
        if (!adminUser.is_admin) {
          await supabase
            .from('users')
            .update({ is_admin: true })
            .eq('id', adminUser.id);
        }
      }

      // Create JWT token
      const token = jwt.sign(
        { id: adminUser.id, name: adminUser.name, email: adminUser.email, is_admin: true },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        message: 'Admin login successful',
        token,
        user: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          is_admin: true
        }
      });
    }

    return res.status(401).json({ error: 'Invalid admin credentials' });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});// Trigger redeploy
// Trigger backend redeploy for category feature
// Trigger redeploy for backward compatibility
// Trigger redeploy for simplified version
// Trigger redeploy for category feature
// Trigger redeploy for robust category feature
// Trigger redeploy for detailed error logging
// Trigger redeploy for category column fix
// Trigger backend redeploy for financial features
