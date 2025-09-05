import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './RechargeForm.css';
import qrCodeImage from '../assets/qr-code.png';

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

function RechargeForm({ token, userData, onBack, onViewChange }) {
  const [step, setStep] = useState(1); // 1: Enter amount, 2: Show QR, 3: Enter UTR
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [utr, setUtr] = useState('');
  const [recharges, setRecharges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRecharges = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/recharges`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRecharges(response.data.recharges || []);
    } catch (err) {
      console.error('Failed to fetch recharges:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchRecharges();
  }, [fetchRecharges]);

  

  const handleKeyPress = (key) => {
    if (key === 'backspace') {
      setAmount(prev => prev.slice(0, -1));
    } else if (key === 'clear') {
      setAmount('');
    } else if (amount.length < 6) {
      setAmount(prev => prev + key);
    }
  };

  const handleRequestRecharge = async () => {
    if (!amount || parseInt(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // First, get the UPI ID
      const upiResponse = await axios.get(`${API_BASE_URL}/api/upi-id`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUpiId(upiResponse.data.upiId);
      
      // Then request the recharge
      await axios.post(`${API_BASE_URL}/api/recharge`, 
        { amount: parseInt(amount) }, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setSuccess('Recharge request submitted successfully!');
      setStep(2); // Move to QR code step
      fetchRecharges(); // Refresh recharges list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request recharge');
    } finally {
      setLoading(false);
    }
  };

  const handleUtrSubmit = async () => {
    if (!utr || utr.length < 12) {
      setError('Please enter a valid UTR number (12 digits)');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Submit UTR for the most recent pending recharge
      const pendingRecharge = recharges.find(r => r.status === 'pending');
      
      if (!pendingRecharge) {
        setError('No pending recharge found');
        return;
      }

      await axios.put(`${API_BASE_URL}/api/recharge/${pendingRecharge.id}/utr`, 
        { utr }, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setSuccess('UTR submitted successfully! Awaiting admin approval.');
      setStep(1); // Reset to initial step
      setAmount('');
      setUtr('');
      fetchRecharges(); // Refresh recharges list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit UTR');
    } finally {
      setLoading(false);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setSuccess('UPI ID copied to clipboard!');
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
    <div className="recharge-container">
      {/* Header */}
      <div className="recharge-header">
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
        <h1>Wallet Recharge</h1>
        <button 
          onClick={() => window.location.reload()} // This will trigger logout in the App component
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
          ↪
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="recharge-card">
        {/* Step Indicator */}
        <div className="recharge-steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-circle">1</div>
            <div className="step-label">Amount</div>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-circle">2</div>
            <div className="step-label">Pay</div>
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <div className="step-circle">3</div>
            <div className="step-label">Confirm</div>
          </div>
        </div>

        {step === 1 && (
          <div className="recharge-step">
            <h2>Enter Recharge Amount</h2>
            
            {/* Amount Display */}
            <div className="amount-display">
              {amount || '0'}
            </div>
            
            {/* Numeric Keypad */}
            <div className="keypad-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, '00', 'backspace'].map(key => (
                <button
                  key={key}
                  className={`keypad-button ${key === 0 ? 'zero' : ''} ${key === 'backspace' ? 'action' : ''}`}
                  onClick={() => handleKeyPress(key === 'backspace' ? 'backspace' : key.toString())}
                >
                  {key === 'backspace' ? '⌫' : key}
                </button>
              ))}
            </div>
            
            <div className="form-buttons">
              <button 
                className="secondary-button"
                onClick={() => handleKeyPress('clear')}
              >
                Clear
              </button>
              <button 
                className="gradient-button"
                onClick={handleRequestRecharge}
                disabled={loading || !amount || parseInt(amount) <= 0}
              >
                {loading ? 'Processing...' : 'Proceed to Pay'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="recharge-step">
            <h2>Complete Payment</h2>
            
            <div className="qr-section">
              <p className="qr-instructions">
                Scan this QR code with any UPI app to make payment of {formatCurrency(parseInt(amount) || 0)}
              </p>
              
              <div className="qr-code-container">
                <img src={qrCodeImage} alt="UPI QR Code" style={{ width: '200px', height: '200px', maxWidth: '100%' }} />
              </div>
              
              <p className="qr-instructions">
                Or pay using UPI ID:
              </p>
              
              <div className="upi-id-display">
                {upiId}
                <button className="copy-button" onClick={copyUpiId}>
                  Copy
                </button>
              </div>
            </div>
            
            <div className="form-buttons">
              <button 
                className="secondary-button"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button 
                className="gradient-button"
                onClick={() => setStep(3)}
              >
                I've Paid
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="recharge-step">
            <h2>Enter UTR Number</h2>
            <p className="qr-instructions">
              Enter the 12-digit UTR number from your UPI app transaction
            </p>
            
            <div className="utr-input-container">
              <input
                type="text"
                placeholder="Enter 12-digit UTR number"
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
                maxLength="12"
                className="utr-input"
              />
            </div>
            
            <div className="form-buttons">
              <button 
                className="secondary-button"
                onClick={() => setStep(2)}
              >
                Back
              </button>
              <button 
                className="gradient-button"
                onClick={handleUtrSubmit}
                disabled={loading || !utr || utr.length < 12}
              >
                {loading ? 'Submitting...' : 'Submit UTR'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recharge History */}
      <div className="history-section">
        <h2>Recharge History</h2>
        
        {recharges.length > 0 ? (
          <div>
            {recharges.slice(0, 5).map(recharge => (
              <div key={recharge.id} className="history-item">
                <div className="history-item-header">
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>
                    {formatCurrency(recharge.amount)}
                  </div>
                  <span className={`history-item-status ${recharge.status}`}>
                    {recharge.status}
                  </span>
                </div>
                <div className="history-item-details">
                  <span>UTR: {recharge.utr || 'Pending'}</span>
                  <span>{formatDate(recharge.request_date)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="premium-card" style={{ textAlign: 'center', padding: '24px' }}>
            <p style={{ margin: '0', color: 'var(--text-secondary)' }}>
              No recharge history
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

export default RechargeForm;