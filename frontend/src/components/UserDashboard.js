import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ---------------- API Base URL ----------------
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://investmentpro-nu7s.onrender.com';
  } else {
    return 'http://localhost:5000';
  }
};

const API_BASE_URL = getApiBaseUrl();

// ---------------- FakeWithdrawalPopup Component ----------------
function FakeWithdrawalPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => generateFakeWithdrawal(), 10000);
    return () => clearInterval(interval);
  }, []);

  const generateFakeWithdrawal = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fake-withdrawal`);
      setWithdrawalData(response.data.withdrawal);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 5000);
    } catch (err) {
      console.error('Failed to generate fake withdrawal:', err);
    }
  };

  return (
    <>
      {showPopup && withdrawalData && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
          background: 'rgba(0,0,0,0.85)', color: '#fff',
          padding: '16px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          width: '220px', fontSize: '14px'
        }}>
          <strong>New Withdrawal!</strong>
          <p style={{ margin: '4px 0' }}>{withdrawalData.name}</p>
          <p style={{ margin: '4px 0' }}>₹{withdrawalData.amount.toLocaleString()}</p>
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#ccc' }}>{withdrawalData.timestamp}</p>
        </div>
      )}
    </>
  );
}

// ---------------- UserDashboard Component ----------------
function UserDashboard({ token, onLogout, onViewChange }) {
  const [localUserData, setLocalUserData] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalProfit, setTotalProfit] = useState(0);
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.user) setLocalUserData(res.data.user);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  }, [token]);

  // Fetch investments + summary
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [investmentsRes, summaryRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/investments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/financial-summary`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setInvestments(investmentsRes.data.investments || []);
      if (summaryRes.data) {
        setTotalProfit(summaryRes.data.totalProfit || 0);
        setWithdrawableBalance(summaryRes.data.withdrawableBalance || 0);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchDashboardData();
    }
  }, [token, fetchUserProfile, fetchDashboardData]);

  // Poll for balance updates
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => fetchUserProfile(), 10000);
    return () => clearInterval(interval);
  }, [token, fetchUserProfile]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);

  const calculateProgress = (investment) => {
    if (!investment || !investment.duration_days || investment.duration_days <= 0) return 0;
    const totalDays = investment.duration_days;
    const daysLeft = investment.days_left || 0;
    const daysPassed = totalDays - daysLeft;
    return Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
  };

  if (!localUserData) return <div style={{ padding: '16px' }}>Loading dashboard...</div>;

  return (
    <div style={{ padding: '16px' }}>
      {/* Welcome / Wallet Card */}
      <div style={{
        marginBottom: '24px', padding: '16px',
        background: 'linear-gradient(135deg, rgba(25,25,45,0.7), rgba(65,105,225,0.2))',
        borderRadius: '12px', position: 'relative'
      }}>
        <button onClick={onLogout} style={{
          position: 'absolute', top: '12px', right: '12px',
          width: '36px', height: '36px', borderRadius: '50%'
        }}>⇦</button>
        <div>
          <h2>Welcome Back!</h2>
          <p>{localUserData.name}</p>
          <p style={{ fontSize: '20px', fontWeight: 600 }}>
            Wallet: {formatCurrency(localUserData?.recharge_balance ?? localUserData?.balance ?? 0)}
          </p>
        </div>
      </div>

      {/* Financial Summary */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ flex: 1, padding: '16px', background: '#222', borderRadius: '12px' }}>
          <p>Total Profit</p>
          <p style={{ fontWeight: 600, color: '#4caf50' }}>{formatCurrency(totalProfit)}</p>
        </div>
        <div style={{ flex: 1, padding: '16px', background: '#222', borderRadius: '12px' }}>
          <p>Withdrawable</p>
          <p style={{ fontWeight: 600 }}>{formatCurrency(withdrawableBalance)}</p>
        </div>
      </div>

      {/* Active Investments */}
      <div style={{ marginBottom: '24px' }}>
        <h3>Active Investments ({investments.length})</h3>
        {investments.length ? investments.map(inv => {
          const progress = calculateProgress(inv);
          return (
            <div key={inv.id} style={{
              marginBottom: '16px', padding: '12px',
              background: 'rgba(30,30,50,0.5)', borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{inv.plan_name} - {formatCurrency(inv.amount)}</span>
                <span>{inv.status}</span>
              </div>
              <div style={{
                height: '8px', background: '#333', borderRadius: '4px',
                marginTop: '8px', overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progress}%`, height: '100%', background: '#4169e1',
                  transition: 'width 1s'
                }} />
              </div>
            </div>
          );
        }) : <p>No active investments</p>}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button onClick={() => onViewChange('plans')}>Products</button>
        <button onClick={() => onViewChange('recharge')}>Recharge</button>
        <button onClick={() => onViewChange('withdraw')}>Withdraw</button>
      </div>

      {/* Market Insights */}
      <div style={{ marginBottom: '24px', padding: '16px', background: '#111', borderRadius: '12px' }}>
        <h4>Market Insights</h4>
        <p>Market is bullish today! High-performing plans showing +3.2% returns.</p>
        <button onClick={() => onViewChange('plans')}>View Recommendations</button>
      </div>

      {/* Include Fake Withdrawal Popup */}
      <FakeWithdrawalPopup />
    </div>
  );
}

export default UserDashboard;
