const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, is_admin')
      .eq('id', decoded.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    if (!user.is_admin) return res.status(403).json({ error: 'Admin access required' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Get pending recharges
app.get('/api/admin/recharges/pending', authenticateAdmin, async (req, res) => {
  try {
    const { data: recharges, error } = await supabase
      .from('recharges')
      .select(`
        id,
        user_id,
        amount,
        utr,
        request_date,
        status,
        users (id, name, email)
      `)
      .eq('status', 'pending')
      .order('request_date', { ascending: false });

    if (error) throw error;

    const formattedRecharges = recharges.map(r => ({
      ...r,
      user_name: r.users?.name || 'Unknown',
      user_email: r.users?.email || 'Unknown'
    }));

    res.json({ recharges: formattedRecharges });
  } catch (error) {
    console.error('Pending recharges fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve recharge
app.post('/api/admin/recharge/:id/approve', authenticateAdmin, async (req, res) => {
  const rechargeId = req.params.id;

  try {
    const { data: recharge, error: fetchError } = await supabase
      .from('recharges')
      .select('id, user_id, amount, status')
      .eq('id', rechargeId)
      .single();

    if (fetchError || !recharge) return res.status(404).json({ error: 'Recharge not found' });
    if (recharge.status !== 'pending') return res.status(400).json({ error: 'Recharge not pending' });

    // Increment withdrawable wallet via RPC
    const { error: incError } = await supabase.rpc('increment_user_withdrawable_wallet', {
      user_id: recharge.user_id,
      amount: recharge.amount
    });
    if (incError) throw incError;

    // Update recharge status
    const { error: statusError, count } = await supabase
      .from('recharges')
      .update({ status: 'approved', processed_date: new Date().toISOString() })
      .eq('id', rechargeId)
      .eq('status', 'pending');

    if (statusError) {
      // Rollback wallet increment
      await supabase.rpc('decrement_user_withdrawable_wallet', {
        user_id: recharge.user_id,
        amount: recharge.amount
      });
      throw statusError;
    }

    if (count === 0) {
      // Rollback wallet increment - already processed
      await supabase.rpc('decrement_user_withdrawable_wallet', {
        user_id: recharge.user_id,
        amount: recharge.amount
      });
      return res.status(400).json({ error: 'Recharge already processed' });
    }

    res.json({ message: 'Recharge approved successfully' });
  } catch (error) {
    console.error('Recharge approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject recharge
app.post('/api/admin/recharge/:id/reject', authenticateAdmin, async (req, res) => {
  const rechargeId = req.params.id;

  try {
    const { data: recharge, error: fetchError } = await supabase
      .from('recharges')
      .select('id, status')
      .eq('id', rechargeId)
      .single();

    if (fetchError || !recharge) return res.status(404).json({ error: 'Recharge not found' });
    if (recharge.status !== 'pending') return res.status(400).json({ error: 'Recharge not pending' });

    const { error: statusError, count } = await supabase
      .from('recharges')
      .update({ status: 'rejected', processed_date: new Date().toISOString() })
      .eq('id', rechargeId)
      .eq('status', 'pending');

    if (statusError) throw statusError;
    if (count === 0) return res.status(400).json({ error: 'Recharge already processed' });

    res.json({ message: 'Recharge rejected successfully' });
  } catch (error) {
    console.error('Recharge rejection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending withdrawals
app.get('/api/admin/withdrawals/pending', authenticateAdmin, async (req, res) => {
  try {
    const { data: withdrawals, error } = await supabase
      .from('withdrawals')
      .select(`
        id,
        user_id,
        amount,
        gst_amount,
        net_amount,
        method,
        details,
        request_date,
        status,
        users (id, name, email)
      `)
      .eq('status', 'pending')
      .order('request_date', { ascending: false });

    if (error) throw error;

    const formattedWithdrawals = withdrawals.map(w => ({
      ...w,
      user_name: w.users?.name || 'Unknown',
      user_email: w.users?.email || 'Unknown'
    }));

    res.json({ withdrawals: formattedWithdrawals });
  } catch (error) {
    console.error('Withdrawals fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve withdrawal
app.post('/api/admin/withdrawal/:id/approve', authenticateAdmin, async (req, res) => {
  const withdrawalId = req.params.id;

  try {
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('id, user_id, amount, status')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });
    if (withdrawal.status !== 'pending') return res.status(400).json({ error: 'Withdrawal not pending' });

    // Decrement withdrawable wallet via RPC
    const { data: userData, error: rpcError } = await supabase.rpc('decrement_user_withdrawable_wallet', {
      user_id: withdrawal.user_id,
      amount: withdrawal.amount
    });

    if (rpcError) return res.status(400).json({ error: 'Insufficient balance or user not found' });

    // Update withdrawal status
    const { error: statusError, count } = await supabase
      .from('withdrawals')
      .update({ status: 'approved', processed_date: new Date().toISOString() })
      .eq('id', withdrawalId)
      .eq('status', 'pending');

    if (statusError) {
      // Rollback decrement
      await supabase.rpc('increment_user_withdrawable_wallet', {
        user_id: withdrawal.user_id,
        amount: withdrawal.amount
      });
      throw statusError;
    }

    if (count === 0) {
      await supabase.rpc('increment_user_withdrawable_wallet', {
        user_id: withdrawal.user_id,
        amount: withdrawal.amount
      });
      return res.status(400).json({ error: 'Withdrawal already processed' });
    }

    res.json({ message: 'Withdrawal approved successfully' });
  } catch (error) {
    console.error('Withdrawal approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject withdrawal
app.post('/api/admin/withdrawal/:id/reject', authenticateAdmin, async (req, res) => {
  const withdrawalId = req.params.id;

  try {
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('id, user_id, amount, status')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) return res.status(404).json({ error: 'Withdrawal not found' });
    if (withdrawal.status !== 'pending') return res.status(400).json({ error: 'Withdrawal not pending' });

    // Fetch user balance to refund
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', withdrawal.user_id)
      .single();

    if (userError || !userData) return res.status(404).json({ error: 'User not found' });

    const newBalance = parseFloat(userData.balance) + parseFloat(withdrawal.amount);

    const { error: balanceUpdateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', withdrawal.user_id);

    if (balanceUpdateError) {
      console.error('Balance refund update error:', balanceUpdateError);
      return res.status(500).json({ error: 'Failed to refund user balance' });
    }

    // Update withdrawal status to rejected
    const { error: statusError, count } = await supabase
      .from('withdrawals')
      .update({ status: 'rejected', processed_date: new Date().toISOString() })
      .eq('id', withdrawalId)
      .eq('status', 'pending');

    if (statusError) throw statusError;
    if (count === 0) return res.status(400).json({ error: 'Withdrawal already processed' });

    res.json({ message: 'Withdrawal rejected successfully' });
  } catch (error) {
    console.error('Withdrawal rejection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User search
app.get('/api/admin/users/search', authenticateAdmin, async (req, res) => {
  const query = req.query.query;
  if (!query || query.length < 3) return res.status(400).json({ error: 'Search query must be at least 3 characters long' });

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, mobile, balance')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,mobile.ilike.%${query}%`)
      .limit(20);

    if (error) throw error;
    res.json({ users });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user details by admin
app.get('/api/admin/user/:id', authenticateAdmin, async (req, res) => {
  const userId = req.params.id;
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, mobile, balance, is_admin')
      .eq('id', userId)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });

    res.json({ user });
  } catch (error) {
    console.error('User details fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Adjust user balance by admin
app.post('/api/admin/user/balance-adjust', authenticateAdmin, async (req, res) => {
  const { user_id, amount, reason } = req.body;
  const adminId = req.user.id;

  if (!user_id || isNaN(amount) || !reason) return res.status(400).json({ error: 'User ID, amount, and reason are required' });

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('withdrawable_wallet')
      .eq('id', user_id)
      .single();
    if (userError || !user) return res.status(404).json({ error: 'User not found' });

    let updateError;
    const adjustmentAmount = parseFloat(amount);
    if (adjustmentAmount >= 0) {
      updateError = await supabase.rpc('increment_user_withdrawable_wallet', {
        user_id,
        amount: adjustmentAmount
      });
    } else {
      const result = await supabase.rpc('decrement_user_withdrawable_wallet', {
        user_id,
        amount: Math.abs(adjustmentAmount)
      });
      updateError = result.error;
    }
    if (updateError) {
      console.error('Balance update error:', updateError);
      return res.status(500).json({ error: 'Failed to update user balance' });
    }

    const { error: recordError } = await supabase
      .from('balance_adjustments')
      .insert({
        user_id,
        amount: adjustmentAmount,
        reason,
        admin_id: adminId,
        adjustment_date: new Date().toISOString()
      });
    if (recordError) {
      // Rollback balance update
      if (adjustmentAmount >= 0) {
        await supabase.rpc('decrement_user_withdrawable_wallet', {
          user_id,
          amount: adjustmentAmount
        });
      } else {
        await supabase.rpc('increment_user_withdrawable_wallet', {
          user_id,
          amount: Math.abs(adjustmentAmount)
        });
      }
      return res.status(500).json({ error: 'Failed to record balance adjustment' });
    }

    res.json({ message: 'Balance adjusted successfully' });
  } catch (error) {
    console.error('Balance adjustment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual daily plan recycling
app.post('/api/admin/daily-recycle', authenticateAdmin, async (req, res) => {
  try {
    const { data: investments, error: investError } = await supabase
      .from('investments')
      .select('id, user_id, plan_id, amount, status, days_left')
      .eq('status', 'active');
    if (investError) throw investError;

    const { data: plans, error: plansError } = await supabase
      .from('product_plans')
      .select('id, daily_income');
    if (plansError) throw plansError;

    const planIncomeMap = {};
    plans.forEach(plan => (planIncomeMap[plan.id] = plan.daily_income));

    let processedCount = 0;
    let totalDistributed = 0;

    for (const inv of investments) {
      if (inv.days_left > 0) {
        const dailyIncome = planIncomeMap[inv.plan_id];
        if (dailyIncome > 0) {
          const { error: incrErr } = await supabase.rpc('increment_user_product_revenue_wallet', {
            user_id: inv.user_id,
            amount: dailyIncome
          });
          if (incrErr) {
            console.error(`Failed to add revenue wallet for user ${inv.user_id}:`, incrErr);
            continue;
          }

          const { error: insertErr } = await supabase
            .from('daily_profits')
            .insert({ user_id: inv.user_id, investment_id: inv.id, amount: dailyIncome, processed_date: new Date().toISOString() });
          if (insertErr) {
            console.error(`Failed to record daily profit for user ${inv.user_id}:`, insertErr);
            continue;
          }

          const { error: updateInvErr } = await supabase
            .from('investments')
            .update({ days_left: inv.days_left - 1 })
            .eq('id', inv.id);
          if (updateInvErr) {
            console.error(`Failed to update investment ${inv.id}:`, updateInvErr);
            continue;
          }

          processedCount++;
          totalDistributed += dailyIncome;
        }
      }
    }

    res.json({ message: 'Daily plan recycling completed successfully', processedCount, totalDistributed });
  } catch (error) {
    console.error('Daily plan recycling error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = app;
