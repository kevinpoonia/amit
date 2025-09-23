const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron'); // ✅ FIX: This line was missing
const multer = require('multer'); // Import multer
// At the top with other imports
const { WebSocketServer } = require('ws');
const http = require('http'); // For creating a shared HTTP server

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
// ✅ NEW: Create a standard HTTP server that both Express and WebSocket can use
const server = http.createServer(app);

const PORT = process.env.PORT || 10000;

console.log(`Attempting to start server on port: ${PORT}`);

// Middleware
// ✅ THIS IS THE FIX: A more robust CORS configuration
const allowedOrigins = ['https://amit-sigma.vercel.app', 'http://localhost:3000'];

// ✅ THIS IS THE FIX: A more robust CORS configuration to handle preflight requests.
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests) and from whitelisted origins
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    optionsSuccessStatus: 204,
};

app.use(cors({ origin: ['https://amit-sigma.vercel.app', 'http://localhost:3000'] }));
app.use(express.json());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);


// ✅ NEW: Added the missing currency formatter function to the server.
const formatCurrency = (amount) => {
    if (typeof amount !== 'number') amount = 0;
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
};

// ==========================================
// ========== Daily Cron Job ================
// ==========================================
// This job runs once every day at midnight server time.
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily cron job: Updating investments and distributing income...');
    try {
        // 1. Fetch all active investments
        const { data: activeInvestments, error: fetchError } = await supabase
            .from('investments')
            .select('id, days_left, user_id, plan_id')
            .eq('status', 'active');

        if (fetchError) throw fetchError;

        const incomeDistribution = {}; // { userId: totalDailyIncome }

        for (const investment of activeInvestments) {
            const newDaysLeft = investment.days_left - 1;
            const newStatus = newDaysLeft <= 0 ? 'completed' : 'active';

            await supabase
                .from('investments')
                .update({ days_left: newDaysLeft, status: newStatus })
                .eq('id', investment.id);

            // If the investment is still active, add its income for distribution
            if (newStatus === 'active') {
                const { data: plan, error: planError } = await supabase
                    .from('product_plans')
                    .select('daily_income')
                    .eq('id', investment.plan_id)
                    .single();
                
                if (plan && !planError) {
                    incomeDistribution[investment.user_id] = (incomeDistribution[investment.user_id] || 0) + plan.daily_income;
                }
            }
        }

        // 2. Distribute income to users' unclaimed balance
        for (const userId in incomeDistribution) {
            await supabase.rpc('increment_unclaimed_income', {
                p_user_id: parseInt(userId),
                p_amount: incomeDistribution[userId]
            });
        }
        
        // ✅ FIX: Changed table name from 'daily_tasks' to 'daily_profits'
        await supabase.from('daily_profits').update({ last_run_at: new Date().toISOString() }).eq('task_name', 'distribute_income');
        console.log('Daily cron job completed successfully.');
    } catch (error) {
        console.error('Error in daily cron job:', error);
    }
});

// ==========================================
// ========== AUTHENTICATION MIDDLEWARE =====
// ==========================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

const authenticateAdmin = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { data: user, error } = await supabase.from('users').select('is_admin').eq('id', decoded.id).single();
        if (error || !user || !user.is_admin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// ==========================================
// ============== HELPER FUNCTIONS ==========
// ==========================================
const generateIpUsername = (username) => {
    let namePart = username.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6);
    if (namePart.length < 6) namePart = namePart.padEnd(6, '123');
    return `${namePart}@${username.length}`;
};

const getNumberProperties = (num) => {
    const colors = [];
    if ([1, 3, 7, 9].includes(num)) colors.push('Red');
    if ([2, 4, 6, 8].includes(num)) colors.push('Green');
    if ([0, 5].includes(num)) {
        colors.push('Violet');
        colors.push(num === 5 ? 'Green' : 'Red');
    }
    return colors;
};

// ✅ FIX: Changed to a function declaration to ensure it's hoisted and available everywhere.

function getLotteryRoundId() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    return `${year}${month}${day}-${hour}`;
};

function generatePeriodId() {
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const yyyymmdd = `${year}${month}${day}`;

    const hours = now.getHours();
    const minutes = now.getMinutes();
    // Calculate the total minutes passed since the start of the day
    const minuteOfDay = (hours * 60) + minutes + 1; // Ranges from 1 to 1440
    
    // Pad the minute with leading zeros to ensure it's always 4 digits
    const minutePart = String(minuteOfDay).padStart(4, '0');

    return Number(`${yyyymmdd}${minutePart}`);
}


// ==========================================
// ========== USER-FACING API ENDPOINTS =====
// ==========================================


// ✅ **NEW ENDPOINT ADDED HERE** ✅
// This endpoint receives a suggestion from a logged-in user and saves it to the database.
app.post('/api/submit-suggestion', authenticateToken, async (req, res) => {
    const { suggestion } = req.body;
    if (!suggestion || suggestion.trim() === '') {
        return res.status(400).json({ error: 'Suggestion text cannot be empty.' });
    }
    try {
        const { error } = await supabase.from('suggestions').insert([
            { 
                user_id: req.user.id, // Storing which user made the suggestion
                suggestion_text: suggestion.trim() 
            }
        ]);
        if (error) throw error;
        res.status(201).json({ message: 'Suggestion submitted successfully!' });
    } catch (error) {
        console.error("Error submitting suggestion:", error);
        res.status(500).json({ error: 'Failed to submit suggestion.' });
    }
});

// ✅ UPDATED: The /api/register endpoint has been completely rewritten for reliability and error handling.
app.post('/api/register', async (req, res) => {
    const { username, mobile, password, referralCode } = req.body;
    if (!username || !mobile || !password) {
        return res.status(400).json({ error: 'Username, mobile, and password are required' });
    }
    try {
        const { data: existingUser, error: existingUserError } = await supabase
            .from('users')
            .select('id')
            .eq('mobile', mobile)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'A user with this mobile number already exists.' });
        }
        if (existingUserError && existingUserError.code !== 'PGRST116') {
            throw existingUserError;
        }

        let referredById = null;
        if (referralCode) {
            const { data: referrer } = await supabase.from('users').select('id').eq('ip_username', referralCode).single();
            if (referrer) {
                referredById = referrer.id;
            }
        }

        const { data: newUser, error } = await supabase.from('users').insert([{
            name: username,
            mobile,
            password,
            referred_by: referredById,
            balance: 50,
             email: `${mobile}@moneyplus.com` // ✅ FIX: Added placeholder email
        }]).select().single();

        if (error) throw error;
        
        const ipUsername = `${username.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5)}_${newUser.id}`;
        await supabase.from('users').update({ ip_username: ipUsername }).eq('id', newUser.id);

        const token = jwt.sign({ id: newUser.id, name: newUser.name, is_admin: newUser.is_admin }, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        if (referredById) {
            await supabase.rpc('increment_task_progress', {
                p_user_id: referredById,
                p_task_type: 'referral',
                p_increment_value: 1
            });
        }
        
        res.status(201).json({ message: 'User registered successfully', token, user: { ...newUser, ip_username: ipUsername } });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// ✅ UPDATED: Login now creates a welcome notification
app.post('/api/login', async (req, res) => {
    const { mobile, password } = req.body;
    if (!mobile || !password) { return res.status(400).json({ error: 'Mobile and password are required' }); }
    try {
        const { data: user, error } = await supabase.from('users').select('*').eq('mobile', mobile).single();
        if (error || !user || user.password !== password) { return res.status(400).json({ error: 'Invalid credentials' }); }
        
        await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'welcome',
            message: 'Welcome back! Ready to earn more and make your money work for you?'
        });

        const token = jwt.sign({ id: user.id, name: user.name, is_admin: user.is_admin }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// ✅ RESTORED: All necessary endpoints for the app to function after login.
app.get('/api/data', authenticateToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase.from('users').select('id, name, ip_username, status, avatar_url, is_admin').eq('id', req.user.id).single();
        if (error) throw error;
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});



// ✅ THIS IS THE CORRECTED ENDPOINT THAT FIXES THE LOGIN ISSUE
app.get('/api/financial-summary', authenticateToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('balance, withdrawable_wallet, todays_income_unclaimed')
            .eq('id', req.user.id)
            .single();
        if (error) throw error;
        res.json({ 
            balance: user.balance, 
            withdrawable_wallet: user.withdrawable_wallet, 
            todaysIncome: user.todays_income_unclaimed 
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch financial summary' });
    }
});





// ✅ NEW: Endpoint to fetch all notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ userNotifications: data || [] });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: 'Failed to fetch notifications.' });
    }
});

app.post('/api/notifications/read', authenticateToken, async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'An array of notification IDs is required.' });
    }
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', ids)
            .eq('user_id', req.user.id);
        
        if (error) throw error;
        res.json({ message: 'Notifications marked as read.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark notifications as read.' });
    }
});

app.post('/api/notifications/delete-read', authenticateToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', req.user.id)
            .eq('is_read', true);

        if (error) throw error;
        res.json({ message: 'Read notifications deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete read notifications.' });
    }
});

// ✅ NEW: Endpoint for the Deposit page to get payment methods and maintenance status.
app.get('/api/deposit-info', authenticateToken, async (req, res) => {
    try {
        const [{ data: methods, error: methodsError }, { data: status, error: statusError }] = await Promise.all([
            supabase.from('payment_methods').select('*'),
            supabase.from('system_status').select('is_maintenance, maintenance_ends_at').eq('service_name', 'deposits').single()
        ]);

        if (methodsError) throw methodsError;
        if (statusError) throw statusError;
        
        res.json({ methods, status });
    } catch (error) {
        console.error("Error fetching deposit info:", error);
        res.status(500).json({ error: 'Failed to fetch deposit information.' });
    }
});


// ✅ UPDATED: The /recharge endpoint now securely handles file uploads from the server.
// ✅ UPDATED: The /recharge endpoint now treats the screenshotUrl as optional.
app.post('/api/recharge', authenticateToken, async (req, res) => {
    // The screenshot is now optional, so we remove it from the validation.
    const { amount, utr, screenshotUrl } = req.body; 
    if (!amount || amount <= 0 || !utr || utr.trim() === '') { 
        return res.status(400).json({ error: 'Valid amount and UTR are required' }); 
    }
    try {
        const { error } = await supabase.from('recharges').insert([
            // screenshot_url can now be null if not provided
            { user_id: req.user.id, amount, utr: utr.trim(), screenshot_url: screenshotUrl } 
        ]);
        if (error) throw error;
        res.json({ message: 'Recharge request submitted successfully.' });
    } catch (error) {
        console.error("Recharge error:", error);
        res.status(500).json({ error: 'Failed to submit recharge request.' });
    }
});

// ✅ UPDATED: Withdraw endpoint now uses the new database function
app.post('/api/withdraw', authenticateToken, async (req, res) => {
    const { amount, method, details } = req.body;
    try {
        const { data, error } = await supabase.rpc('request_withdrawal', {
            p_user_id: req.user.id, p_amount: amount, p_method: method, p_details: details
        });
        if (error) throw error;
        const result = data[0];
        if (!result.success) return res.status(400).json({ error: result.message });
        await supabase.from('notifications').insert({ user_id: req.user.id, type: 'withdrawal', message: `Your withdrawal request of ₹${amount.toLocaleString()} has been submitted.` });
        res.json({ message: result.message });
    } catch (error) { res.status(500).json({ error: 'Failed to submit withdrawal request.' }); }
});


app.get('/api/product-plans', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from('product_plans').select('*').order('id');
        if (error) throw error;
        res.json({ plans: data });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product plans.' });
    }
});

// ✅ THIS IS THE CORRECTED AND COMPLETE ENDPOINT
app.post('/api/purchase-plan', authenticateToken, async (req, res) => {
    console.log("\n--- Received Purchase Request ---");
    try {
        const { id, price, name, durationDays } = req.body;
        console.log("Payload received:", { id, price, name });
        console.log(`Attempting purchase for user ID: ${req.user.id}`);

        // Fetch the user's current balances directly from the DB for logging
        const { data: currentUser, error: userFetchError } = await supabase
            .from('users')
            .select('balance, withdrawable_wallet, status')
            .eq('id', req.user.id)
            .single();

        if (userFetchError) throw userFetchError;

        const dbBalance = Number(currentUser.balance) || 0;
        const dbWithdrawable = Number(currentUser.withdrawable_wallet) || 0;
        const dbTotal = dbBalance + dbWithdrawable;
        
        console.log(`Database Balance: ${dbBalance}, Withdrawable: ${dbWithdrawable}, Total: ${dbTotal}`);
        console.log(`Comparing DB Total (${dbTotal}) with Plan Price (${price})`);

        if (['flagged', 'non-active'].includes(currentUser.status)) {
            return res.status(403).json({ error: 'You are not authorised to do this action. Please contact support.' });
        }

        // Call the database function
        const { data: deductionSuccess, error: rpcError } = await supabase.rpc('deduct_from_total_balance_for_purchase', { 
            p_user_id: req.user.id, 
            p_amount: price 
        });

        if (rpcError || !deductionSuccess) {
            console.error("Deduction failed. RPC Error:", rpcError);
            console.log("Result from DB function (deductionSuccess):", deductionSuccess);
            return res.status(400).json({ error: 'Insufficient total balance.' });
        }

        const { error: investmentError } = await supabase.from('investments').insert([
            { user_id: req.user.id, plan_id: id, plan_name: name, amount: price, status: 'active', days_left: durationDays }
        ]);

// ✅ TASK SYSTEM: Update investment task progress
        await supabase.rpc('increment_task_progress', {
            p_user_id: req.user.id,
            p_task_type: 'investment',
            p_increment_value: price
        });
        
        if (investmentError) {
            console.error("CRITICAL: Failed to record investment after purchase for user:", req.user.id, investmentError);
            // Ideally, you would refund the user here.
            return res.status(500).json({ error: 'Purchase failed after payment. Please contact support immediately.' });
        }
        
        console.log("--- Purchase Successful ---");
        res.json({ message: 'Plan purchased successfully!' });
    } catch (error) { 
        console.error("Purchase Plan Error:", error);
        res.status(500).json({ error: 'Failed to purchase plan. Please try again.' }); 
    }
});
// ✅ UPDATED: This endpoint has been corrected to fix the SyntaxError.
app.get('/api/investments', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('investments')
            .select(`
                id,
                amount,
                status,
                days_left,
                created_at,
                product_plans (
                    name, 
                    daily_income
                )
            `)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        const formattedData = data.map(inv => ({
            ...inv,
            plan_name: inv.product_plans ? inv.product_plans.name : 'Unknown Plan', // Use name from the join
            daily_income: inv.product_plans ? inv.product_plans.daily_income : 0
        }));

        res.json({ investments: formattedData });
    } catch (error) {
        console.error("Failed to fetch investments:", error);
        res.status(500).json({ error: 'Failed to fetch user investments.' });
    }
});


// ✅ UPDATED: This endpoint now correctly fetches and formats ALL transaction types.
app.get('/api/transactions', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [ { data: recharges }, { data: withdrawals }, { data: investments }, { data: claims } ] = await Promise.all([
            supabase.from('recharges').select('id, amount, status, created_at').eq('user_id', userId),
            supabase.from('withdrawals').select('id, amount, status, created_at').eq('user_id', userId),
            supabase.from('investments').select('id, amount, plan_name, created_at').eq('user_id', userId),
            supabase.from('daily_claims').select('id, amount, created_at').eq('user_id', userId)
        ]);

        const formatted = [];
        (recharges || []).forEach(r => formatted.push({ id: `dep-${r.id}`, type: 'Deposit', amount: r.amount, status: r.status, date: r.created_at }));
        (withdrawals || []).forEach(w => formatted.push({ id: `wd-${w.id}`, type: 'Withdrawal', amount: -w.amount, status: w.status, date: w.created_at }));
        (investments || []).forEach(i => formatted.push({ id: `inv-${i.id}`, type: 'Plan Purchase', amount: -i.amount, status: 'Completed', date: i.created_at, description: i.plan_name }));
        (claims || []).forEach(c => formatted.push({ id: `claim-${c.id}`, type: 'Daily Income', amount: c.amount, status: 'Claimed', date: c.created_at }));
        
        formatted.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.json({ transactions: formatted });
    } catch (error) { 
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: 'Failed to fetch transaction history.' }); 
    }
});


// ✅ NEW: Endpoint to fetch the user's bet history
app.get('/api/bet-history', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bets')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        res.json({ history: data || [] });
    } catch (error) {
        console.error("Error fetching bet history:", error);
        res.status(500).json({ error: 'Failed to fetch bet history.' });
    }
});



app.get('/api/fake-withdrawals', (req, res) => {
    const names = ["Rahul S.", "Priya P.", "Amit K.", "Sneha G.", "Vikas S.", "Pooja V."];
    const withdrawals = Array.from({ length: 10 }, () => ({
        name: names[Math.floor(Math.random() * names.length)],
        amount: Math.floor(Math.random() * 9500) + 500
    }));
    res.json({ withdrawals });
});

// --- AVIATOR API ENDPOINTS ---
app.get('/api/aviator/state', authenticateToken, (req, res) => {
    res.json({ 
        gameState: aviatorGameState, 
        multiplier: aviatorMultiplier, 
        roundId: aviatorRoundId,
        countdown: aviatorCountdown 
    });
});

app.post('/api/aviator/bet', authenticateToken, async (req, res) => {
    const { betAmount, roundId } = req.body;
    if (aviatorGameState !== 'waiting') {
        return res.status(400).json({ error: 'Betting is only allowed before the round starts.' });
    }
    // ... (logic to deduct user balance and insert bet into aviator_bets)
    res.json({ message: 'Bet placed!' });
});

app.post('/api/aviator/cashout', authenticateToken, async (req, res) => {
    const { roundId, currentMultiplier } = req.body;
    // ... (logic to update bet status to 'cashed_out', calculate payout, and credit user wallet)
    res.json({ message: 'Cashed out!', payout: betAmount * currentMultiplier });
});

app.get('/api/aviator/history', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from('aviator_rounds').select('*').order('created_at', { ascending: false }).limit(20);
        if (error) throw error;
        res.json({ history: data });
    } catch(err) {
        res.status(500).json({ error: 'Failed to fetch Aviator history' });
    }
});

//==========================================
//======= Pushpa game api===================
//==========================================
// ✅ ADD THIS NEW PUSHPA RAJ API ROUTE
app.post('/api/pushpa-raj/place-bet', authenticateToken, async (req, res) => {
    const { betAmount } = req.body;
    const userId = req.user.id; // User ID from the JWT token

    if (!betAmount || betAmount <= 0) {
        return res.status(400).json({ error: 'Invalid bet amount.' });
    }

    try {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('balance')
            .eq('id', userId)
            .single();

        if (userError) throw userError;

        if (user.balance < betAmount) {
            return res.status(400).json({ error: 'Insufficient balance.' });
        }

        // Deduct the bet amount from the user's balance
        const newBalance = user.balance - betAmount;
        await supabase
            .from('users')
            .update({ balance: newBalance })
            .eq('id', userId);

        // Store the bet to be processed by the game loop later
        await supabase
            .from('bets')
            .insert([{ user_id: userId, game_name: 'PushpaRaj', bet_amount: betAmount, status: 'pending' }]);

        res.status(200).json({ success: true, message: `Bet of ₹${betAmount} placed successfully.` });

    } catch (error) {
        console.error("Error placing bet:", error);
        res.status(500).json({ error: 'Failed to place bet. Please try again.' });
    }
});

// ==========================================
// ========== PUSHPA RAJ GAME LOGIC =========
// ==========================================

let pushpaGameState = {
    status: 'waiting', // 'waiting', 'running', 'crashed'
    roundId: `pushpa-${Date.now()}`,
    multiplier: 1.00,
    startTime: null,
    crashMultiplier: 1.00,
    countdown: 15000, // 15 seconds
    waitingTime: 15000,
    prevStatus: 'crashed'
};
let pushpaGameLoopInterval;

// ✅ UPDATED: Admin settings for Pushpa game
let pushpaAdminSettings = {
    profitMode: 'admin_profit', // 'admin_profit', 'user_profit', 'user_profit_max'
    controlMode: 'auto',        // 'auto', 'admin'
    manualCrashPoint: null      // a number, e.g., 2.50, if controlMode is 'admin'
};


// ✅ NEW: Broadcasting function to send messages to all connected clients
const broadcast = (message) => {
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
};

const calculatePushpaCrashPoint = async (roundId) => {
    // Admin manual override takes highest priority
    if (pushpaAdminSettings.controlMode === 'admin' && pushpaAdminSettings.manualCrashPoint) {
        return pushpaAdminSettings.manualCrashPoint;
    }

    const { data: bets, error } = await supabase
        .from('pushpa_bets')
        .select('bet_amount')
        .eq('round_id', roundId);

    if (error || !bets || bets.length === 0) {
        // If no bets, generate a standard random result
        return 1 + Math.random() * 9;
    }

    const totalBetIn = bets.reduce((sum, bet) => sum + Number(bet.bet_amount), 0);

    // Logic for 'auto' controlMode
    switch (pushpaAdminSettings.profitMode) {
        case 'user_profit':
            // Admin can lose max 10%. We achieve this by ensuring a higher multiplier.
            return 2.0 + Math.random() * 5; // Generous crash point between 2.00x and 7.00x

        case 'user_profit_max':
            // More than 50% of users should win. This means a guaranteed survivable time.
            return 1.5 + Math.random() * 10; // Crash point between 1.50x and 11.50x

        case 'admin_profit':
        default:
            // Admin aims for profit. The crash point will be lower on average.
            return 1.0 + Math.random() * 1.5; // Crash point between 1.00x and 2.50x
    }
};


const runPushpaGameCycle = async () => {
    clearInterval(pushpaGameLoopInterval);
    pushpaGameState.prevStatus = pushpaGameState.status;
    pushpaGameState.status = 'running';
    pushpaGameState.startTime = Date.now();
    
    pushpaGameState.crashMultiplier = await calculatePushpaCrashPoint(pushpaGameState.roundId);
    
    supabase.from('pushpa_rounds').insert({
        round_id: pushpaGameState.roundId,
        crash_multiplier: pushpaGameState.crashMultiplier
    }).then(({ error }) => {
        if (error) console.error("Error saving Pushpa round:", error);
    });

    pushpaGameLoopInterval = setInterval(async () => {
        const elapsedTime = (Date.now() - pushpaGameState.startTime) / 1000;
        pushpaGameState.multiplier = parseFloat((1 + elapsedTime * 0.2 + Math.pow(elapsedTime, 2) * 0.01).toFixed(2));
        
        if (pushpaGameState.multiplier >= pushpaGameState.crashMultiplier) {
            clearInterval(pushpaGameLoopInterval);
            pushpaGameState.prevStatus = pushpaGameState.status;
            pushpaGameState.status = 'crashed';
            
            await supabase.from('pushpa_bets')
                .update({ status: 'lost' })
                .eq('round_id', pushpaGameState.roundId)
                .eq('status', 'pending');

            broadcast({ type: 'PUSHPA_STATE_UPDATE', payload: pushpaGameState });

            setTimeout(() => {
                pushpaGameState.prevStatus = pushpaGameState.status;
                pushpaGameState.status = 'waiting';
                pushpaGameState.roundId = `pushpa-${Date.now()}`;
                pushpaGameState.multiplier = 1.00;
                pushpaGameState.startTime = Date.now();
                pushpaAdminSettings.manualCrashPoint = null; // ✅ Reset manual crash point for the new round

                const countdownInterval = setInterval(() => {
                    const elapsed = Date.now() - pushpaGameState.startTime;
                    pushpaGameState.countdown = pushpaGameState.waitingTime - elapsed;
                    
                    if (pushpaGameState.countdown <= 0) {
                        clearInterval(countdownInterval);
                        runPushpaGameCycle();
                    } else {
                         broadcast({ type: 'PUSHPA_STATE_UPDATE', payload: pushpaGameState });
                    }
                }, 100);
            }, 5000);
        } else {
             broadcast({ type: 'PUSHPA_STATE_UPDATE', payload: pushpaGameState });
        }
    }, 100);
};


// ==========================================
// ========== AVIATOR GAME LOGIC ============
// ==========================================

let aviatorGameState = 'waiting';
let aviatorMultiplier = 1.00;
let aviatorRoundId = `aviator-${Date.now()}`;
let aviatorCountdown = 8;
let aviatorAdminSettings = { mode: 'auto', profitMargin: 0.10, manualCrashPoint: null };
let aviatorGameLoopInterval;
let aviatorCountdownInterval;

const getRealisticCrashPoint = () => {
    const r = Math.random();
    if (r < 0.90) { // 90% chance for 1.00x to 10.00x
        return 1 + Math.random() * 9;
    } else if (r < 0.98) { // 8% chance for 10.00x to 30.00x
        return 10 + Math.random() * 20;
    } else { // 2% chance for > 30.00x
        return 30 + Math.random() * 70; // e.g., up to 100x
    }
};

const runAviatorCycle = async () => {
    clearInterval(aviatorCountdownInterval);
    aviatorGameState = 'playing';
    aviatorRoundId = `aviator-${Date.now()}`;
    aviatorAdminSettings.manualCrashPoint = null;
    const startTime = Date.now();
    
    const { data: bets } = await supabase.from('aviator_bets').select('bet_amount').eq('round_id', aviatorRoundId);
    const totalBetIn = (bets || []).reduce((sum, b) => sum + Number(b.bet_amount), 0);
    
    let crashPoint;
    if (aviatorAdminSettings.mode === 'admin' && aviatorAdminSettings.manualCrashPoint) {
        crashPoint = aviatorAdminSettings.manualCrashPoint;
    } else if (totalBetIn > 0) {
        const targetPayout = totalBetIn * (1 - aviatorAdminSettings.profitMargin);
        crashPoint = Math.max(1.01, (totalBetIn / (targetPayout || 1)) * 1.2 + (Math.random() * 1.5));
    } else {
        crashPoint = getRealisticCrashPoint();
    }
    
    aviatorGameLoopInterval = setInterval(async () => {
        const elapsedTime = (Date.now() - startTime) / 1000;
        aviatorMultiplier = parseFloat((1 + elapsedTime * 0.2 + Math.pow(elapsedTime, 2) * 0.01).toFixed(2));
        
        if (aviatorMultiplier >= crashPoint) {
            clearInterval(aviatorGameLoopInterval);
            aviatorGameState = 'crashed';
            await supabase.from('aviator_rounds').insert({ round_id: aviatorRoundId, crash_multiplier: aviatorMultiplier });
            await supabase.from('aviator_bets').update({ status: 'lost' }).eq('round_id', aviatorRoundId).eq('status', 'pending');
            
            setTimeout(() => {
                aviatorGameState = 'waiting';
                aviatorCountdown = 8;
                aviatorCountdownInterval = setInterval(() => {
                    aviatorCountdown--;
                    if(aviatorCountdown <= 0) {
                        clearInterval(aviatorCountdownInterval);
                        runAviatorCycle();
                    }
                }, 1000);
            }, 5000); // 5-second grace period after crash
        }
    }, 100);
};

runAviatorCycle();


// ==========================================
// ========== LOTTERY GAME LOGIC ============
// ==========================================
const calculateLotteryResult = async (roundId, profitPreference) => {
    const { data: bets, error } = await supabase.from('lottery_bets').select('*').eq('round_id', roundId);
    if (error) throw error;

    if (bets.length === 0) { // If no bets, generate a truly random result
        return { a: Math.floor(Math.random() * 10), b: Math.floor(Math.random() * 10) };
    }

    const totalBetIn = bets.reduce((sum, bet) => sum + parseFloat(bet.bet_amount), 0);
    let bestOutcome = { a: -1, b: -1, netResult: -Infinity };

    for (let a = 0; a <= 9; a++) {
        for (let b = a; b <= 9; b++) { // Iterate unique pairs
            let currentPayout = 0;
            bets.forEach(bet => {
                const isDoubleBet = bet.selected_num_a !== null && bet.selected_num_b !== null;
                const isSingleBet = bet.selected_num_a !== null && bet.selected_num_b === null;

                if (isDoubleBet && ((bet.selected_num_a === a && bet.selected_num_b === b) || (bet.selected_num_a === b && bet.selected_num_b === a))) {
                    currentPayout += bet.bet_amount * 25;
                } else if (isSingleBet && (bet.selected_num_a === a || bet.selected_num_a === b)) {
                    currentPayout += bet.bet_amount * 2.5;
                }
            });

            const netResult = totalBetIn - currentPayout;
            if (netResult > bestOutcome.netResult) {
                bestOutcome = { a, b, netResult };
            }
        }
    }
    
    // For Zero Profit mode, find a result that creates a small loss for the admin if possible
    if (profitPreference === 'zero_profit' && bestOutcome.netResult < 0) {
         let zeroProfitOutcome = { ...bestOutcome };
         for (let a = 0; a <= 9; a++) {
            for (let b = a; b <= 9; b++) {
                 let currentPayout = 0;
                 bets.forEach(bet => {
                    const isDoubleBet = bet.selected_num_a !== null && bet.selected_num_b !== null;
                    const isSingleBet = bet.selected_num_a !== null && bet.selected_num_b === null;
                    if (isDoubleBet && ((bet.selected_num_a === a && bet.selected_num_b === b) || (bet.selected_num_a === b && bet.selected_num_b === a))) currentPayout += bet.bet_amount * 25;
                    else if (isSingleBet && (bet.selected_num_a === a || bet.selected_num_a === b)) currentPayout += bet.bet_amount * 2.5;
                 });
                 const netResult = totalBetIn - currentPayout;
                 // Find the result closest to zero, even if it's a small loss
                 if (Math.abs(netResult) < Math.abs(zeroProfitOutcome.netResult)) {
                    zeroProfitOutcome = { a, b, netResult };
                 }
            }
        }
        return { a: zeroProfitOutcome.a, b: zeroProfitOutcome.b };
    }

    return { a: bestOutcome.a, b: bestOutcome.b };
};

const processLotteryRound = async (roundId) => {
    console.log(`Processing lottery for round: ${roundId}`);
    const { data: gameState } = await supabase.from('game_state').select('lottery_profit_preference').single();
    const profitPreference = gameState?.lottery_profit_preference || 'max_profit';

    const result = await calculateLotteryResult(roundId, profitPreference);

    const { data: bets, error } = await supabase.from('lottery_bets').select('*, users(name)').eq('round_id', roundId);
    if (error) { console.error("Error fetching bets for payout:", error); return; }

    const winners = [];
    for (const bet of bets) {
        let payout = 0;
        let status = 'lost';
        const isDoubleBet = bet.selected_num_a !== null && bet.selected_num_b !== null;
        const isSingleBet = bet.selected_num_a !== null && bet.selected_num_b === null;

        if (isDoubleBet && ((bet.selected_num_a === result.a && bet.selected_num_b === result.b) || (bet.selected_num_a === result.b && bet.selected_num_b === result.a))) {
            payout = bet.bet_amount * 25;
            status = 'won';
        } else if (isSingleBet && (bet.selected_num_a === result.a || bet.selected_num_a === result.b)) {
            payout = bet.bet_amount * 2.5;
            status = 'won';
        }
        
        if (payout > 0) {
            winners.push(bet.users.name);
            await supabase.rpc('increment_user_withdrawable_wallet', { p_user_id: bet.user_id, p_amount: payout });
        }
        await supabase.from('lottery_bets').update({ status, payout }).eq('id', bet.id);
    }

    await supabase.from('lottery_results').insert({
        round_id: roundId,
        winning_num_a: result.a,
        winning_num_b: result.b,
        winner_count: winners.length,
        sample_winner_name: winners.length > 0 ? winners[Math.floor(Math.random() * winners.length)] : null
    });
    
    console.log(`Round ${roundId} processed. Winning numbers: ${result.a}, ${result.b}.`);
};

// Cron job to run at the start of every hour
cron.schedule('0 * * * *', () => {
    const roundId = getLotteryRoundId();
    processLotteryRound(roundId);
});


// ==========================================
// ========== Color GAME LOGIC & ENDPOINTS ========
// ==========================================
// ==========================================
// ========== GAME LOGIC & ENDPOINTS ========
// ==========================================


// This endpoint is ONLY for fetching the initial game history when the page loads.
app.get('/api/game-state', authenticateToken, async (req, res) => {
    try {
        const { data: results } = await supabase.from('game_results')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        res.json({ results: results || [] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch initial game history.' });
    }
});

// This endpoint lets the frontend check a user's win/loss result for the popup.
app.get('/api/my-bet-result/:period', authenticateToken, async (req, res) => {
    const { period } = req.params;
    const userId = req.user.id;
    if (!period) {
        return res.status(400).json({ error: 'Game period is required.' });
    }
    try {
        const { data: bets, error } = await supabase.from('bets').select('payout').eq('user_id', userId).eq('game_period', period);
        if (error) throw error;
        if (!bets || bets.length === 0) {
            return res.json({ status: 'did_not_play' });
        }
        const totalPayout = bets.reduce((sum, bet) => sum + (bet.payout || 0), 0);
        if (totalPayout > 0) {
            return res.json({ status: 'won', payout: totalPayout });
        } else {
            return res.json({ status: 'lost' });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch your result for the round." });
    }
});



// ==========================================
// ========== COLOR GAME WEBSOCKET LOGIC ========
// ==========================================

let gameTimer;
const GAME_DURATION_SECONDS = 60;
const BETTING_WINDOW_SECONDS = 50;

// In server.js

// In server.js, replace the entire processRoundResults function with this:

async function processRoundResults(period) {
    console.log(`[processRoundResults] Starting for period: ${period}`);
    try {
        const { data: gameState, error: gsError } = await supabase.from('game_state').select('*').single();
        if (gsError) throw gsError;

        const { data: bets, error: betsError } = await supabase.from('bets').select('*').eq('game_period', period);
        if (betsError) throw betsError;
        
        let winningNumber;
        if (gameState.mode === 'admin' && gameState.next_result !== null) {
            winningNumber = gameState.next_result;
        } else if (bets && bets.length > 0) {
            const totalPayouts = Array(10).fill(0);
            bets.forEach(bet => {
                for (let i = 0; i < 10; i++) {
                    const potentialColors = getNumberProperties(i);
                    let multiplier = 0;
                    if (bet.bet_on == i.toString()) multiplier = 9.2;
                    else if (potentialColors.includes(bet.bet_on)) multiplier = bet.bet_on === 'Violet' ? 4.5 : 1.98;
                    totalPayouts[i] += parseFloat(bet.amount) * multiplier;
                }
            });
            const minPayout = Math.min(...totalPayouts);
            const lowestPayoutNumbers = totalPayouts.map((p, i) => p === minPayout ? i : -1).filter(i => i !== -1);
            winningNumber = lowestPayoutNumbers.length > 0 ? lowestPayoutNumbers[Math.floor(Math.random() * lowestPayoutNumbers.length)] : Math.floor(Math.random() * 10);
        } else {
            winningNumber = Math.floor(Math.random() * 10);
        }
        
        await supabase.from('game_results').insert({ game_period: period, result_number: winningNumber });
        console.log(`[processRoundResults] Winning number for period ${period} is ${winningNumber}.`);

        const { data: updatedResults } = await supabase.from('game_results').select('*').order('created_at', { ascending: false }).limit(20);
        broadcast({ type: 'ROUND_RESULT', results: updatedResults || [] });
        console.log(`[processRoundResults] ROUND_RESULT message broadcasted.`);

        if (bets && bets.length > 0) {
            console.log(`[processRoundResults] Processing payouts...`);
            const winningColors = getNumberProperties(winningNumber);
            for (const bet of bets) {
                let payout = 0;
                let status = 'lost';
                if (bet.bet_on == winningNumber.toString() || winningColors.includes(bet.bet_on)) {
                    status = 'won';
                    if (bet.bet_on == winningNumber.toString()) payout += parseFloat(bet.amount) * 9.2;
                    if (winningColors.includes(bet.bet_on)) payout += parseFloat(bet.amount) * (bet.bet_on === 'Violet' ? 4.5 : 1.98);
                }
                if (payout > 0) {
                    await supabase.rpc('increment_user_withdrawable_wallet', { p_user_id: bet.user_id, p_amount: payout });
                }
                await supabase.from('bets').update({ status, payout }).eq('id', bet.id);
            }
            console.log(`[processRoundResults] Payouts finished.`);
        }
    } catch (e) {
        console.error(`[processRoundResults] ERROR for period ${period}:`, e);
    }
}

async function gameLoop() {
    console.log("--- [gameLoop] Starting new cycle ---");
    if (gameTimer) clearInterval(gameTimer);

    try {
        const { data: gs, error: gsError } = await supabase.from('game_state').select('current_period').eq('id', 1).single();
        let previousPeriod;

        if (gsError || !gs) {
            console.log("[gameLoop] Initializing game state...");
            const initialPeriod = generatePeriodId();
            await supabase.from('game_state').upsert({ id: 1, current_period: initialPeriod });
            previousPeriod = initialPeriod;
        } else {
            previousPeriod = gs.current_period;
        }
        
        processRoundResults(previousPeriod);

        const nextPeriod = generatePeriodId();
        await supabase.from('game_state').update({ current_period: nextPeriod, next_result: null, countdown_start_time: new Date().toISOString() }).eq('id', 1);
        
        let timeLeft = GAME_DURATION_SECONDS;
        gameTimer = setInterval(() => {
            const canBet = timeLeft > (GAME_DURATION_SECONDS - BETTING_WINDOW_SECONDS);
            broadcast({ type: 'TIMER_UPDATE', timeLeft, current_period: nextPeriod, can_bet: canBet });
            timeLeft--;
            if (timeLeft < 0) {
                clearInterval(gameTimer);
                gameLoop();
            }
        }, 1000);
    } catch (error) {
        console.error("[gameLoop] CRITICAL error:", error);
    }
}


// Color game logic ends here 


app.get('/api/data', authenticateToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase.from('users').select('id, name, ip_username, status, avatar_url').eq('id', req.user.id).single();
        if (error) throw error;
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

// ✅ UPDATED: This endpoint now includes the 'last_claim_at' timestamp
// ✅ THIS IS THE CORRECTED ENDPOINT
// app.get('/api/financial-summary', authenticateToken, async (req, res) => {
//     try {
//         // Step 1: Fetch the user's basic wallet balances and last claim time.
//         const { data: user, error: userError } = await supabase
//             .from('users')
//             .select('balance, withdrawable_wallet, last_claim_at')
//             .eq('id', req.user.id)
//             .single();
//         if (userError) throw userError;

//         // Step 2: Call the database function to calculate the user's total claimable income for today.
//         const { data: claimableIncome, error: rpcError } = await supabase.rpc('calculate_claimable_income', { p_user_id: req.user.id });
//         if (rpcError) throw rpcError;

//         // Step 3: Send all the correct data to the frontend.
//         res.json({
//             balance: user.balance,
//             withdrawable_wallet: user.withdrawable_wallet,
//             todaysIncome: claimableIncome, // This now contains the real calculated amount
//             lastClaimAt: user.last_claim_at // This is needed for the cooldown timer
//         });
//     } catch (error) { 
//         console.error("Financial Summary Error:", error);
//         res.status(500).json({ error: 'Failed to fetch financial summary.' }); 
//     }
// });


// ✅ FIX: Added the /api/tasks endpoint
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase.rpc('get_user_tasks', { p_user_id: req.user.id });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: 'Failed to fetch tasks.' });
    }
});

// ✅ TASK SYSTEM: New endpoint to claim a task reward
app.post('/api/tasks/claim', authenticateToken, async (req, res) => {
    const { taskId } = req.body;
    try {
        const { data, error } = await supabase.rpc('claim_task_reward', {
            p_user_id: req.user.id,
            p_task_id: taskId
        });

        if (error) throw error;

        if (data.success) {
            res.json({ message: data.message });
        } else {
            res.status(400).json({ error: data.message });
        }
    } catch (error) {
        console.error("Error claiming task:", error);
        res.status(500).json({ error: 'Failed to claim task reward.' });
    }
});
// ✅ FIX: Added the /api/suggestions endpoint
app.post('/api/suggestions', authenticateToken, async (req, res) => {
    const { suggestion_text } = req.body;
    if (!suggestion_text || suggestion_text.trim() === '') {
        return res.status(400).json({ error: 'Suggestion text cannot be empty.' });
    }
    try {
        const { error } = await supabase.from('suggestions').insert([
            { user_id: req.user.id, suggestion_text }
        ]);
        if (error) throw error;
        res.status(201).json({ message: 'Suggestion submitted successfully.' });
    } catch (error) {
        console.error('Suggestion submission error:', error);
        res.status(500).json({ error: 'Failed to submit suggestion.' });
    }
});

// ✅ UPDATED: The /api/claim-income endpoint is now fully functional and will work with the new database function.
app.post('/api/claim-income', authenticateToken, async (req, res) => {
    try {
        // This calls the 'claim_daily_income' function you just created in your Supabase database
        const { data: claimedAmount, error } = await supabase.rpc('claim_daily_income', {
            p_user_id: req.user.id
        });

        if (error) throw error;

        if (claimedAmount > 0) {
            res.json({ message: `Successfully claimed ${formatCurrency(claimedAmount)}. It has been added to your withdrawable balance.` });
        } else {
            res.status(400).json({ error: 'You have no income to claim at this time.' });
        }
    } catch (error) {
        console.error("Claim income error:", error);
        res.status(500).json({ error: 'Failed to claim income. Please try again later.' });
    }
});

// ✅ UPDATED: This is the new, robust endpoint to get all referral data for the team page.
app.get('/api/referral-details', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const { data: user, error: userError } = await supabase.from('users').select('ip_username').eq('id', userId).single();
        if (userError) throw userError;

        const { data: level1Referrals, error: level1Error } = await supabase.from('users').select('id, name').eq('referred_by', userId);
        if (level1Error) throw level1Error;

        const level1Ids = level1Referrals.map(u => u.id);
        let level2Referrals = [];
        if (level1Ids.length > 0) {
            const { data: l2Data, error: level2Error } = await supabase.from('users').select('id, name').in('referred_by', level1Ids);
            if (level2Error) throw level2Error;
            level2Referrals = l2Data;
        }

        const { data: commissions, error: commissionError } = await supabase.from('referral_commissions').select('commission_amount').eq('user_id', userId);
        if (commissionError) throw commissionError;

        const totalRewards = commissions.reduce((sum, record) => sum + parseFloat(record.commission_amount), 0);

        res.json({
            referralLink: `https://amit-sigma.vercel.app/?ref=${user.ip_username}`,
            totalRewards: totalRewards,
            level1: {
                count: level1Referrals.length,
                users: level1Referrals
            },
            level2: {
                count: level2Referrals.length,
                users: level2Referrals
            }
        });

    } catch (error) {
        console.error("Error fetching referral details:", error);
        res.status(500).json({ error: 'Failed to fetch referral details.' });
    }
});


// ==========================================
// ========== ADMIN API ENDPOINTS ===========

// ==========================================
// ========== LOTTERY API ENDPOINTS =========
// ==========================================
app.get('/api/lottery/live-stats/:roundId', authenticateToken, async (req, res) => {
    try {
        const { roundId } = req.params;
        const { data, error } = await supabase.from('lottery_rounds').select('*').eq('round_id', roundId).single();
        if (error) { // If round doesn't exist yet, create it
            const { data: newData, error: insertError } = await supabase.from('lottery_rounds').insert({
                round_id: roundId,
                base_player_count: Math.floor(Math.random() * 150) + 100,
                total_pool_amount: Math.floor(Math.random() * 20000) + 5000
            }).select().single();
            if (insertError) throw insertError;
            return res.json(newData);
        }
        res.json(data);
    } catch (e) { res.status(500).json({ error: 'Failed to get live stats.' }); }
});

app.get('/api/lottery/history', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from('lottery_results')
            .select('round_id, winning_num_a, winning_num_b, winner_count, sample_winner_name, created_at')
            .order('created_at', { ascending: false }).limit(20);
        if (error) throw error;
        res.json({ history: data });
    } catch (e) { 
        console.error("Error fetching lottery history:", e);
        res.status(500).json({ error: 'Failed to fetch history.' }); 
    }
});

app.post('/api/lottery/bet', authenticateToken, async (req, res) => {
    const { roundId, betAmount, selectedNumA, selectedNumB } = req.body;
    try {
        const { data: success, error } = await supabase.rpc('place_lottery_bet', {
            p_user_id: req.user.id, p_round_id: roundId, p_bet_amount: betAmount,
            p_num_a: selectedNumA, p_num_b: selectedNumB
        });
        if (error || !success) return res.status(400).json({ error: 'Bet failed. Insufficient balance or invalid data.' });
        res.json({ message: 'Bet placed successfully!' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to place bet.' });
    }
});

app.get('/api/lottery/my-bet-result/:roundId', authenticateToken, async (req, res) => {
    const { roundId } = req.params;
    try {
        const { data, error } = await supabase.from('lottery_bets').select('bet_amount, status, payout').eq('user_id', req.user.id).eq('round_id', roundId);
        if (error || data.length === 0) return res.json({ title: "No Bet Placed", message: "You didn't play this round. Good luck next time!" });
        
        const totalPayout = data.reduce((sum, bet) => sum + (bet.payout || 0), 0);
        if (totalPayout > 0) {
            return res.json({ title: 'You Won!', message: `Congratulations! You won a total of ${formatCurrency(totalPayout)}!` });
        }
        return res.json({ title: 'Better Luck Next Time!', message: "Your numbers didn't match this time. Try again!" });
    } catch (e) { res.status(500).json({ error: 'Failed to fetch your result.' }); }
});


// ✅ NEW: Endpoint to get a combined financial overview of ALL games.
app.get('/api/admin/overall-game-stats', authenticateAdmin, async (req, res) => {
    try {
        const { data: colorGameBets, error: colorErr } = await supabase.from('bets').select('amount, payout');
        if (colorErr) throw colorErr;
        const { data: lotteryBets, error: lotteryErr } = await supabase.from('lottery_bets').select('bet_amount, payout');
        if (lotteryErr) throw lotteryErr;

        const totalColorBet = colorGameBets.reduce((sum, b) => sum + (b.amount || 0), 0);
        const totalColorPayout = colorGameBets.reduce((sum, b) => sum + (b.payout || 0), 0);
        const totalLotteryBet = lotteryBets.reduce((sum, b) => sum + (b.bet_amount || 0), 0);
        const totalLotteryPayout = lotteryBets.reduce((sum, b) => sum + (b.payout || 0), 0);

        const totalBet = totalColorBet + totalLotteryBet;
        const totalPayout = totalColorPayout + totalLotteryPayout;
        const totalPL = totalBet - totalPayout;

        res.json({ totalBet, totalPayout, totalPL });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch overall game statistics.' });
    }
});

// ==========================================
// ============= Admin Pushpa API============
// ==========================================
// ✅ UPDATED: Endpoint for admin to control Pushpa game profit mode and manual settings
app.post('/api/admin/pushpa-settings', authenticateAdmin, (req, res) => {
    const { profitMode, controlMode, manualCrashPoint } = req.body;
    const validProfitModes = ['admin_profit', 'user_profit', 'user_profit_max'];
    const validControlModes = ['auto', 'admin'];

    if (profitMode && validProfitModes.includes(profitMode)) {
        pushpaAdminSettings.profitMode = profitMode;
    }
    if (controlMode && validControlModes.includes(controlMode)) {
        pushpaAdminSettings.controlMode = controlMode;
    }
    // Set manual crash point only if control mode is 'admin'
    if (controlMode === 'admin' && manualCrashPoint && !isNaN(parseFloat(manualCrashPoint))) {
        pushpaAdminSettings.manualCrashPoint = parseFloat(manualCrashPoint);
    } else {
        // If mode is auto or no valid point is given, reset it.
        pushpaAdminSettings.manualCrashPoint = null;
    }
    
    res.json({ message: `Pushpa Raj game settings updated.`, settings: pushpaAdminSettings });
});

// ✅ NEW: Endpoint to get the profit analysis table for the current round
app.get('/api/admin/pushpa-analysis', authenticateAdmin, async (req, res) => {
    try {
        const { data: bets } = await supabase
            .from('pushpa_bets')
            .select('bet_amount')
            .eq('round_id', pushpaGameState.roundId);
        
        const totalBetIn = (bets || []).reduce((sum, b) => sum + Number(b.bet_amount), 0);

        const profitTargets = [0, 0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.0];
        const analysis = profitTargets.map(profitMargin => {
            const targetNetProfit = totalBetIn * profitMargin;
            const targetPayout = totalBetIn - targetNetProfit;
            
            // This is a simplified heuristic to suggest a multiplier
            const requiredMultiplier = (targetPayout > 0 && totalBetIn > 0) ? (totalBetIn / targetPayout) : Infinity;

            return {
                profitMargin: `${(profitMargin * 100).toFixed(0)}%`,
                requiredMultiplier: isFinite(requiredMultiplier) ? requiredMultiplier.toFixed(2) + 'x' : 'High',
                totalBet: totalBetIn,
                estimatedPayout: targetPayout,
                netProfit: targetNetProfit
            };
        });

        res.json({ analysis });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate Pushpa Raj analysis.' });
    }
});
// ==========================================

// ==========================================
// ✅ UPDATED: This endpoint now fetches the screenshot URL for the admin panel.
app.get('/api/admin/recharges/pending', authenticateAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('recharges')
            .select('id, user_id, amount, utr, request_date, screenshot_url')
            .eq('status', 'pending')
            .order('request_date', { ascending: true });
        if (error) throw error;
        res.json({ recharges: data });
    } catch (err) { res.status(500).json({ error: 'Failed to fetch pending deposits.' }); }
});



app.get('/api/admin/withdrawals/pending', authenticateAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('withdrawals').select('*').eq('status', 'pending').order('request_date', { ascending: true });
        if (error) throw error;
        res.json({ withdrawals: data });
    } catch (err) { res.status(500).json({ error: 'Failed to fetch pending withdrawals.' }); }
});

// ✅ UPDATED: This endpoint now triggers the referral bonus distribution function in the database.
app.post('/api/admin/recharge/:id/approve', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const { data: recharge, error: fetchError } = await supabase.from('recharges').select('*').eq('id', id).single();
        if (fetchError || !recharge) return res.status(404).json({ error: 'Recharge not found.' });
        if (recharge.status !== 'pending') return res.status(400).json({ error: 'Recharge is not pending.' });
        
        await supabase.rpc('increment_user_balance', { p_user_id: recharge.user_id, p_amount: recharge.amount });
        await supabase.from('recharges').update({ status: 'approved', processed_date: new Date() }).eq('id', id);
        // ✅ TASK SYSTEM: Update deposit task progress
        await supabase.rpc('increment_task_progress', {
            p_user_id: recharge.user_id,
            p_task_type: 'deposit',
            p_increment_value: recharge.amount
        });
        const { error: referralError } = await supabase.rpc('handle_deposit_referral', {
            depositing_user_id: recharge.user_id, deposit_id: recharge.id, deposit_amount: recharge.amount
        });
        if (referralError) console.error("Referral processing error:", referralError);
        
        await supabase.from('notifications').insert({ user_id: recharge.user_id, type: 'deposit', message: `Your deposit of ₹${recharge.amount.toLocaleString()} has been approved.` });
        res.json({ message: 'Deposit approved, notification sent, and referral bonuses processed.' });
    } catch (err) { res.status(500).json({ error: 'Failed to approve deposit.' }); }
});



app.post('/api/admin/recharge/:id/reject', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await supabase.from('recharges').update({ status: 'rejected', processed_date: new Date().toISOString() }).eq('id', id);
        res.json({ message: 'Deposit rejected successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reject deposit.' });
    }
});

// ✅ UPDATED: Approving a withdrawal now creates a notification
app.post('/api/admin/withdrawal/:id/approve', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const { data: withdrawal, error: fetchError } = await supabase.from('withdrawals').select('*').eq('id', id).single();
        if (fetchError || !withdrawal) return res.status(404).json({ error: 'Withdrawal not found.' });

        await supabase.rpc('decrement_user_withdrawable_wallet', { p_user_id: withdrawal.user_id, p_amount: withdrawal.amount });
        await supabase.from('withdrawals').update({ status: 'approved' }).eq('id', id);

        await supabase.from('notifications').insert({
            user_id: withdrawal.user_id,
            type: 'withdrawal',
            message: `Your withdrawal of ₹${withdrawal.amount.toLocaleString()} has been approved.`
        });

        res.json({ message: 'Withdrawal approved and notification sent.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve withdrawal.' });
    }
});

app.post('/api/admin/withdrawal/:id/reject', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { data: withdrawal, error: fetchError } = await supabase.from('withdrawals').select('*').eq('id', id).single();
        if (fetchError || !withdrawal) return res.status(404).json({ error: 'Withdrawal not found.' });
        if (withdrawal.status !== 'pending') return res.status(400).json({ error: 'Withdrawal is not pending.' });

        await supabase.from('withdrawals').update({ status: 'rejected', processed_date: new Date().toISOString() }).eq('id', id);
        res.json({ message: 'Withdrawal rejected successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reject withdrawal.' });
    }
});

// ✅ THIS IS THE MAIN FIX
app.get('/api/admin/income-status', authenticateAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('daily_tasks').select('last_run_at').eq('task_name', 'distribute_income').single();
        if (error) throw error;

        const lastRun = new Date(data.last_run_at);
        const nextRun = new Date(lastRun.getTime() + 2 * 60 * 60 * 1000); // 2-hour cooldown

        res.json({
            canDistribute: new Date() > nextRun,
            nextDistributionTime: nextRun.toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch income distribution status.' });
    }
});

app.post('/api/admin/distribute-income', authenticateAdmin, async (req, res) => {
    try {
        const { data: task, error: taskError } = await supabase.from('daily_tasks').select('last_run_at').eq('task_name', 'distribute_income').single();
        if (taskError) throw taskError;

        const lastRun = new Date(task.last_run_at);
        if (new Date().getTime() - lastRun.getTime() < 2 * 60 * 60 * 1000) {
            return res.status(429).json({ error: `You can only distribute income once every 2 hours.` });
        }

        const { data: activeInvestments, error: fetchError } = await supabase
            .from('investments')
            .select('user_id, product_plans(daily_income)')
            .eq('status', 'active');
        if (fetchError) throw fetchError;

        const incomeDistribution = {};
        for (const investment of activeInvestments) {
            if (investment.product_plans) {
                incomeDistribution[investment.user_id] = (incomeDistribution[investment.user_id] || 0) + investment.product_plans.daily_income;
            }
        }

        const notifications = [];
        for (const userId in incomeDistribution) {
            const amount = incomeDistribution[userId];
            await supabase.rpc('increment_unclaimed_income', { p_user_id: parseInt(userId), p_amount: amount });
            
            notifications.push({
                user_id: parseInt(userId),
                type: 'income',
                message: `Your daily income of ₹${amount.toLocaleString()} is ready to be claimed!`
            });
        }
        
        if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications);
        }
        
        await supabase.from('daily_tasks').update({ last_run_at: new Date().toISOString() }).eq('task_name', 'distribute_income');
        
        res.json({ message: `Daily income distributed to ${Object.keys(incomeDistribution).length} users.` });

    } catch (error) {
        console.error("Distribute income error:", error);
        res.status(500).json({ error: 'Failed to distribute income.' });
    }
});

// ✅ UPDATED: Setting user status now creates the specific notifications you requested
app.post('/api/admin/set-user-status', authenticateAdmin, async (req, res) => {
    const { userId, status } = req.body;
    if (!userId || !['active', 'non-active', 'flagged'].includes(status)) {
        return res.status(400).json({ error: 'Invalid user ID or status provided.' });
    }
    try {
        await supabase.from('users').update({ status }).eq('id', userId);
        
        let notificationMessage = '';
        if (status === 'non-active') {
            notificationMessage = "Your account has been marked as non-active because of suspicious activity on your account.";
        } else if (status === 'flagged') {
            notificationMessage = "Your account has been marked flagged for violating the rules.";
        }

        if (notificationMessage) {
            await supabase.from('notifications').insert({
                user_id: userId,
                type: 'status_change',
                message: notificationMessage
            });
        }
        
        res.json({ message: `User ${userId}'s status has been updated to ${status}.` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update user status.' });
    }
});

// ✅ NEW: Endpoint to grant bonuses and create notifications
app.post('/api/admin/grant-bonus', authenticateAdmin, async (req, res) => {
    const { amount, reason, user_ids } = req.body;
    if (!amount || amount <= 0 || !reason) { return res.status(400).json({ error: 'Amount and reason are required.' }); }
    try {
        let targetUsers = [];
        if (user_ids && user_ids.length > 0) {
            targetUsers = user_ids;
        } else {
            const { data: allUsers } = await supabase.from('users').select('id');
            targetUsers = allUsers.map(u => u.id);
        }

        const notifications = [];
        for (const userId of targetUsers) {
            await supabase.rpc('increment_user_withdrawable_wallet', { p_user_id: userId, p_amount: amount });
            notifications.push({
                user_id: userId,
                type: 'bonus',
                message: `You have received a bonus of ₹${amount.toLocaleString()}! Reason: ${reason}`
            });
        }
        
        await supabase.from('notifications').insert(notifications);

        res.json({ message: `Bonus of ₹${amount} granted to ${targetUsers.length} users.` });
    } catch (err) {
        console.error("Grant Bonus Error:", err);
        res.status(500).json({ error: 'Failed to grant bonus.' });
    }
});

// ✅ NEW: Endpoint to create a global promotion message
app.post('/api/admin/create-promotion', authenticateAdmin, async (req, res) => {
    const { title, message } = req.body;
    if (!title || !message) {
        return res.status(400).json({ error: 'Title and message are required for a promotion.' });
    }
    try {
        const { error } = await supabase.from('promotions').insert({ title, message });
        if (error) throw error;
        res.json({ message: 'Promotion created successfully and will be visible to all users.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create promotion.' });
    }
});
app.post('/api/admin/distribute-daily-income', authenticateAdmin, async (req, res) => {
    try {
        const { data: appState, error: stateError } = await supabase.from('game_state').select('last_income_distribution').single();
        if (stateError) throw stateError;

        if (appState.last_income_distribution) {
            const lastTime = new Date(appState.last_income_distribution).getTime();
            const now = new Date().getTime();
            if (now - lastTime < 24 * 60 * 60 * 1000) {
                return res.status(429).json({ error: 'Income can only be distributed once every 24 hours.' });
            }
        }
        
        const { data: updatedUsers, error: rpcError } = await supabase.rpc('distribute_income_to_all_active_users');
        if (rpcError) throw rpcError;

        await supabase.from('game_state').update({ last_income_distribution: new Date().toISOString() }).eq('id', 1);

        res.json({ message: `Successfully distributed daily income to ${updatedUsers} users.` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to distribute daily income.' });
    }
});

app.post('/api/admin/distribute-income-custom', authenticateAdmin, async (req, res) => {
    const { user_ids } = req.body;
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
        return res.status(400).json({ error: 'Please provide a valid array of user IDs.' });
    }
    try {
        const { data: updatedCount, error: rpcError } = await supabase.rpc('distribute_income_to_specific_users', { p_user_ids: user_ids });
        if (rpcError) throw rpcError;
        res.json({ message: `Successfully distributed income to ${updatedCount} specified users.` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to distribute custom income.' });
    }
});

app.get('/api/admin/income-distribution-status', authenticateAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('game_state').select('last_income_distribution').single();
        if (error) throw error;
        res.json({ lastDistribution: data.last_income_distribution });
    } catch (err) {
        res.status(500).json({ error: 'Failed to get status.' });
    }
});

app.post('/api/admin/update-user-status', authenticateAdmin, async (req, res) => {
    const { userId, status } = req.body;
    const validStatuses = ['active', 'non-active', 'flagged'];
    if (!userId || !status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid user ID or status provided.' });
    }
    try {
        const { error } = await supabase.from('users').update({ status }).eq('id', userId);
        if (error) throw error;
        res.json({ message: `User ${userId}'s status has been updated to ${status}.` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update status.' });
    }
});

// ✅ NEW: Endpoint to get a user's income eligibility status.
app.get('/api/admin/user-income-status/:userId', authenticateAdmin, async (req, res) => {
    const { userId } = req.params;
    try {
        const { data, error } = await supabase
            .from('users')
            .select('name, can_receive_income')
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return res.status(404).json({ error: 'User not found.' });
            throw error;
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user's income status." });
    }
});

// ✅ NEW: Endpoint for admins to allow or block a user's income.
app.post('/api/admin/manage-user-income', authenticateAdmin, async (req, res) => {
    const { userId, canReceiveIncome } = req.body;
    if (!userId || typeof canReceiveIncome !== 'boolean') {
        return res.status(400).json({ error: 'Valid User ID and a boolean status are required.' });
    }
    try {
        const { error } = await supabase
            .from('users')
            .update({ can_receive_income: canReceiveIncome })
            .eq('id', userId);

        if (error) throw error;
        const action = canReceiveIncome ? 'enabled' : 'disabled';
        res.json({ message: `Successfully ${action} income for User ID: ${userId}.` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user income status.' });
    }
});
// ✅ ADD this new endpoint for the admin panel's financial overview table
app.get('/api/admin/platform-stats', authenticateAdmin, async (req, res) => {
    try {
        const { data: deposits, error: depError } = await supabase
            .from('recharges')
            .select('amount')
            .eq('status', 'approved');
        if (depError) throw depError;

        const { data: withdrawals, error: wdError } = await supabase
            .from('withdrawals')
            .select('amount')
            .eq('status', 'approved');
        if (wdError) throw wdError;

        const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);
        const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);
        const platformPL = totalDeposits - totalWithdrawals;

        res.json({
            totalDeposits,
            totalWithdrawals,
            platformPL
        });
    } catch (error) {
        console.error("Error fetching platform stats:", error);
        res.status(500).json({ error: 'Failed to fetch platform statistics.' });
    }
});



// ==========================================
// ========== ADMIN GAME API ENDPOINTS ===========

// --- ADMIN AVIATOR ENDPOINTS ---
app.get('/api/admin/aviator/live-bets', authenticateAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('aviator_bets').select('*, users(name)').eq('round_id', aviatorRoundId);
        if (error) throw error;
        res.json({ bets: data });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch live Aviator bets.' });
    }
});

app.post('/api/admin/aviator-settings', authenticateAdmin, (req, res) => {
    const { mode, profitMargin, manualCrashPoint } = req.body;
    if (mode) aviatorAdminSettings.mode = mode;
    if (profitMargin) aviatorAdminSettings.profitMargin = parseFloat(profitMargin);
    if (manualCrashPoint) aviatorAdminSettings.manualCrashPoint = parseFloat(manualCrashPoint);
    else aviatorAdminSettings.manualCrashPoint = null; // Reset if not provided
    
    res.json({ message: 'Aviator settings updated.', settings: aviatorAdminSettings });
});
// ✅ NEW: Endpoint to calculate the profit analysis table for the admin
app.get('/api/admin/aviator-analysis', authenticateAdmin, async (req, res) => {
    try {
        const { data: bets } = await supabase.from('aviator_bets').select('*').eq('round_id', aviatorRoundId);
        const totalBetIn = (bets || []).reduce((sum, b) => sum + Number(b.bet_amount), 0);

        const profitTargets = [0, 0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.0];
        const analysis = profitTargets.map(profitMargin => {
            const targetNetProfit = totalBetIn * profitMargin;
            const targetPayout = totalBetIn - targetNetProfit;
            
            // This is a simplified calculation to find the multiplier that results in the target payout
            // A real-world scenario would need a more complex algorithm to iterate through cashed-out bets
            const requiredMultiplier = bets.length > 0 ? (totalBetIn / (targetPayout || 1)) : 1.5;

            return {
                profitMargin: `${(profitMargin * 100).toFixed(0)}%`,
                requiredMultiplier: requiredMultiplier.toFixed(2) + 'x',
                totalBet: totalBetIn,
                estimatedPayout: targetPayout,
                netProfit: targetNetProfit
            };
        });

        res.json({ analysis });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate Aviator analysis.' });
    }
});




// --- ADMIN LOTTERY ENDPOINTS ---
// ✅ FIX: Added the missing /api/admin/lottery-analysis endpoint
app.get('/api/admin/lottery-analysis', authenticateAdmin, async (req, res) => {
    const { roundId } = req.query;
    if (!roundId) {
        return res.status(400).json({ error: 'Round ID is required.' });
    }
    try {
        const { data: bets, error } = await supabase.from('lottery_bets').select('*').eq('round_id', roundId);
        if (error) throw error;

        if (!bets || bets.length === 0) {
            return res.json({ outcomes: [] });
        }

        const totalBetIn = bets.reduce((sum, bet) => sum + Number(bet.bet_amount), 0);
        const outcomes = [];

        for (let a = 0; a <= 9; a++) {
            for (let b = a; b <= 9; b++) {
                let currentPayout = 0;
                let totalBetOnPair = 0;

                bets.forEach(bet => {
                    const isSingleBet = bet.selected_num_b === null;
                    if (isSingleBet) {
                        if (bet.selected_num_a === a || bet.selected_num_a === b) {
                             currentPayout += Number(bet.bet_amount) * 2.5;
                        }
                    } else { // Double bet
                        if ((bet.selected_num_a === a && bet.selected_num_b === b) || (bet.selected_num_a === b && bet.selected_num_b === a)) {
                            currentPayout += Number(bet.bet_amount) * 25;
                            totalBetOnPair += Number(bet.bet_amount);
                        }
                    }
                });
                
                const netResult = totalBetIn - currentPayout;
                outcomes.push({ a, b, payout: currentPayout, netResult, totalBetOnPair });
            }
        }
        
        outcomes.sort((x, y) => y.netResult - x.netResult); // Sort by most profitable for admin
        
        res.json({ outcomes });
    } catch (err) {
        console.error('Lottery analysis error:', err);
        res.status(500).json({ error: 'Failed to analyze lottery round.' });
    }
});


app.get('/api/admin/lottery-analysis/:roundId', authenticateAdmin, async (req, res) => {
    const { roundId } = req.params;
    try {
        const { data: bets, error } = await supabase.from('lottery_bets').select('*').eq('round_id', roundId);
        if (error) throw error;

        const totalBetIn = bets.reduce((sum, bet) => sum + parseFloat(bet.bet_amount), 0);
        const analysis = [];

        for (let a = 0; a <= 9; a++) {
            for (let b = a; b <= 9; b++) {
                let payout = 0;
                let totalBetOnPair = 0;
                bets.forEach(bet => {
                    const isDoubleBet = bet.selected_num_a !== null && bet.selected_num_b !== null;
                    const isSingleBet = bet.selected_num_a !== null && bet.selected_num_b === null;
                    if (isDoubleBet && ((bet.selected_num_a === a && bet.selected_num_b === b) || (bet.selected_num_a === b && bet.selected_num_b === a))) {
                        payout += bet.bet_amount * 25;
                        totalBetOnPair += bet.bet_amount;
                    } else if (isSingleBet && (bet.selected_num_a === a || bet.selected_num_a === b)) {
                        payout += bet.bet_amount * 2.5;
                    }
                });
                analysis.push({ a, b, totalBetOnPair, payout, netResult: totalBetIn - payout });
            }
        }
        analysis.sort((x, y) => y.netResult - x.netResult); // Sort by most profitable for admin
        res.json({ analysis });
    } catch (err) {
        res.status(500).json({ error: 'Failed to analyze lottery round.' });
    }
});

app.post('/api/admin/lottery-mode', authenticateAdmin, (req, res) => {
    const { mode } = req.body;
    if (['auto', 'admin'].includes(mode)) {
        lotteryMode = mode;
        res.json({ message: `Lottery mode set to ${mode}.` });
    } else {
        res.status(400).json({ error: 'Invalid mode.' });
    }
});

app.post('/api/admin/lottery-set-result', authenticateAdmin, async (req, res) => {
    const { roundId, winning_num_a, winning_num_b } = req.body;
    adminLotteryChoice = { roundId, winning_num_a, winning_num_b };
    res.json({ message: `Next result for round ${roundId} has been manually set to ${winning_num_a}, ${winning_num_b}. It will be finalized at the draw time.` });
});





// ==========================================


app.get('/api/admin/game-status', authenticateAdmin, async (req, res) => {
    try { 
        const { data, error } = await supabase.from('game_state').select('*').single(); 
        if (error) throw error; 
        res.json({ status: data }); 
    } catch (err) { 
        res.status(500).json({ error: 'Failed to fetch game status.' }); 
    }
});

app.post('/api/admin/game-status', authenticateAdmin, async (req, res) => {
    const { is_on, mode, payout_priority } = req.body;
    const updateData = {};
    if (typeof is_on === 'boolean') updateData.is_on = is_on;
    if (['auto', 'admin'].includes(mode)) updateData.mode = mode;
    if (['users', 'admin'].includes(payout_priority)) updateData.payout_priority = payout_priority;

    if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'No valid update data provided.' });
    try { 
        const { data, error } = await supabase.from('game_state').update(updateData).eq('id', 1).select().single(); 
        if (error) throw error; 
        res.json({ message: 'Game status updated.', status: data }); 
    } catch (err) { 
        res.status(500).json({ error: 'Failed to update game status.' }); 
    }
});

app.post('/api/admin/game-next-result', authenticateAdmin, async (req, res) => {
    try { 
        await supabase.from('game_state').update({ next_result: req.body.result }).eq('id', 1); 
        res.json({ message: 'Next result set.' }); 
    } catch(err) { 
        res.status(500).json({ error: 'Failed to set next result.' }); 
    }
});

app.get('/api/admin/game-statistics', authenticateAdmin, async (req, res) => {
    try {
        const { data: gameState, error: gsError } = await supabase.from('game_state').select('current_period').single();
        if (gsError) throw gsError;
        const current_period = gameState.current_period;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");
        const today_start_period = Number(yyyymmdd + "0001");

        const [
            { data: totalStats, error: totalErr },
            { data: todayStats, error: todayErr },
            { data: currentStats, error: currentErr }
        ] = await Promise.all([
            supabase.from('bets').select('amount, payout'),
            supabase.from('bets').select('amount, payout').gte('game_period', today_start_period),
            supabase.from('bets').select('amount, payout').eq('game_period', current_period)
        ]);

        if (totalErr || todayErr || currentErr) throw totalErr || todayErr || currentErr;

        const calculatePL = (records) => {
            if (!records) return { totalIn: 0, totalOut: 0, pl: 0 };
            const totalIn = records.reduce((sum, r) => sum + (r.amount || 0), 0);
            const totalOut = records.reduce((sum, r) => sum + (r.payout || 0), 0);
            return { totalIn, totalOut, pl: totalIn - totalOut };
        };

        res.json({
            total: calculatePL(totalStats),
            today: calculatePL(todayStats),
            currentPeriod: calculatePL(currentStats)
        });

    } catch (error) {
        console.error("Error fetching game statistics:", error);
        res.status(500).json({ error: 'Failed to fetch game statistics.' });
    }
});

// ✅ FIX: Create the missing /api/admin/current-bets endpoint
app.get('/api/admin/current-bets', authenticateAdmin, async (req, res) => {
    try {
        const { data: gameState, error: gsError } = await supabase.from('game_state').select('current_period').single();
        if (gsError) throw gsError;
        
        const { data: bets, error: betsError } = await supabase.from('bets').select('bet_on, amount').eq('game_period', gameState.current_period);
        if (betsError) throw betsError;

        const summary = { 'Red': 0, 'Green': 0, 'Violet': 0, '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0 };
        bets.forEach(bet => {
            if (summary.hasOwnProperty(bet.bet_on)) {
                summary[bet.bet_on] += parseFloat(bet.amount);
            }
        });
        res.json({ summary });
    } catch (err) {
        console.error("Error fetching current bets:", err);
        res.status(500).json({ error: 'Failed to fetch current bets.' });
    }
});

// ✅ NEW: Endpoint for the "Admin's Choice" feature
app.get('/api/admin/game-outcome-analysis', authenticateAdmin, async (req, res) => {
    try {
        const { data: gameState, error: gsError } = await supabase.from('game_state').select('current_period').single();
        if (gsError) throw gsError;

        const { data: bets, error: betsError } = await supabase.from('bets').select('bet_on, amount').eq('game_period', gameState.current_period);
        if (betsError) throw betsError;

        const totalBetIn = bets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
        const outcomes = Array.from({ length: 10 }, (_, i) => {
            const winningColors = getNumberProperties(i);
            let totalPayout = 0;
            bets.forEach(bet => {
                let multiplier = 0;
                if (bet.bet_on == i.toString()) multiplier = 9.2;
                else if (winningColors.includes(bet.bet_on)) multiplier = bet.bet_on === 'Violet' ? 4.5 : 1.98;
                totalPayout += parseFloat(bet.amount) * multiplier;
            });
            return { number: i, pl: totalBetIn - totalPayout };
        });

        outcomes.sort((a, b) => b.pl - a.pl); // Sort by P/L descending (most profitable for admin first)
        
        const analysis = {
            mostProfitable: outcomes.slice(0, 3),
            leastProfitable: outcomes.slice(-3).reverse() // Last 3, reversed to show worst at the bottom
        };

        res.json(analysis);
    } catch (err) {
        console.error("Error analyzing game outcomes:", err);
        res.status(500).json({ error: 'Failed to analyze outcomes.' });
    }
});

// ==========================================
// ========== DAILY SCHEDULED TASK ==========
// ==========================================
async function dailyInvestmentUpdate() {
    console.log('Running daily investment update...');
    try {
        const { data, error } = await supabase.rpc('update_daily_investments');
        if (error) throw error;
        console.log(`Daily investment update complete. ${data} investments processed.`);
    } catch (error) {
        console.error('Error running daily investment update:', error);
    }
}

// Run the task once on server start, then every 24 hours
dailyInvestmentUpdate();
setInterval(dailyInvestmentUpdate, 24 * 60 * 60 * 1000);

// ==========================================
// ============== SERVER START ==============
// ==========================================
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});


// ✅ NEW: Create a WebSocket server that does not bind to a port on its own
const wss = new WebSocketServer({ noServer: true });

// ... (Your server start and wss declaration are correct)

// ✅ CORRECTED: WebSocket connection handler with consolidated try/catch block
wss.on('connection', ws => {
    console.log('Client connected to WebSocket');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());

            // --- Consolidated game logic within the single try block ---
            if (data.game === 'color-prediction' && data.action === 'bet') {
                const { amount, bet_on, token } = data.payload;
                if (!token) return;
                const user = jwt.verify(token, process.env.JWT_SECRET);
                if (!user || !user.id) return;

                const { data: gameState } = await supabase.from('game_state').select('current_period, countdown_start_time').single();
                const timeLeft = GAME_DURATION_SECONDS - Math.floor((new Date() - new Date(gameState.countdown_start_time)) / 1000);
                
                if (timeLeft > (GAME_DURATION_SECONDS - BETTING_WINDOW_SECONDS)) {
                    const { error: betError } = await supabase.rpc('handle_bet_deduction', { p_user_id: user.id, p_amount: amount });
                    if (betError) {
                        ws.send(JSON.stringify({ type: 'BET_ERROR', message: 'Insufficient balance.' }));
                        return;
                    }
                    
                    await supabase.from('bets').insert([{ user_id: user.id, game_period: gameState.current_period, amount, bet_on }]);
                    ws.send(JSON.stringify({ type: 'BET_SUCCESS', message: 'Bet placed!' }));
                } else {
                    ws.send(JSON.stringify({ type: 'BET_ERROR', message: 'Betting window has closed.' }));
                }
            }

            // --- Your Pushpa Game Logic, moved inside the try block ---
            if (data.game === 'pushpa') {
                const { token } = data.payload;
                if (!token) return;
                const user = jwt.verify(token, process.env.JWT_SECRET);
                if (!user && !user.id) return;

                if (data.action === 'bet') {
                    if (pushpaGameState.status !== 'waiting') {
                        return ws.send(JSON.stringify({ type: 'PUSHPA_BET_ERROR', message: 'Betting window is closed.' }));
                    }
                    const { betAmount, roundId } = data.payload;

                    const { error } = await supabase.rpc('place_pushpa_bet', {
                        p_user_id: user.id,
                        p_round_id: roundId,
                        p_bet_amount: betAmount
                    });

                    if (error) {
                        console.error("Pushpa bet error:", error);
                        return ws.send(JSON.stringify({ type: 'PUSHPA_BET_ERROR', message: 'Insufficient balance.' }));
                    }

                    ws.send(JSON.stringify({ type: 'PUSHPA_BET_SUCCESS' }));
                }

                if (data.action === 'cashout') {
                    if (pushpaGameState.status !== 'running') return;
                    const { roundId } = data.payload;

                    const { data: result, error } = await supabase.rpc('cashout_pushpa_bet', {
                        p_user_id: user.id,
                        p_round_id: roundId,
                        p_cashout_multiplier: pushpaGameState.multiplier
                    });

                    if (error || !result || !result.success) {
                        console.error("Pushpa cashout error:", error);
                        return;
                    }

                    ws.send(JSON.stringify({ type: 'PUSHPA_CASHOUT_SUCCESS', payout: result.payout }));
                }
            }

        } catch (e) {
            // ✅ All errors from both game logics are now caught here
            console.error('Failed to process WebSocket message:', e);
        }
    });

    ws.on('close', () => console.log('Client disconnected'));
});


// Start the game loop
gameLoop();
runPushpaGameCycle();
