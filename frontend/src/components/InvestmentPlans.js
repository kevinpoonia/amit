import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

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

function InvestmentPlans({ token, onPlanPurchase, userData, onBack }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProductPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.get(`${API_BASE_URL}/api/product-plans`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPlans(response.data.plans);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch product plans');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProductPlans();
  }, [fetchProductPlans]);

  const handlePurchasePlan = async (planId) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/purchase-plan`, 
        { planId }, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setSuccess('Plan purchased successfully!');
      // Call the parent function to update user data
      if (onPlanPurchase) {
        onPlanPurchase(response.data.newBalance);
      }
      
      // Refresh plans to update availability
      fetchProductPlans();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to purchase plan');
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

  return (
    <div className="investment-plans" style={{ padding: '16px' }}>
      {/* Header with Back Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        padding: '0 8px'
      }}>
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
        <h1 style={{ 
          margin: '0', 
          fontSize: '24px', 
          background: 'linear-gradient(to right, var(--gold-primary), var(--royal-blue-light))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: '700'
        }}>
          Investment Plans
        </h1>
        <div style={{ width: '40px' }}></div> {/* Spacer for alignment */}
      </div>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading plans...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {plans.map(plan => {
            // Get category color
            const categoryColors = {
              beginner: { bg: 'rgba(0, 200, 83, 0.1)', text: 'var(--success)', border: 'rgba(0, 200, 83, 0.3)' },
              intermediate: { bg: 'rgba(65, 105, 225, 0.1)', text: 'var(--royal-blue)', border: 'rgba(65, 105, 225, 0.3)' },
              advanced: { bg: 'rgba(123, 31, 162, 0.1)', text: '#7b1fa2', border: 'rgba(123, 31, 162, 0.3)' },
              premium: { bg: 'rgba(255, 215, 0, 0.1)', text: 'var(--gold-primary)', border: 'rgba(255, 215, 0, 0.3)' }
            };
            
            const color = categoryColors[plan.category] || categoryColors.premium;
            
            return (
              <div 
                key={plan.id} 
                className="premium-card"
                style={{ 
                  margin: 0,
                  border: `1px solid ${color.border}`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Category Indicator */}
                <div style={{ 
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  background: color.bg,
                  color: color.text,
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  borderBottomLeftRadius: '12px'
                }}>
                  {plan.category}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div>
                    <h3 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '20px', 
                      color: 'var(--text-primary)',
                      fontWeight: '600'
                    }}>
                      {plan.name}
                    </h3>
                    <div style={{ 
                      fontSize: '28px', 
                      fontWeight: '700', 
                      color: 'var(--gold-primary)',
                      margin: '8px 0'
                    }}>
                      {formatCurrency(plan.price)}
                    </div>
                  </div>
                  <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    borderRadius: '12px', 
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}>
                    💼
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ 
                      margin: '0 0 4px 0', 
                      color: 'var(--text-secondary)', 
                      fontSize: '12px'
                    }}>
                      Daily Income
                    </p>
                    <p style={{ 
                      margin: '0', 
                      color: 'var(--text-primary)', 
                      fontWeight: '600',
                      fontSize: '16px'
                    }}>
                      {formatCurrency(plan.dailyIncome)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ 
                      margin: '0 0 4px 0', 
                      color: 'var(--text-secondary)', 
                      fontSize: '12px'
                    }}>
                      Duration
                    </p>
                    <p style={{ 
                      margin: '0', 
                      color: 'var(--text-primary)', 
                      fontWeight: '600',
                      fontSize: '16px'
                    }}>
                      {plan.durationDays} Days
                    </p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ 
                      margin: '0 0 4px 0', 
                      color: 'var(--text-secondary)', 
                      fontSize: '12px'
                    }}>
                      Profit
                    </p>
                    <p style={{ 
                      margin: '0', 
                      color: 'var(--success)', 
                      fontWeight: '600',
                      fontSize: '16px'
                    }}>
                      {formatCurrency(plan.totalReturn - plan.price)}
                    </p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}>
                    <span>Progress</span>
                    <span>0/{formatCurrency(plan.totalReturn)}</span>
                  </div>
                  <div style={{ 
                    height: '10px', 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: '5px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      height: '100%', 
                      width: '0%',
                      background: `linear-gradient(90deg, ${color.text}, ${color.text}80)`,
                      borderRadius: '5px'
                    }}></div>
                  </div>
                </div>
                
                <button 
                  className="gradient-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePurchasePlan(plan.id);
                  }}
                  disabled={loading || (userData?.balance || 0) < plan.price}
                  style={{ width: '100%', padding: '16px' }}
                >
                  {loading ? 'Processing...' : 
                   (userData?.balance || 0) < plan.price ? 'Insufficient Balance' : 'Purchase Plan'}
                </button>
                
                {(userData?.balance || 0) < plan.price && (
                  <div style={{ 
                    textAlign: 'center', 
                    color: 'var(--error)', 
                    fontSize: '14px',
                    marginTop: '8px'
                  }}>
                    Insufficient balance
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Button */}
      <button className="fab" onClick={() => alert('Recharge clicked')}>
        +
      </button>
    </div>
  );
}

export default InvestmentPlans;