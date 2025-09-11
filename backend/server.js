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
app.use(cors({ origin: ['https://amit-sigma.vercel.app', 'http://localhost:3000'] }));
app.use(express.json());

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

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

app.post('/api/login', async (req, res) => {
    const { mobile, password } = req.body;
    if (!mobile || !password) { return res.status(400).json({ error: 'Mobile and password are required' }); }
    try {
        const { data: user, error } = await supabase.from('users').select('*').eq('mobile', mobile).single();
        if (error || !user || user.password !== password) { return res.status(400).json({ error: 'Invalid credentials' }); }
        const token = jwt.sign({ id: user.id, name: user.name, is_admin: user.is_admin }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

app.get('/api/data', authenticateToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase.from('users').select('id, name, ip_username, email, mobile, balance, withdrawable_wallet, is_admin, avatar_url').eq('id', req.user.id).single();
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
        res.json({ balance: user.balance, withdrawable_wallet: user.withdrawable_wallet, todaysIncome: 0, totalIncome: 0 });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch financial summary' });
    }
});

app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const { data: newRecharges, error } = await supabase.from('recharges').select('id, amount').eq('user_id', req.user.id).eq('status', 'approved').eq('seen_by_user', false);
        if (error) throw error;
        const notifications = newRecharges.map(r => ({ id: `recharge-${r.id}`, type: 'deposit_approved', message: `Your deposit of ₹${r.amount.toLocaleString()} has been approved!` }));
        res.json({ notifications });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications.' });
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

app.post('/api/withdraw', authenticateToken, async (req, res) => {
    const { amount, method, details } = req.body;
    if (!amount || amount < 100 || !method || !details) {
        return res.status(400).json({ error: 'Invalid withdrawal details. Minimum is ₹100.' });
    }
    try {
        const userId = req.user.id;
        const { data: user, error: userError } = await supabase.from('users').select('withdrawable_wallet').eq('id', userId).single();
        if (userError || !user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        if (user.withdrawable_wallet < amount) {
            return res.status(400).json({ error: 'Insufficient withdrawable balance.' });
        }
        const { error } = await supabase.from('withdrawals').insert([{ user_id: userId, amount, method, details, status: 'pending' }]);
        if (error) {
            console.error('Withdrawal request error:', error);
            throw new Error('Failed to create withdrawal request.');
        }
        res.json({ message: 'Withdrawal request submitted successfully.' });
    } catch (error) {
        console.error("Withdrawal submission error:", error);
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

app.get('/api/investments', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from('investments').select('id, plan_name, amount, status, days_left').eq('user_id', req.user.id).order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ investments: data });
    } catch (error) {
        console.error("Failed to fetch investments:", error);
        res.status(500).json({ error: 'Failed to fetch user investments.' });
    }
});

app.get('/api/transactions', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [ { data: recharges }, { data: withdrawals }, { data: investments }, { data: bets } ] = await Promise.all([
            supabase.from('recharges').select('id, amount, status, created_at').eq('user_id', userId).eq('status', 'approved'),
            supabase.from('withdrawals').select('id, amount, status, created_at').eq('user_id', userId),
            supabase.from('investments').select('id, amount, plan_name, created_at').eq('user_id', userId),
            supabase.from('bets').select('id, amount, payout, status, created_at').eq('user_id', userId)
        ]);
        const formatted = [];
        recharges.forEach(r => formatted.push({ id: `dep-${r.id}`, type: 'Deposit', amount: r.amount, status: 'Completed', date: r.created_at, description: `Recharge successful` }));
        withdrawals.forEach(w => formatted.push({ id: `wd-${w.id}`, type: 'Withdrawal', amount: -w.amount, status: w.status.charAt(0).toUpperCase() + w.status.slice(1), date: w.created_at, description: `Withdrawal request` }));
        investments.forEach(i => formatted.push({ id: `inv-${i.id}`, type: 'Plan Purchase', amount: -i.amount, status: 'Completed', date: i.created_at, description: i.plan_name }));
        bets.forEach(b => {
            formatted.push({ id: `bet-${b.id}`, type: 'Game Bet', amount: -b.amount, status: b.status.charAt(0).toUpperCase() + b.status.slice(1), date: b.created_at });
            if (b.payout > 0) formatted.push({ id: `payout-${b.id}`, type: 'Game Payout', amount: b.payout, status: 'Won', date: b.created_at });
        });
        formatted.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json({ transactions: formatted });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: 'Failed to fetch transaction history.' });
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
        // ✅ FIX: Admin set result logic is now correctly implemented here
        if (gameState.mode === 'admin' && gameState.next_result !== null) {
            winningNumber = gameState.next_result;
        } else {
            // ✅ FIX: User win chance logic is now correctly implemented here
            const totalBetAmount = bets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
            const totalPayouts = Array(10).fill(0);
            for (let i = 0; i < 10; i++) {
                const potentialColors = getNumberProperties(i);
                bets.forEach(bet => {
                    let multiplier = 0;
                    if (bet.bet_on == i.toString()) multiplier = 9.2;
                    else if (potentialColors.includes(bet.bet_on)) multiplier = bet.bet_on === 'Violet' ? 4.5 : 1.98;
                    totalPayouts[i] += parseFloat(bet.amount) * multiplier;
                });
            }

            const shouldUsersWin = Math.random() * 100 < gameState.user_win_chance_percent;
            
            let potentialWinners = [];
            if (shouldUsersWin && totalBetAmount > 0) {
                for(let i=0; i<10; i++) {
                    if(totalPayouts[i] > 0 && totalPayouts[i] < totalBetAmount) {
                        potentialWinners.push(i);
                    }
                }
            }
            
            if (potentialWinners.length === 0) {
                 let minPayout = Infinity;
                 for(let i=0; i<10; i++) {
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
                winningNumber = Math.floor(Math.random() * 10);
            }
        }
        
        const winningColors = getNumberProperties(winningNumber);
        await supabase.from('game_results').insert({ game_period: gameState.current_period, result_number: winningNumber });
        
        for (const bet of bets) {
            let payout = 0; 
            let status = 'lost';
            const winningNumberStr = winningNumber.toString();

            if (bet.bet_on === winningNumberStr || winningColors.includes(bet.bet_on)) {
                status = 'won';
                if (bet.bet_on === winningNumberStr) {
                    payout += parseFloat(bet.amount) * 9.2;
                }
                if (winningColors.includes(bet.bet_on)) {
                    payout += parseFloat(bet.amount) * (bet.bet_on === 'Violet' ? 4.5 : 1.98);
                }
            }
            
            if (payout > 0) {
                await supabase.rpc('increment_user_withdrawable_wallet', { p_user_id: bet.user_id, p_amount: payout });
            }
            await supabase.from('bets').update({ status, payout }).eq('id', bet.id);
        }

        await supabase.from('game_state').update({
            current_period: nextPeriod,
            countdown_start_time: new Date().toISOString(),
            next_result: null // Reset the admin-set result after it's used
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
    } catch (err) { res.status(500).json({ error: 'Failed to fetch pending deposits.' }); }
});

app.get('/api/admin/withdrawals/pending', authenticateAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('withdrawals').select('*').eq('status', 'pending').order('request_date', { ascending: true });
        if (error) throw error;
        res.json({ withdrawals: data });
    } catch (err) { res.status(500).json({ error: 'Failed to fetch pending withdrawals.' }); }
});

app.post('/api/admin/recharge/:id/approve', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { data: recharge, error: fetchError } = await supabase.from('recharges').select('*').eq('id', id).single();
        if (fetchError || !recharge) return res.status(404).json({ error: 'Recharge not found.' });
        if (recharge.status !== 'pending') return res.status(400).json({ error: 'Recharge is not pending.' });

        const { error: balanceUpdateError } = await supabase.rpc('increment_user_balance', {
            p_user_id: recharge.user_id,
            p_amount: recharge.amount
        });
        if (balanceUpdateError) throw balanceUpdateError;

        const { error: updateRechargeError } = await supabase.from('recharges').update({ status: 'approved', processed_date: new Date().toISOString() }).eq('id', id);
        if (updateRechargeError) throw updateRechargeError;

        res.json({ message: 'Deposit approved successfully and balance updated.' });
    } catch (err) {
        console.error("Failed to approve deposit:", err);
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
        const { data: withdrawal, error: fetchError } = await supabase.from('withdrawals').select('*').eq('id', id).single();
        if (fetchError || !withdrawal) return res.status(404).json({ error: 'Withdrawal not found.' });
        if (withdrawal.status !== 'pending') return res.status(400).json({ error: 'Withdrawal is not pending.' });
        
        const { error: deductError } = await supabase.rpc('decrement_user_withdrawable_wallet', { p_user_id: withdrawal.user_id, p_amount: withdrawal.amount });
        if (deductError) {
             return res.status(400).json({ error: 'Failed to deduct balance. User may have insufficient funds.' });
        }
        
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
        if (fetchError || !withdrawal) return res.status(404).json({ error: 'Withdrawal not found.' });
        if (withdrawal.status !== 'pending') return res.status(400).json({ error: 'Withdrawal is not pending.' });

        await supabase.from('withdrawals').update({ status: 'rejected', processed_date: new Date().toISOString() }).eq('id', id);
        res.json({ message: 'Withdrawal rejected successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reject withdrawal.' });
    }
});

app.post('/api/admin/distribute-daily-income', authenticateAdmin, async (req, res) => {
    try {
        const { data: activeInvestments, error } = await supabase.from('investments').select('user_id, product_plans(daily_income)').eq('status', 'active');
        if (error) throw error;
        for (const investment of activeInvestments) {
            if (investment.product_plans) {
                await supabase.rpc('increment_user_withdrawable_wallet', {
                    p_user_id: investment.user_id,
                    p_amount: investment.product_plans.daily_income
                });
            }
        }
        res.json({ message: `Daily income distributed to ${activeInvestments.length} investments.` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to distribute daily income.' });
    }
});

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
        for (const userId of targetUsers) {
            await supabase.rpc('increment_user_withdrawable_wallet', { p_user_id: userId, p_amount: amount });
            await supabase.from('balance_adjustments').insert([{ user_id: userId, amount, reason, admin_id: req.user.id }]);
        }
        res.json({ message: `Bonus of ${amount} granted to ${targetUsers.length} users.` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to grant bonus.' });
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
    try { await supabase.from('game_state').update({ next_result: req.body.result }).eq('id', 1); res.json({ message: 'Next result set.' }); } catch (err) { res.status(500).json({ error: 'Failed to set next result.' }); }
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

app.post('/api/admin/set-win-chance', authenticateAdmin, async (req, res) => {
    const { winChance } = req.body;
    if (winChance === undefined || winChance < 0 || winChance > 100) {
        return res.status(400).json({ error: 'Please provide a valid win chance percentage (0-100).' });
    }
    try {
        const { error } = await supabase
            .from('game_state')
            .update({ user_win_chance_percent: winChance })
            .eq('id', 1);

        if (error) throw error;
        res.json({ message: `User win chance set to ${winChance}%.` });
    } catch (error) {
        console.error("Error setting win chance:", error);
        res.status(500).json({ error: 'Failed to update win chance.' });
    }
});

// ==========================================
// ============== SERVER START ==============
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

