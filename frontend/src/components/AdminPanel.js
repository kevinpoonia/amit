import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './AdminPanel.css';

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, use the Render backend URL
    return 'https://my-fullstack-app-backend-2omq.onrender.com';
  } else {
    // In development, use the proxy
    return '';
  }
};

const API_BASE_URL = getApiBaseUrl();

function AdminPanel({ token, onLogout }) {
  const [pendingRecharges, setPendingRecharges] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [balanceAdjustment, setBalanceAdjustment] = useState({
    amount: '',
    reason: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('admin'); // 'admin' or 'admin-users'

  const fetchPendingRecharges = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/recharges/pending`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPendingRecharges(response.data.recharges);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch pending recharges');
    }
  }, [token]);

  const fetchPendingWithdrawals = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/withdrawals/pending`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPendingWithdrawals(response.data.withdrawals);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch pending withdrawals');
    }
  }, [token]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/users/search?query=${searchTerm}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response.data.users);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to search users');
    }
  };

  // Fetch pending recharges and withdrawals on component mount
  useEffect(() => {
    fetchPendingRecharges();
    fetchPendingWithdrawals();
  }, [fetchPendingRecharges, fetchPendingWithdrawals]);

  const handleApproveRecharge = async (rechargeId) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/recharge/${rechargeId}/approve`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSuccess(response.data.message || 'Recharge approved successfully!');
      fetchPendingRecharges();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to approve recharge';
      setError(`Failed to approve recharge: ${errorMsg}`);
      console.error('Recharge approval error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRecharge = async (rechargeId) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/recharge/${rechargeId}/reject`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSuccess(response.data.message || 'Recharge rejected successfully!');
      fetchPendingRecharges();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to reject recharge';
      setError(`Failed to reject recharge: ${errorMsg}`);
      console.error('Recharge rejection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/withdrawal/${withdrawalId}/approve`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSuccess(response.data.message || 'Withdrawal approved successfully!');
      fetchPendingWithdrawals();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to approve withdrawal';
      setError(`Failed to approve withdrawal: ${errorMsg}`);
      console.error('Withdrawal approval error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/withdrawal/${withdrawalId}/reject`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSuccess(response.data.message || 'Withdrawal rejected successfully!');
      fetchPendingWithdrawals();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to reject withdrawal';
      setError(`Failed to reject withdrawal: ${errorMsg}`);
      console.error('Withdrawal rejection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setBalanceAdjustment({
      amount: '',
      reason: ''
    });
  };

  const handleBalanceAdjustment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/api/admin/user/balance-adjust`, {
        userId: selectedUser.id,
        amount: parseFloat(balanceAdjustment.amount),
        reason: balanceAdjustment.reason
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSuccess('User balance adjusted successfully!');
      // Refresh user data
      if (selectedUser && selectedUser.id) {
        fetchUsers();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to adjust user balance');
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceAdjustmentChange = (e) => {
    setBalanceAdjustment({
      ...balanceAdjustment,
      [e.target.name]: e.target.value
    });
  };

  // New function for manual daily plan recycling
  const handleDailyRecycle = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/daily-recycle`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSuccess(`Daily recycling completed: ${response.data.processedInvestments} investments processed, ₹${response.data.totalAmountDistributed.toFixed(2)} distributed`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to perform daily recycling');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="admin-panel">
      <div className="header">
        <h2>Admin Panel</h2>
        <div className="header-buttons">
          <button onClick={onLogout}>Logout</button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="admin-tabs">
        <button 
          className={view === 'admin' ? 'active' : ''}
          onClick={() => {
            setView('admin');
            fetchPendingRecharges();
            fetchPendingWithdrawals();
          }}
        >
          Pending Requests
        </button>
        <button 
          className={view === 'admin-users' ? 'active' : ''}
          onClick={() => setView('admin-users')}
        >
          User Management
        </button>
      </div>

      {/* Pending Requests Tab */}
      {view === 'admin' && (
        <div className="admin-pending-requests">
          {/* Daily Recycling Button */}
          <div className="daily-recycle-section">
            <h3>Daily Plan Recycling</h3>
            <button 
              className="recycle-btn"
              onClick={handleDailyRecycle}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Run Daily Plan Recycling'}
            </button>
            <p className="recycle-info">
              This will distribute daily income from all active investment plans to users' wallets.
            </p>
          </div>

          <h3>Pending Recharges</h3>
          <div className="requests-list">
            {pendingRecharges.length > 0 ? (
              pendingRecharges.map(recharge => (
                <div key={recharge.id} className="request-item">
                  <p><strong>User ID:</strong> {recharge.user_id}</p>
                  <p><strong>Amount:</strong> {formatCurrency(recharge.amount)}</p>
                  <p><strong>UTR:</strong> {recharge.utr}</p>
                  <p><strong>Date:</strong> {new Date(recharge.request_date).toLocaleString()}</p>
                  <div className="request-actions">
                    <button 
                      onClick={() => handleApproveRecharge(recharge.id)}
                      className="approve-btn"
                      disabled={loading}
                    >
                      {loading ? 'Approving...' : 'Approve'}
                    </button>
                    <button 
                      onClick={() => handleRejectRecharge(recharge.id)}
                      className="reject-btn"
                      disabled={loading}
                    >
                      {loading ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No pending recharges</p>
            )}
          </div>

          <h3>Pending Withdrawals</h3>
          <div className="requests-list">
            {pendingWithdrawals.length > 0 ? (
              pendingWithdrawals.map(withdrawal => (
                <div key={withdrawal.id} className="request-item">
                  <p><strong>User ID:</strong> {withdrawal.user_id}</p>
                  <p><strong>Amount:</strong> {formatCurrency(withdrawal.amount)}</p>
                  <p><strong>GST Amount:</strong> {formatCurrency(withdrawal.gst_amount)}</p>
                  <p><strong>Net Amount:</strong> {formatCurrency(withdrawal.net_amount)}</p>
                  <p><strong>Method:</strong> {withdrawal.method}</p>
                  <p><strong>Details:</strong> {withdrawal.details}</p>
                  <p><strong>Date:</strong> {new Date(withdrawal.request_date).toLocaleString()}</p>
                  <div className="request-actions">
                    <button 
                      onClick={() => handleApproveWithdrawal(withdrawal.id)}
                      className="approve-btn"
                      disabled={loading}
                    >
                      {loading ? 'Approving...' : 'Approve'}
                    </button>
                    <button 
                      onClick={() => handleRejectWithdrawal(withdrawal.id)}
                      className="reject-btn"
                      disabled={loading}
                    >
                      {loading ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No pending withdrawals</p>
            )}
          </div>
        </div>
      )}

      {/* User Management Tab */}
      {view === 'admin-users' && (
        <div className="admin-user-management">
          <h3>Search Users</h3>
          <div className="search-form">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or mobile"
            />
            <button onClick={fetchUsers} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {users.length > 0 && (
            <div className="search-results">
              <h4>Search Results</h4>
              {users.map(user => (
                <div key={user.id} className="user-result">
                  <p><strong>Name:</strong> {user.name}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Mobile:</strong> {user.mobile}</p>
                  <p><strong>Balance:</strong> {formatCurrency(user.balance)}</p>
                  <button onClick={() => handleSelectUser(user)}>Select User</button>
                </div>
              ))}
            </div>
          )}

          {selectedUser && (
            <div className="user-details">
              <h4>Selected User: {selectedUser.name}</h4>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Mobile:</strong> {selectedUser.mobile}</p>
              <p><strong>Balance:</strong> {formatCurrency(selectedUser.balance)}</p>

              <h4>Adjust Balance</h4>
              <form onSubmit={handleBalanceAdjustment}>
                <div>
                  <label>Amount (₹):</label>
                  <input
                    type="number"
                    name="amount"
                    value={balanceAdjustment.amount}
                    onChange={handleBalanceAdjustmentChange}
                    required
                  />
                </div>
                <div>
                  <label>Reason:</label>
                  <textarea
                    name="reason"
                    value={balanceAdjustment.reason}
                    onChange={handleBalanceAdjustmentChange}
                    required
                  />
                </div>
                <button type="submit" disabled={loading}>
                  {loading ? 'Adjusting...' : 'Adjust Balance'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;