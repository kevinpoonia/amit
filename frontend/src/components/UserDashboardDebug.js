import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, use the Render backend URL
    return 'https://investmentpro-nu7s.onrender.com';
  } else {
    // In development, use the proxy
    return '';
  }
};

const API_BASE_URL = getApiBaseUrl();

function UserDashboard({ token, userData, onLogout, onViewChange }) {
  const [investments, setInvestments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      console.log('Fetching dashboard data...');
      
      // Fetch investments
      console.log('Fetching investments...');
      const investmentsRes = await axios.get(`${API_BASE_URL}/api/investments`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Investments response:', investmentsRes.data);
      setInvestments(investmentsRes.data.investments || []);

      // Fetch transactions (recharges and withdrawals)
      console.log('Fetching recharges...');
      const rechargesRes = await axios.get(`${API_BASE_URL}/api/recharges`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Recharges response:', rechargesRes.data);

      console.log('Fetching withdrawals...');
      const withdrawalsRes = await axios.get(`${API_BASE_URL}/api/withdrawals`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Withdrawals response:', withdrawalsRes.data);

      // Combine transactions and sort by date
      const allRecharges = (rechargesRes.data.recharges || []).map(t => ({ ...t, type: 'recharge' }));
      const allWithdrawals = (withdrawalsRes.data.withdrawals || []).map(t => ({ ...t, type: 'withdrawal' }));
      
      console.log('All recharges:', allRecharges);
      console.log('All withdrawals:', allWithdrawals);
      
      const allTransactions = [
        ...allRecharges,
        ...allWithdrawals
      ].sort((a, b) => new Date(b.request_date || b.created_at) - new Date(a.request_date || a.created_at));

      console.log('Combined and sorted transactions:', allTransactions);
      setTransactions(allTransactions.slice(0, 10)); // Show only last 10 transactions
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      console.error('Error response:', err.response?.data);
      setError(`Failed to fetch dashboard data: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token, fetchDashboardData]);

  const copyReferralLink = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/referral-link`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      navigator.clipboard.writeText(response.data.referralLink);
      alert('Referral link copied to clipboard!');
    } catch (err) {
      alert('Failed to copy referral link');
    }
  };

  // Calculate total invested
  const totalInvested = investments.reduce((sum, investment) => sum + investment.amount, 0);

  // Calculate total withdrawn
  const totalWithdrawn = transactions
    .filter(t => t.type === 'withdrawal' && t.status === 'approved')
    .reduce((sum, withdrawal) => sum + withdrawal.amount, 0);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard">
      {/* ... existing JSX code ... */}
      
      {/* Add error display */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {/* ... rest of the existing JSX code ... */}
    </div>
  );
}

export default UserDashboard;
