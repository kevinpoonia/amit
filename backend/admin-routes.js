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
      .select('id, name, email, is_admin')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
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

    if (error) {
      console.error('Error fetching pending recharges:', error);
      return res.status(500).json({ error: 'Failed to fetch pending recharges' });
    }

    // Format the response to include user details at the top level
    const formattedRecharges = recharges.map(recharge => ({
      ...recharge,
      user_name: recharge.users?.name || 'Unknown',
      user_email: recharge.users?.email || 'Unknown'
    }));

    res.json({
      recharges: formattedRecharges
    });
  } catch (error) {
    console.error('Pending recharges fetch error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Get pending withdrawals (admin)
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

    if (error) {
      console.error('Error fetching pending withdrawals:', error);
      return res.status(500).json({ error: 'Failed to fetch pending withdrawals' });
    }

    // Format the response to include user details at the top level
    const formattedWithdrawals = withdrawals.map(withdrawal => ({
      ...withdrawal,
      user_name: withdrawal.users?.name || 'Unknown',
      user_email: withdrawal.users?.email || 'Unknown'
    }));

    res.json({
      withdrawals: formattedWithdrawals
    });
  } catch (error) {
    console.error('Pending withdrawals fetch error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Approve recharge (admin)
app.post('/api/admin/recharge/:id/approve', authenticateAdmin, async (req, res) => {
  const rechargeId = req.params.id;
  const adminId = req.user.id;

  try {
    // Fetch the recharge request
    const { data: recharge, error: fetchError } = await supabase
      .from('recharges')
      .select('id, user_id, amount, status')
      .eq('id', rechargeId)
      .single();

    if (fetchError || !recharge) {
      return res.status(404).json({ error: 'Recharge request not found' });
    }

    if (recharge.status !== 'pending') {
      return res.status(400).json({ error: 'Recharge request is not pending' });
    }

    // Update user balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, balance')
      .eq('id', recharge.user_id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newBalance = parseFloat(userData.balance) + parseFloat(recharge.amount);

    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ 
        balance: newBalance
      })
      .eq('id', recharge.user_id)
      .select();

    if (updateError) {
      console.error('Error updating user balance:', updateError);
      return res.status(500).json({ error: 'Failed to update user balance' });
    }

    // Update recharge status
    const { data: updatedRecharge, error: rechargeError } = await supabase
      .from('recharges')
      .update({ 
        status: 'approved',
        processed_date: new Date().toISOString()
      })
      .eq('id', rechargeId)
      .select();

    if (rechargeError) {
      // Rollback user balance update
      await supabase
        .from('users')
        .update({ 
          balance: userData.balance
        })
        .eq('id', recharge.user_id);
        
      console.error('Error updating recharge status:', rechargeError);
      return res.status(500).json({ error: 'Failed to update recharge status' });
    }

    res.json({
      message: 'Recharge approved successfully',
      recharge: updatedRecharge[0]
    });
  } catch (error) {
    console.error('Recharge approval error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Reject recharge (admin)
app.post('/api/admin/recharge/:id/reject', authenticateAdmin, async (req, res) => {
  const rechargeId = req.params.id;
  const adminId = req.user.id;

  try {
    // Fetch the recharge request
    const { data: recharge, error: fetchError } = await supabase
      .from('recharges')
      .select('id, user_id, amount, status')
      .eq('id', rechargeId)
      .single();

    if (fetchError || !recharge) {
      return res.status(404).json({ error: 'Recharge request not found' });
    }

    if (recharge.status !== 'pending') {
      return res.status(400).json({ error: 'Recharge request is not pending' });
    }

    // Update recharge status
    const { data: updatedRecharge, error: rechargeError } = await supabase
      .from('recharges')
      .update({ 
        status: 'rejected',
        processed_date: new Date().toISOString()
      })
      .eq('id', rechargeId)
      .select();

    if (rechargeError) {
      console.error('Error updating recharge status:', rechargeError);
      return res.status(500).json({ error: 'Failed to update recharge status' });
    }

    res.json({
      message: 'Recharge rejected successfully',
      recharge: updatedRecharge[0]
    });
  } catch (error) {
    console.error('Recharge rejection error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Approve withdrawal (admin)
app.post('/api/admin/withdrawal/:id/approve', authenticateAdmin, async (req, res) => {
  const withdrawalId = req.params.id;
  const adminId = req.user.id;

  try {
    // Fetch the withdrawal request
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('id, user_id, amount, status')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal request is not pending' });
    }

    // Deduct amount from user's balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, balance')
      .eq('id', withdrawal.user_id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newBalance = parseFloat(userData.balance) - parseFloat(withdrawal.amount);

    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ 
        balance: newBalance
      })
      .eq('id', withdrawal.user_id)
      .select();

    if (updateError) {
      console.error('Error updating user balance:', updateError);
      return res.status(500).json({ error: 'Failed to update user balance' });
    }

    // Update withdrawal status
    const { data: updatedWithdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .update({ 
        status: 'approved',
        processed_date: new Date().toISOString()
      })
      .eq('id', withdrawalId)
      .select();

    if (withdrawalError) {
      // Rollback user balance update
      await supabase
        .from('users')
        .update({ 
          balance: userData.balance
        })
        .eq('id', withdrawal.user_id);
        
      console.error('Error updating withdrawal status:', withdrawalError);
      return res.status(500).json({ error: 'Failed to update withdrawal status' });
    }

    res.json({
      message: 'Withdrawal approved successfully',
      withdrawal: updatedWithdrawal[0]
    });
  } catch (error) {
    console.error('Withdrawal approval error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Reject withdrawal (admin)
app.post('/api/admin/withdrawal/:id/reject', authenticateAdmin, async (req, res) => {
  const withdrawalId = req.params.id;
  const adminId = req.user.id;

  try {
    // Fetch the withdrawal request
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('id, user_id, amount, status')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal request is not pending' });
    }

    // Refund the amount to user's balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, email, balance')
      .eq('id', withdrawal.user_id)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newBalance = parseFloat(userData.balance) + parseFloat(withdrawal.amount);

    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ 
        balance: newBalance
      })
      .eq('id', withdrawal.user_id)
      .select();

    if (updateError) {
      console.error('Error updating user balance:', updateError);
      return res.status(500).json({ error: 'Failed to update user balance' });
    }

    // Update withdrawal status
    const { data: updatedWithdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .update({ 
        status: 'rejected',
        processed_date: new Date().toISOString()
      })
      .eq('id', withdrawalId)
      .select();

    if (withdrawalError) {
      // Rollback user balance update
      await supabase
        .from('users')
        .update({ 
          balance: userData.balance
        })
        .eq('id', withdrawal.user_id);
        
      console.error('Error updating withdrawal status:', withdrawalError);
      return res.status(500).json({ error: 'Failed to update withdrawal status' });
    }

    res.json({
      message: 'Withdrawal rejected successfully',
      withdrawal: updatedWithdrawal[0]
    });
  } catch (error) {
    console.error('Withdrawal rejection error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Search users (admin)
app.get('/api/admin/users/search', authenticateAdmin, async (req, res) => {
  const query = req.query.query;

  if (!query || query.length < 3) {
    return res.status(400).json({ error: 'Search query must be at least 3 characters long' });
  }

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, mobile, balance')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,mobile.ilike.%${query}%`)
      .limit(20);

    if (error) {
      console.error('Error searching users:', error);
      return res.status(500).json({ error: 'Failed to search users' });
    }

    res.json({
      users
    });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Get user details (admin)
app.get('/api/admin/user/:id', authenticateAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, mobile, balance, is_admin')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user
    });
  } catch (error) {
    console.error('User details fetch error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Adjust user balance (admin)
app.post('/api/admin/user/balance-adjust', authenticateAdmin, async (req, res) => {
  const { user_id, amount, reason } = req.body;
  const adminId = req.user.id;

  // Validate input
  if (!user_id || isNaN(amount) || !reason) {
    return res.status(400).json({ error: 'User ID, amount, and reason are required' });
  }

  try {
    // Fetch the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, balance')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate new balance
    const adjustmentAmount = parseFloat(amount);
    const newBalance = parseFloat(user.balance) + adjustmentAmount;

    // Update user balance
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ 
        balance: newBalance
      })
      .eq('id', user_id)
      .select();

    if (updateError) {
      console.error('Error updating user balance:', updateError);
      return res.status(500).json({ error: 'Failed to update user balance' });
    }

    // Record the balance adjustment
    const { data: adjustmentData, error: adjustmentError } = await supabase
      .from('balance_adjustments')
      .insert({
        user_id: user_id,
        amount: adjustmentAmount,
        reason: reason,
        admin_id: adminId
      })
      .select();

    if (adjustmentError) {
      // Rollback user balance update
      await supabase
        .from('users')
        .update({ 
          balance: user.balance
        })
        .eq('id', user_id);
        
      console.error('Error recording balance adjustment:', adjustmentError);
      return res.status(500).json({ error: 'Failed to record balance adjustment' });
    }

    res.json({
      message: 'Balance adjusted successfully',
      user: updateData[0],
      adjustment: adjustmentData[0]
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
        days_left
      `)
      .eq('status', 'active');

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
      // and days_left is less than or equal to duration_days (to prevent overpayment)
      if (investment.days_left > 0) {
        const dailyIncome = planIncomeMap[investment.plan_id];
        
        if (dailyIncome && dailyIncome > 0) {
          // Add daily income to user's balance
          const { error: updateError } = await supabase.rpc('increment_user_balance', {
            user_id: investment.user_id,
            amount: dailyIncome
          });

          if (updateError) {
            console.error(`Error updating balance for user ${investment.user_id}:`, updateError);
            // Continue with other investments even if one fails
            continue;
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
