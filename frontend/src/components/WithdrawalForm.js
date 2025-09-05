import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './WithdrawalForm.css';

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

function WithdrawalForm({ token, userData, onBack }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank'); // 'bank' or 'upi'
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  });
  const [upiId, setUpiId] = useState('');
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  

  const fetchWithdrawals = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/withdrawals`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setWithdrawals(response.data.withdrawals || []);
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  // Calculate GST (18%)
  const calculateGST = (amount) => {
    return amount * 0.18;
  };

  // Calculate net amount (amount - GST)
  const calculateNetAmount = (amount) => {
    return amount - calculateGST(amount);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numeric input with up to 2 decimal places
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  const handleBankDetailsChange = (field, value) => {
    setBankDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    const amountFloat = parseFloat(amount);
    
    if (amountFloat > (userData?.balance || 0)) {
      setError('Insufficient balance');
      return;
    }
    
    if (method === 'bank') {
      if (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) {
        setError('Please fill in all bank details');
        return;
      }
    } else if (method === 'upi') {
      if (!upiId) {
        setError('Please enter UPI ID');
        return;
      }
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(`${API_BASE_URL}/api/withdraw`, 
        {
          amount: amountFloat,
          method,
          details: method === 'bank' ? bankDetails : upiId
        }, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setSuccess('Withdrawal request submitted successfully!');
      setAmount('');
      setBankDetails({
        accountNumber: '',
        ifscCode: '',
        accountHolderName: ''
      });
      setUpiId('');
      fetchWithdrawals(); // Refresh withdrawals list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request withdrawal');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

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
    <div className="withdrawal-container">
      {/* Header */}
      <div className="withdrawal-header">
        <button 
          onClick={onBack}
          className="secondary-button"
          style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}
        >
          ←
        </button>
        <h1>Withdraw Funds</h1>
        <div style={{ width: '40px' }}></div> {/* Spacer for alignment */}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="withdrawal-card">
        <h2>Withdrawal Request</h2>
        
        <form onSubmit={handleRequestWithdrawal}>
          {/* Amount Input */}
          <div className="form-group">
            <label className="form-label">Amount to Withdraw:</label>
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Enter amount"
              className="form-input"
            />
          </div>

          {/* Method Selection */}
          <div className="form-group">
            <label className="form-label">Withdrawal Method:</label>
            <div className="method-selection">
              <button
                type="button"
                className={`method-button ${method === 'bank' ? 'selected' : ''}`}
                onClick={() => setMethod('bank')}
              >
                <div className="method-icon">🏦</div>
                <div className="method-name">Bank Transfer</div>
              </button>
              <button
                type="button"
                className={`method-button ${method === 'upi' ? 'selected' : ''}`}
                onClick={() => setMethod('upi')}
              >
                <div className="method-icon">💳</div>
                <div className="method-name">UPI</div>
              </button>
            </div>
          </div>

          {/* Method Specific Fields */}
          {method === 'bank' ? (
            <div className="bank-details">
              <div className="form-group">
                <label className="form-label">Account Holder Name:</label>
                <input
                  type="text"
                  value={bankDetails.accountHolderName}
                  onChange={(e) => handleBankDetailsChange('accountHolderName', e.target.value)}
                  placeholder="Enter account holder name"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Account Number:</label>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => handleBankDetailsChange('accountNumber', e.target.value)}
                  placeholder="Enter account number"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">IFSC Code:</label>
                <input
                  type="text"
                  value={bankDetails.ifscCode}
                  onChange={(e) => handleBankDetailsChange('ifscCode', e.target.value)}
                  placeholder="Enter IFSC code"
                  className="form-input"
                />
              </div>
            </div>
          ) : (
            <div className="upi-details">
              <div className="form-group">
                <label className="form-label">UPI ID:</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="Enter UPI ID (e.g., mobile@upi)"
                  className="form-input"
                />
              </div>
            </div>
          )}

          {/* Amount Breakdown */}
          {amount && parseFloat(amount) > 0 && (
            <div className="amount-section">
              <div className="amount-row">
                <span className="amount-label">Amount:</span>
                <span className="amount-value">{formatCurrency(parseFloat(amount))}</span>
              </div>
              <div className="amount-row">
                <span className="amount-label">GST (18%):</span>
                <span className="amount-value">-{formatCurrency(calculateGST(parseFloat(amount)))}</span>
              </div>
              <div className="amount-row amount-total">
                <span className="amount-label">Net Amount:</span>
                <span className="amount-value">{formatCurrency(calculateNetAmount(parseFloat(amount)))}</span>
              </div>
            </div>
          )}

          <div className="form-buttons">
            <button 
              type="submit" 
              className="gradient-button"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Request Withdrawal'}
            </button>
          </div>
        </form>
      </div>

      {/* Withdrawal History */}
      <div className="history-section">
        <h2>Withdrawal History</h2>
        
        {withdrawals.length > 0 ? (
          <div>
            {withdrawals.slice(0, 5).map(withdrawal => (
              <div key={withdrawal.id} className="history-item">
                <div className="history-item-header">
                  <div className="history-item-amount">
                    {formatCurrency(withdrawal.amount)}
                  </div>
                  <span className={`history-item-status ${withdrawal.status}`}>
                    {withdrawal.status}
                  </span>
                </div>
                <div className="history-item-details">
                  <span>{withdrawal.method.toUpperCase()}</span>
                  <span>{formatDate(withdrawal.request_date)}</span>
                </div>
                {withdrawal.status === 'rejected' && withdrawal.remarks && (
                  <div style={{ 
                    color: 'var(--error)', 
                    fontSize: '14px',
                    marginTop: '8px'
                  }}>
                    Reason: {withdrawal.remarks}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="premium-card" style={{ textAlign: 'center', padding: '24px' }}>
            <p style={{ margin: '0', color: 'var(--text-secondary)' }}>
              No withdrawal history
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button className="fab" onClick={onBack}>
        +
      </button>
    </div>
  );
}

export default WithdrawalForm;
