const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 10000;

console.log(`Attempting to start server on port: ${PORT}`);

// Middleware
// CRITICAL FIX: Specific CORS configuration to allow your Vercel frontend
const corsOptions = {
  origin: 'https://amit-sigma.vercel.app',
  optionsSuccessStatus: 200 // For legacy browser support
};
app.use(cors(corsOptions));
app.use(express.json());


// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

// ==========================================
// ========== AUTHENTICATION MIDDLEWARE =====
// ==========================================

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

const authenticateAdmin = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { data: user, error } = await supabase.from('users').select('is_admin').eq('id', decoded.id).single();
        if (error || !user || !user.is_admin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        req.user = decoded; // Attach user info to the request
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// ==========================================
// ============== HELPER FUNCTIONS ==========
// ==========================================

const generateIpUsername = (username) => {
    let namePart = username.replace(/[^a-zA-Z0-9]/g, '');
    if (namePart.length < 6) {
        namePart = namePart.padEnd(6, '123456'.substring(namePart.length));
    } else {
        namePart = namePart.substring(0, 6);
    }
    return `${namePart}@${username.length}`;
};

// --- USER-FACING API ENDPOINTS ---
app.post('/api/register', async (req, res) => {
    const { username, mobile, password, referralCode } = req.body;
    if (!username || !mobile || !password) { return res.status(400).json({ error: 'Missing required fields' }); }
    try {
        const ip_username = generateIpUsername(username);
        const { data: existingUser, error: existingUserError } = await supabase.from('users').select('id').or(`mobile.eq.${mobile},ip_username.eq.${ip_username}`).limit(1);
        if(existingUserError) throw existingUserError;
        if (existingUser && existingUser.length > 0) { return res.status(400).json({ error: 'User with this mobile or username format already exists' }); }

        let referredById = null;
        if (referralCode && referralCode.trim() !== '') {
            const { data: referrer, error: referrerError } = await supabase.from('users').select('id').eq('ip_username', referralCode.trim()).single();
            if (referrerError && referrerError.code !== 'PGRST116') { // PGRST116 means no rows found, which is an expected case
                throw referrerError;
            }
            if (!referrer) {
                return res.status(400).json({ error: 'Invalid referral code provided.' });
            }
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
            const { data: referrer } = await supabase.from('users').select('id').eq('ip_username', referralCode).single();
            if (referrer) referredById = referrer.id;
        }

        const { data: newUser, error } = await supabase.from('users').insert([{ name: username, mobile, password, ip_username, referred_by: referredById, email: `${mobile}@example.com`, balance: 50 }]).select().single();
        if (error) throw error;
        
        const token = jwt.sign({ id: newUser.id, name: newUser.name, is_admin: newUser.is_admin }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ message: 'User registered', token });
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

app.post('/api/login', async (req, res) => {
    const { mobile, password } = req.body;
    if (!mobile || !password) { return res.status(400).json({ error: 'Mobile and password are required' }); }
    try {
        const { data: user, error } = await supabase.from('users').select('*').eq('mobile', mobile).single();
        if (error || !user || user.password !== password) { return res.status(400).json({ error: 'Invalid credentials' }); }
        
        const token = jwt.sign({ id: user.id, name: user.name, is_admin: user.is_admin }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, is_admin: user.is_admin } });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

app.get('/api/data', authenticateToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase.from('users').select('id, name, email, mobile, balance, withdrawable_wallet, is_admin, avatar_url').eq('id', req.user.id).single();
        if (error) return res.status(404).json({ error: 'User not found for this session.' });
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

app.get('/api/financial-summary', authenticateToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase.from('users').select('balance, withdrawable_wallet').eq('id', req.user.id).single();
        if (error) return res.status(404).json({ error: 'User not found for this session.' });
        res.json({ balance: user.balance, withdrawable_wallet: user.withdrawable_wallet, todaysIncome: 0, totalIncome: 0, teamIncome: 0 });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch financial summary' });
    }
});

app.post('/api/recharge', authenticateToken, async (req, res) => {
    const { amount, utr } = req.body;
    if (!amount || amount <= 0 || !utr || utr.trim() === '') { return res.status(400).json({ error: 'Valid amount and UTR are required' }); }
    try {
        const { error } = await supabase.from('recharges').insert([{ user_id: req.user.id, amount, utr, request_date: new Date().toISOString() }]);
        if (error) throw error;
        res.json({ message: 'Recharge request submitted.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit recharge.' });
    }
});

app.post('/api/withdraw', authenticateToken, async (req, res) => {
    const { amount, method, details } = req.body;
    if (!amount || amount < 100 || !method || !details) { return res.status(400).json({ error: 'Invalid withdrawal details.' }); }
    try {
        const { data: user, error: userError } = await supabase.from('users').select('withdrawable_wallet').eq('id', req.user.id).single();
        if (userError || !user) { return res.status(404).json({ error: 'User not found.' }); }
        if (user.withdrawable_wallet < amount) { return res.status(400).json({ error: 'Insufficient balance.' }); }
        
        await supabase.rpc('decrement_user_withdrawable_wallet', { p_user_id: req.user.id, p_amount: amount });
        
        const { error } = await supabase.from('withdrawals').insert([{ user_id: req.user.id, amount, method, details, gst_amount: amount * 0.18, net_amount: amount * 0.82 }]);
        if (error) {
            await supabase.rpc('increment_user_withdrawable_wallet', { p_user_id: req.user.id, p_amount: amount });
            throw error;
        }
        res.json({ message: 'Withdrawal request submitted.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit withdrawal.' });
    }
});

app.get('/api/investments', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from('investments').select('*').eq('user_id', req.user.id);
        if (error) throw error;
        res.json({ investments: data });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch investments.' });
    }
});

app.get('/api/bet-history', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from('bets').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(50);
        if (error) throw error;
        res.json({ history: data });
    } catch (error) {
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

app.get('/api/referral-details', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data: user, error: userError } = await supabase.from('users').select('ip_username').eq('id', userId).single();
        if(userError) throw userError;

        const { data: referredUsersData, error: referredUsersError } = await supabase.from('users').select('id, name').eq('referred_by', userId);
        if(referredUsersError) throw referredUsersError;

        const referredUserIds = referredUsersData.map(u => u.id);
        
        const { data: commissions, error: commissionError } = await supabase.from('referral_commissions').select('referred_user_id, commission_amount').in('referred_user_id', referredUserIds);
        if(commissionError) throw commissionError;
        
        const bonusMap = commissions.reduce((acc, curr) => {
            acc[curr.referred_user_id] = (acc[curr.referred_user_id] || 0) + parseFloat(curr.commission_amount);
            return acc;
        }, {});

        const referredUsers = referredUsersData.map(u => ({...u, bonusEarned: bonusMap[u.id] || 0 }));
        
        res.json({
            referralLink: `https://YOUR_FRONTEND_URL/register?ref=${user.ip_username}`,
            activeReferrals: 0, // Placeholder logic
            referredUsers: referredUsers,
            totalRewards: Object.values(bonusMap).reduce((sum, val) => sum + val, 0)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get referral details.' });
    }
});


// ==========================================
// ========== GAME LOGIC & ENDPOINTS ========
// ==========================================
const GAME_DURATION_SECONDS = 60;
const BETTING_WINDOW_SECONDS = 50;

// CRITICAL FIX: Added explicit 'return colors;'
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
            if (!bets || bets.length === 0) {
                winningNumber = Math.floor(Math.random() * 10);
            } else {
                const totalPayouts = Array(10).fill(0);
                let totalBetAmount = bets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
                for (let i = 0; i < 10; i++) {
                    const potentialColors = getNumberProperties(i);
                    bets.forEach(bet => {
                        if (bet.bet_on == i.toString()) totalPayouts[i] += parseFloat(bet.amount) * 9.2;
                        if (potentialColors.includes(bet.bet_on)) {
                            totalPayouts[i] += parseFloat(bet.amount) * (bet.bet_on === 'Violet' ? 4.5 : 1.98);
                        }
                    });
                }
                
                let minPayout = Infinity;
                let potentialWinners = [];
                for (let i = 0; i < 10; i++) {
                    if (totalPayouts[i] <= totalBetAmount * 0.9) {
                         if (totalPayouts[i] < minPayout) {
                            minPayout = totalPayouts[i];
                            potentialWinners = [i];
                        } else if (totalPayouts[i] === minPayout) {
                            potentialWinners.push(i);
                        }
                    }
                }
                if (potentialWinners.length > 0) {
                    winningNumber = potentialWinners[Math.floor(Math.random() * potentialWinners.length)];
                } else {
                    minPayout = Math.min(...totalPayouts);
                    const lowestLossNumbers = totalPayouts.map((p, i) => p === minPayout ? i : -1).filter(i => i !== -1);
                    winningNumber = lowestLossNumbers.length > 0 ? lowestLossNumbers[Math.floor(Math.random() * lowestLossNumbers.length)] : Math.floor(Math.random() * 10);
                }
            }
        }

        const winningColors = getNumberProperties(winningNumber);
        await supabase.from('game_results').insert({ game_period: gameState.current_period, result_number: winningNumber });
        
        for (const bet of bets) {
            let payout = 0; let status = 'lost';
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

// ==========================================
// ========== ADMIN API ENDPOINTS ===========
// ==========================================

app.get('/api/admin/recharges/pending', authenticateAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('recharges').select('*').eq('status', 'pending').order('request_date', { ascending: true });
        if (error) throw error;
        res.json({ recharges: data });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch pending deposits.' });
    }
});

app.get('/api/admin/withdrawals/pending', authenticateAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('withdrawals').select('*').eq('status', 'pending').order('request_date', { ascending: true });
        if (error) throw error;
        res.json({ withdrawals: data });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch pending withdrawals.' });
    }
});

app.post('/api/admin/recharge/:id/approve', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { data: recharge, error: fetchError } = await supabase.from('recharges').select('*').eq('id', id).single();
        if (fetchError || !recharge) return res.status(404).json({ error: 'Recharge not found.' });
        if (recharge.status !== 'pending') return res.status(400).json({ error: 'Recharge is not pending.' });
        await supabase.rpc('increment_user_balance', { p_user_id: recharge.user_id, p_amount: recharge.amount });
        await supabase.from('recharges').update({ status: 'approved', processed_date: new Date().toISOString() }).eq('id', id);
        res.json({ message: 'Deposit approved successfully.' });
    } catch (err) {
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

app.post('/api/admin/withdrawal/:id/approve', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await supabase.from('withdrawals').update({ status: 'approved', processed_date: new Date().toISOString() }).eq('id', id);
        res.json({ message: 'Withdrawal approved successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve withdrawal.' });
    }
});

app.post('/api/admin/withdrawal/:id/reject', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { data: withdrawal, error: fetchError } = await supabase.from('withdrawals').select('*').eq('id', id).single();
        if (fetchError || !withdrawal) return res.status(404).json({ error: 'Withdrawal not found.'});
        
        await supabase.rpc('increment_user_withdrawable_wallet', { p_user_id: withdrawal.user_id, p_amount: withdrawal.amount });
        await supabase.from('withdrawals').update({ status: 'rejected', processed_date: new Date().toISOString() }).eq('id', id);
        res.json({ message: 'Withdrawal rejected and refunded successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reject withdrawal.' });
    }
});

app.get('/api/admin/game-status', authenticateAdmin, async (req, res) => {
    try { const { data, error } = await supabase.from('game_state').select('*').single(); if (error) throw error; res.json({ status: data }); } catch (err) { res.status(500).json({ error: 'Failed to fetch game status.' }); }
});

app.post('/api/admin/game-status', authenticateAdmin, async (req, res) => {
    const { is_on, mode } = req.body;
    const updateData = {};
    if (typeof is_on === 'boolean') updateData.is_on = is_on;
    if (['auto', 'admin'].includes(mode)) updateData.mode = mode;
    if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'No valid update data provided.' });
    try { const { data, error } = await supabase.from('game_state').update(updateData).eq('id', 1).select().single(); if (error) throw error; res.json({ message: 'Game status updated.', status: data }); } catch (err) { res.status(500).json({ error: 'Failed to update game status.' }); }
});

app.post('/api/admin/game-maintenance', authenticateAdmin, async (req, res) => {
    const { maintenance_mode, whitelisted_users } = req.body;
    const updateData = {};
    if (typeof maintenance_mode === 'boolean') updateData.maintenance_mode = maintenance_mode;
    if (Array.isArray(whitelisted_users)) updateData.whitelisted_users = whitelisted_users.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'No valid data provided.' });
    try { const { data, error } = await supabase.from('game_state').update(updateData).eq('id', 1).select().single(); if (error) throw error; res.json({ message: 'Maintenance settings updated.', status: data }); } catch (err) { res.status(500).json({ error: 'Failed to update maintenance settings.' }); }
});

app.post('/api/admin/game-next-result', authenticateAdmin, async (req, res) => {
    try { await supabase.from('game_state').update({ next_result: req.body.result }).eq('id', 1); res.json({ message: 'Next result set.' }); } catch(err) { res.status(500).json({ error: 'Failed to set next result.' }); }
});

app.get('/api/admin/current-bets', authenticateAdmin, async (req, res) => {
    try {
        const { data: gameState } = await supabase.from('game_state').select('current_period').single();
        const { data: bets } = await supabase.from('bets').select('bet_on, amount').eq('game_period', gameState.current_period);
        const summary = { 'Red': 0, 'Green': 0, 'Violet': 0, '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0 };
        bets.forEach(bet => { if (summary.hasOwnProperty(bet.bet_on)) summary[bet.bet_on] += parseFloat(bet.amount); });
        res.json({ summary });
    } catch (err) { res.status(500).json({ error: 'Failed to fetch current bets.' }); }
});

app.post('/api/admin/distribute-daily-income', authenticateAdmin, async (req, res) => {
    try {
        const { data: activeInvestments, error } = await supabase
            .from('investments')
            .select('user_id, product_plans(daily_income)')
            .eq('status', 'active');
        if (error) throw error;

        for (const investment of activeInvestments) {
            await supabase.rpc('increment_user_withdrawable_wallet', { 
                p_user_id: investment.user_id, 
                p_amount: investment.product_plans.daily_income 
            });
        }
        res.json({ message: `Daily income distributed to ${activeInvestments.length} investments.` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to distribute daily income.' });
    }
});

app.post('/api/admin/grant-bonus', authenticateAdmin, async (req, res) => {
    const { amount, reason, user_ids } = req.body;
    if (!amount || amount <= 0 || !reason) {
        return res.status(400).json({ error: 'Amount and reason are required.' });
    }
    try {
        let targetUsers = [];
        if (user_ids && user_ids.length > 0) {
            targetUsers = user_ids;
        } else {
            const { data: allUsers, error } = await supabase.from('users').select('id');
            if (error) throw error;
            targetUsers = allUsers.map(u => u.id);
        }

        for (const userId of targetUsers) {
            await supabase.rpc('increment_user_withdrawable_wallet', { p_user_id: userId, p_amount: amount });
            await supabase.from('balance_adjustments').insert([{ user_id: userId, amount, reason, admin_id: req.user.id }]);
        }
        res.json({ message: `Bonus of ${amount} granted to ${targetUsers.length} users.` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to grant bonus.' });
    }
});


// ==========================================
// ============== SERVER START ==============
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

