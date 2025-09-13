const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron'); // ✅ FIX: This line was missing

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 10000;

console.log(`Attempting to start server on port: ${PORT}`);

// Middleware
app.use(cors({ origin: ['https://amit-sigma.vercel.app', 'http://localhost:3000'] }));
app.use(express.json());

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

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

// ==========================================
// ========== USER-FACING API ENDPOINTS =====
// ==========================================
app.post('/api/register', async (req, res) => {
    const { username, mobile, password, referralCode } = req.body;
    if (!username || !mobile || !password) { return res.status(400).json({ error: 'Missing required fields' }); }
    try {
        const ip_username = generateIpUsername(username);
        const { data: existingUser } = await supabase.from('users').select('id').or(`mobile.eq.${mobile},ip_username.eq.${ip_username}`).limit(1);
        if (existingUser && existingUser.length > 0) { return res.status(400).json({ error: 'User with this mobile or username format already exists' }); }

        let referredById = null;
        if (referralCode && referralCode.trim() !== '') {
            const { data: referrer } = await supabase.from('users').select('id').eq('ip_username', referralCode.trim()).single();
            if (!referrer) { return res.status(400).json({ error: 'Invalid referral code provided.' }); }
            referredById = referrer.id;
        }

        const { data: newUser, error: insertError } = await supabase.from('users').insert([{ name: username, mobile, password, ip_username, referred_by: referredById, email: `${mobile}@example.com`, balance: 50 }]).select().single();
        if (insertError) throw insertError;

        const token = jwt.sign({ id: newUser.id, name: newUser.name, is_admin: newUser.is_admin }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ message: 'User registered successfully', token });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ error: 'An error occurred during registration.' });
    }
});

// ✅ UPDATED: Login now creates a welcome notification
app.post('/api/login', async (req, res) => {
    const { mobile, password } = req.body;
    if (!mobile || !password) { return res.status(400).json({ error: 'Mobile and password are required' }); }
    try {
        const { data: user, error } = await supabase.from('users').select('*').eq('mobile', mobile).single();
        if (error || !user || user.password !== password) { return res.status(400).json({ error: 'Invalid credentials' }); }
        
        // Create welcome notification
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

app.get('/api/data', authenticateToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase.from('users').select('id, name, ip_username, email, mobile, balance, withdrawable_wallet, is_admin, avatar_url,status').eq('id', req.user.id).single();
        if (error) return res.status(404).json({ error: 'User not found for this session.' });
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

// app.get('/api/financial-summary', authenticateToken, async (req, res) => {
//     try {
//         const { data: user, error } = await supabase.from('users').select('balance, withdrawable_wallet').eq('id', req.user.id).single();
//         if (error) return res.status(404).json({ error: 'User not found for this session.' });
//         res.json({ balance: user.balance, withdrawable_wallet: user.withdrawable_wallet, todaysIncome: 0, totalIncome: 0 });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to fetch financial summary' });
//     }
// });

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

// ✅ NEW: Endpoint to mark notifications as read
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

// ✅ NEW: Endpoint to delete all read notifications
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


app.post('/api/recharge', authenticateToken, async (req, res) => {
    const { amount, utr } = req.body;
    if (!amount || amount <= 0 || !utr || utr.trim() === '') { return res.status(400).json({ error: 'Valid amount and UTR are required' }); }
    try {
        const { data: existingRecharge } = await supabase.from('recharges').select('id').eq('utr', utr.trim()).eq('status', 'approved').limit(1);
        if (existingRecharge && existingRecharge.length > 0) {
            return res.status(400).json({ error: 'This transaction ID has already been used.' });
        }
        const { error } = await supabase.from('recharges').insert([{ user_id: req.user.id, amount, utr: utr.trim() }]);
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
    if (!amount || !method || !details) {
        return res.status(400).json({ error: "Amount, method, and details are required." });
    }
    try {
        const { data, error } = await supabase.rpc('request_withdrawal', {
            p_user_id: req.user.id,
            p_amount: amount,
            p_method: method,
            p_details: details
        });

        if (error) throw error;
        
        const result = data[0];
        if (!result.success) {
            return res.status(400).json({ error: result.message });
        }

        // Create a notification for the successful request
        await supabase.from('notifications').insert({
            user_id: req.user.id,
            type: 'withdrawal',
            message: `Your withdrawal request of ₹${amount.toLocaleString()} has been submitted successfully.`
        });

        res.json({ message: result.message });
    } catch (error) {
        console.error("Withdrawal API Error:", error);
        res.status(500).json({ error: 'Failed to submit withdrawal request.' });
    }
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

app.post('/api/purchase-plan', authenticateToken, async (req, res) => {
    const { data: user, error: userError } = await supabase.from('users').select('status').eq('id', req.user.id).single();
        if (userError) throw userError;

        if (['flagged', 'non-active'].includes(user.status)) {
            return res.status(403).json({ error: 'You are not authorised to do this action. Please contact support.' });
        }
    const { id, price, name, durationDays } = req.body;
    if (!id || !price || !name || !durationDays) {
        return res.status(400).json({ error: 'Missing required plan details.' });
    }
    try {
        const userId = req.user.id;
        const { data: deductionSuccess, error: rpcError } = await supabase.rpc('deduct_from_total_balance_for_purchase', { p_user_id: userId, p_amount: price });
        if (rpcError || !deductionSuccess) {
            return res.status(400).json({ error: 'Insufficient total balance.' });
        }
        const { error: investmentError } = await supabase.from('investments').insert([{ user_id: userId, plan_id: id, plan_name: name, amount: price, status: 'active', days_left: durationDays }]);
        if (investmentError) {
            await supabase.rpc('increment_user_balance', { p_user_id: userId, p_amount: price });
            throw new Error('Failed to record investment after purchase.');
        }
        res.json({ message: 'Plan purchased successfully!' });
    } catch (error) {
        console.error('Plan purchase error:', error.message);
        res.status(500).json({ error: 'Failed to purchase plan. Please try again.' });
    }
});

// ✅ FIX: This endpoint now correctly orders by 'start_date'
app.get('/api/investments', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('investments')
            .select(`id, plan_name, amount, status, days_left, product_plans(daily_income)`)
            .eq('user_id', req.user.id)
            .order('start_date', { ascending: false });

        if (error) throw error;
        
        const formattedData = data.map(inv => ({
            ...inv,
            daily_income: inv.product_plans ? inv.product_plans.daily_income : 0
        }));

        res.json({ investments: formattedData });
    } catch (error) {
        console.error("Failed to fetch investments:", error);
        res.status(500).json({ error: 'Failed to fetch user investments.' });
    }
});



// ✅ UPDATED: This endpoint now fetches daily income claims and excludes game bets.
app.get('/api/transactions', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        // Step 1: Fetch all relevant financial data.
        // 'bets' have been removed and 'daily_claims' has been added.
        const [
            { data: recharges }, 
            { data: withdrawals }, 
            { data: investments },
            { data: dailyClaims } // NEW: Fetching daily income claims
        ] = await Promise.all([
            supabase.from('recharges').select('id, amount, status, created_at').eq('user_id', userId).eq('status', 'approved'),
            supabase.from('withdrawals').select('id, amount, status, created_at').eq('user_id', userId),
            supabase.from('investments').select('id, amount, plan_name, created_at').eq('user_id', userId),
            supabase.from('daily_claims').select('id, amount, created_at').eq('user_id', userId) // NEW
        ]);

        const formatted = [];
        // Step 2: Format each transaction type into a common structure.
        (recharges || []).forEach(r => formatted.push({ id: `dep-${r.id}`, type: 'Deposit', amount: r.amount, status: 'Completed', date: r.created_at }));
        (withdrawals || []).forEach(w => formatted.push({ id: `wd-${w.id}`, type: 'Withdrawal', amount: -w.amount, status: w.status, date: w.created_at }));
        (investments || []).forEach(i => formatted.push({ id: `inv-${i.id}`, type: 'Plan Purchase', amount: -i.amount, status: 'Completed', date: i.created_at, description: i.plan_name }));
        
        // NEW: Format the daily income claims as positive transactions.
        (dailyClaims || []).forEach(c => formatted.push({ id: `claim-${c.id}`, type: 'Daily Income', amount: c.amount, status: 'Claimed', date: c.created_at }));

        // REMOVED: The section that formatted bets and payouts has been deleted.
        
        // Step 3: Sort all transactions by date, most recent first.
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
            .limit(100); // Limit to the last 100 bets

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


// ==========================================
// ========== GAME LOGIC & ENDPOINTS ========
// ==========================================
const GAME_DURATION_SECONDS = 60;
const BETTING_WINDOW_SECONDS = 50;

async function runGameCycle() {
    try {
        const { data: gameState, error } = await supabase.from('game_state').select('*').single();
        if (error || !gameState || !gameState.is_on) return;

        const today = new Date();
        const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");
        const lastPeriodStr = gameState.current_period.toString();
        const lastDatePart = lastPeriodStr.substring(0, 8);

        let nextPeriod;
        if (lastDatePart === yyyymmdd) {
            nextPeriod = Number(gameState.current_period) + 1;
        } else {
            nextPeriod = Number(yyyymmdd + "0001");
        }

        const { data: bets, error: betsError } = await supabase.from('bets').select('*').eq('game_period', gameState.current_period);
        if (betsError) { console.error("Error fetching bets:", betsError); return; }

        let winningNumber;
        if (gameState.mode === 'admin' && gameState.next_result !== null) {
            winningNumber = gameState.next_result;
        } else {
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

            if (gameState.payout_priority === 'users' && bets.length > 0) {
                // User Priority Logic
                const colorBets = { Red: 0, Green: 0, Violet: 0 };
                const numberBets = Array(10).fill(0);
                bets.forEach(bet => {
                    if (['Red', 'Green', 'Violet'].includes(bet.bet_on)) {
                        colorBets[bet.bet_on] += parseFloat(bet.amount);
                    } else if (!isNaN(parseInt(bet.bet_on))) {
                        numberBets[parseInt(bet.bet_on)] += parseFloat(bet.amount);
                    }
                });
                
                const totalColorBet = Object.values(colorBets).reduce((a, b) => a + b, 0);
                const totalNumberBet = numberBets.reduce((a, b) => a + b, 0);

                if (totalColorBet >= totalNumberBet) {
                    const mostBetColor = Object.keys(colorBets).reduce((a, b) => colorBets[a] > colorBets[b] ? a : b);
                    const colorMap = {
                        Red: [1, 3, 7, 9, 0, 5],
                        Green: [2, 4, 6, 8, 5],
                        Violet: [0, 5]
                    };
                    const potentialNumbers = colorMap[mostBetColor];
                    winningNumber = potentialNumbers[Math.floor(Math.random() * potentialNumbers.length)];
                } else {
                    winningNumber = numberBets.indexOf(Math.max(...numberBets));
                }
            } else {
                // Admin Priority Logic (default)
                const minPayout = Math.min(...totalPayouts);
                const lowestPayoutNumbers = totalPayouts.map((p, i) => p === minPayout ? i : -1).filter(i => i !== -1);
                winningNumber = lowestPayoutNumbers[Math.floor(Math.random() * lowestPayoutNumbers.length)];
            }
        }
        
        const winningColors = getNumberProperties(winningNumber);
        await supabase.from('game_results').insert({ game_period: gameState.current_period, result_number: winningNumber });
        
        for (const bet of bets) {
            let payout = 0; 
            let status = 'lost';
            if (bet.bet_on == winningNumber.toString() || winningColors.includes(bet.bet_on)) {
                status = 'won';
                if (bet.bet_on == winningNumber.toString()) payout += parseFloat(bet.amount) * 9.2;
                if (winningColors.includes(bet.bet_on)) payout += parseFloat(bet.amount) * (bet.bet_on === 'Violet' ? 4.5 : 1.98);
            }
            
            if (payout > 0) await supabase.rpc('increment_user_withdrawable_wallet', { p_user_id: bet.user_id, p_amount: payout });
            await supabase.from('bets').update({ status, payout }).eq('id', bet.id);
        }

        await supabase.from('game_state').update({
            current_period: nextPeriod,
            countdown_start_time: new Date().toISOString(),
            next_result: null
        }).eq('id', 1);

    } catch (e) {
        console.error("Game Cycle Error:", e);
    }
}
setInterval(runGameCycle, GAME_DURATION_SECONDS * 1000);

app.get('/api/game-state', authenticateToken, async (req, res) => {
    const { data: gameState, error } = await supabase.from('game_state').select('*').single();
    if (error) return res.status(500).json({ error: 'Failed to fetch game state' });
    
    if (gameState.maintenance_mode && !gameState.whitelisted_users.includes(req.user.id)) {
        return res.json({ maintenance: true });
    }
    
    const timeLeft = GAME_DURATION_SECONDS - Math.floor((new Date() - new Date(gameState.countdown_start_time)) / 1000);
    const canBet = timeLeft > (GAME_DURATION_SECONDS - BETTING_WINDOW_SECONDS);
    const { data: results } = await supabase.from('game_results').select('*').order('created_at', { ascending: false }).limit(20);
    
    res.json({ ...gameState, time_left: timeLeft > 0 ? timeLeft : 0, can_bet: canBet, results });
});

app.post('/api/bet', authenticateToken, async (req, res) => {
    const { data: user, error: userError } = await supabase.from('users').select('status').eq('id', req.user.id).single();
        if (userError) throw userError;

        if (['flagged', 'non-active'].includes(user.status)) {
            return res.status(403).json({ error: 'You are not authorised to do this action. Please contact support.' });
        }
    
    const { amount, bet_on } = req.body;
    if (!amount || amount < 10 || !bet_on) { return res.status(400).json({ error: 'Invalid bet details. Minimum bet is ₹10.' }); }
    
    try {
        const { data: gameState } = await supabase.from('game_state').select('*').single();
        const timeLeft = GAME_DURATION_SECONDS - Math.floor((new Date() - new Date(gameState.countdown_start_time)) / 1000);
        
        if (timeLeft <= (GAME_DURATION_SECONDS - BETTING_WINDOW_SECONDS)) {
            return res.status(400).json({ error: 'Betting window is closed for this round.' });
        }

        const { data: betResult, error: betError } = await supabase.rpc('handle_bet_deduction', { p_user_id: req.user.id, p_amount: amount });
        if (betError || !betResult) { return res.status(400).json({ error: 'Insufficient balance.' }); }

        const { error: insertError } = await supabase.from('bets').insert([{ user_id: req.user.id, game_period: gameState.current_period, amount, bet_on }]);
        if (insertError) throw insertError;

        res.json({ message: 'Bet placed successfully.' });
    } catch (error) {
        console.error("Bet placement error:", error);
        res.status(500).json({ error: 'Failed to place bet.' });
    }
});

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
app.get('/api/financial-summary', authenticateToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('balance, withdrawable_wallet, todays_income_unclaimed, last_claim_at')
            .eq('id', req.user.id)
            .single();

        if (error) throw error;
        
        res.json({ 
            balance: user.balance, 
            withdrawable_wallet: user.withdrawable_wallet, 
            todaysIncome: user.todays_income_unclaimed,
            lastClaimAt: user.last_claim_at // Send the last claim time to the frontend
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch financial summary' });
    }
});

// ✅ UPDATED: This endpoint now correctly joins with product_plans to get daily_income
app.get('/api/investments', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('investments')
            .select(`
                id,
                plan_name,
                amount,
                status,
                days_left,
                product_plans ( daily_income )
            `)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Flatten the nested product_plans object for easier frontend use
        const formattedData = data.map(inv => ({
            ...inv,
            daily_income: inv.product_plans ? inv.product_plans.daily_income : 0
        }));

        res.json({ investments: formattedData });
    } catch (error) {
        console.error("Failed to fetch investments:", error);
        res.status(500).json({ error: 'Failed to fetch user investments.' });
    }
});

// ✅ UPDATED: This endpoint now uses the new, secure database function
app.post('/api/claim-income', authenticateToken, async (req, res) => {
    try {
        const { data: claimedAmount, error } = await supabase.rpc('process_income_claim', { p_user_id: req.user.id });
        if (error) throw error;

        if (claimedAmount > 0) {
            res.json({ message: `Successfully claimed ₹${claimedAmount}. It has been added to your withdrawable balance.` });
        } else {
            res.status(400).json({ error: 'You have no income to claim, or you must wait 24 hours since your last claim.' });
        }
    } catch (error) {
        console.error('Claim income error:', error);
        res.status(500).json({ error: 'Failed to claim income. An error occurred on the server.' });
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
app.get('/api/admin/recharges/pending', authenticateAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('recharges').select('*').eq('status', 'pending').order('request_date', { ascending: true });
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

        // Step 1: Update user's balance
        await supabase.rpc('increment_user_balance', { p_user_id: recharge.user_id, p_amount: recharge.amount });
        
        // Step 2: Update recharge status
        await supabase.from('recharges').update({ status: 'approved', processed_date: new Date() }).eq('id', id);

        // Step 3: Trigger the referral bonus function in the database
        const { error: referralError } = await supabase.rpc('handle_deposit_referral', {
            depositing_user_id: recharge.user_id,
            deposit_id: recharge.id,
            deposit_amount: recharge.amount
        });
        if (referralError) {
            // Log the error but don't fail the entire request, as the deposit was successful
            console.error("Referral processing error:", referralError);
        }

        // Step 4: Create a notification for the user who deposited
        await supabase.from('notifications').insert({
            user_id: recharge.user_id, type: 'deposit',
            message: `Your deposit of ₹${recharge.amount.toLocaleString()} has been approved.`
        });

        res.json({ message: 'Deposit approved, notification sent, and referral bonuses processed.' });
    } catch (err) {
        console.error("Approve deposit error:", err);
        res.status(500).json({ error: 'Failed to approve deposit.' });
    }
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
        const { data, error } = await supabase.from('daily_profits').select('last_run_at').eq('task_name', 'distribute_income').maybeSingle();

        // If we get an error other than "no rows found", it's a real problem.
        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        // If no record exists (data is null), it means the task has never run.
        // In this case, the admin should be allowed to run it for the first time.
        if (!data) {
            return res.json({
                canDistribute: true,
                nextDistributionTime: new Date().toISOString()
            });
        }

        const lastRun = new Date(data.last_run_at);
        const now = new Date();
        const nextRun = new Date(lastRun.getTime() + 24 * 60 * 60 * 1000);

        res.json({
            canDistribute: now > nextRun,
            nextDistributionTime: nextRun.toISOString()
        });
    } catch (error) {
        console.error("Error fetching income status:", error);
        res.status(500).json({ error: 'Failed to fetch income distribution status.' });
    }
});

app.post('/api/admin/distribute-income', authenticateAdmin, async (req, res) => {
    const { userId } = req.body;
    try {
        if (!userId) {
            // ✅ FIX: Changed table name from 'daily_tasks' to 'daily_profits'
            const { data: task } = await supabase.from('daily_profits').select('last_run_at').eq('task_name', 'distribute_income').single();
            const lastRun = new Date(task.last_run_at);
            const now = new Date();
            if (now.getTime() - lastRun.getTime() < 24 * 60 * 60 * 1000) {
                return res.status(400).json({ error: `You can only distribute globally once every 24 hours.` });
            }
        }

        let query = supabase.from('investments').select('user_id, product_plans(daily_income)').eq('status', 'active');
        if (userId) {
            query = query.eq('user_id', userId);
        }
        
        const { data: activeInvestments, error: fetchError } = await query;
        if (fetchError) throw fetchError;

        const incomeDistribution = {};
        for (const investment of activeInvestments) {
            if (investment.product_plans) {
                incomeDistribution[investment.user_id] = (incomeDistribution[investment.user_id] || 0) + investment.product_plans.daily_income;
            }
        }

        for (const uid in incomeDistribution) {
            await supabase.rpc('increment_unclaimed_income', { p_user_id: parseInt(uid), p_amount: incomeDistribution[uid] });
        }
        
        if (!userId) {
             // ✅ FIX: Changed table name from 'daily_tasks' to 'daily_profits'
            await supabase.from('daily_profits').update({ last_run_at: new Date().toISOString() }).eq('task_name', 'distribute_income');
        }
        
        const message = userId ? `Successfully distributed income to user ${userId}.` : `Daily income distributed to ${Object.keys(incomeDistribution).length} users.`;
        res.json({ message });

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


// ==========================================
// ========== ADMIN GAME API ENDPOINTS ===========
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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

