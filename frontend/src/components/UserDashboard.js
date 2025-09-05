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

function UserDashboard({ token, userData, onLogout, onViewChange }) {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalProfit, setTotalProfit] = useState(0);
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);

    try {
      // Fetch investments and financial summary
      const [investmentsRes, financialSummaryRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/investments`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        axios.get(`${API_BASE_URL}/api/financial-summary`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ]);

      setInvestments(investmentsRes.data.investments || []);
      
      // Set financial data
      if (financialSummaryRes.data) {
        setTotalProfit(financialSummaryRes.data.totalProfit || 0);
        setWithdrawableBalance(financialSummaryRes.data.withdrawableBalance || 0);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      // Set error message to display to user
      setError('Failed to load dashboard data. Please try again.');
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Calculate investment progress percentage
  const calculateProgress = (investment) => {
    if (!investment || !investment.duration_days || investment.duration_days <= 0) return 0;
    
    const totalDays = investment.duration_days;
    const daysLeft = investment.days_left || 0;
    const daysPassed = totalDays - daysLeft;
    
    // Calculate progress as percentage
    const progress = (daysPassed / totalDays) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  

  return (
    <div className="user-dashboard">
      {/* Welcome Section */}
      <div className="premium-card" style={{ 
        background: 'linear-gradient(135deg, rgba(25, 25, 45, 0.7), rgba(65, 105, 225, 0.2))',
        textAlign: 'center',
        marginBottom: '24px',
        position: 'relative'
      }}>
        <button 
          onClick={onLogout}
          className="secondary-button"
          style={{ 
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '36px', 
            height: '36px', 
            borderRadius: '50%',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            cursor: 'pointer'
          }}
          title="Logout"
        >
          ⇦
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #4169e1, #6a8dff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h1 style={{ 
              margin: '0 0 4px 0', 
              fontSize: '24px', 
              background: 'linear-gradient(to right, var(--gold-primary), var(--royal-blue-light))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Welcome Back!
            </h1>
            <p style={{ margin: '0', color: 'var(--text-secondary)', fontSize: '16px' }}>
              {userData?.name || 'User'}
            </p>
          </div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Loading dashboard data...</div>}

      {/* Wallet Balance Card - Premium Financial Card */}
      <div className="premium-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h2 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '18px', 
              color: 'var(--text-secondary)',
              fontWeight: '600'
            }}>
              Wallet Balance
            </h2>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: 'var(--text-primary)',
              margin: '8px 0',
              background: 'linear-gradient(to right, var(--gold-primary), var(--gold-secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {formatCurrency(userData?.recharge_balance !== undefined ? userData?.recharge_balance : userData?.balance || 0)}
            </div>
          </div>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            borderRadius: '12px', 
            background: 'rgba(255, 215, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            💰
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
          <div>
            <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Total Profit
            </p>
            <p style={{ margin: '0', color: 'var(--success)', fontWeight: '600' }}>
              {formatCurrency(totalProfit)}
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Withdrawable
            </p>
            <p style={{ margin: '0', color: 'var(--text-primary)', fontWeight: '600' }}>
              {formatCurrency(withdrawableBalance)}
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Today
            </p>
            <p style={{ margin: '0', color: 'var(--success)', fontWeight: '600' }}>
              +{formatCurrency(investments.reduce((sum, investment) => {
                // Only include investments that are still active (days_left > 0)
                if (investment.days_left > 0) {
                  return sum + (investment.daily_income || 0);
                }
                return sum;
              }, 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Active Investments */}
      <div className="premium-card">
        <h2 style={{ 
          margin: '0 0 20px 0', 
          fontSize: '20px', 
          color: 'var(--text-primary)',
          fontWeight: '600'
        }}>
          Active Investments ({investments.length})
        </h2>
        
        {investments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {investments.map(investment => {
              const progress = calculateProgress(investment);
              return (
                <div key={investment.id} className="premium-card" style={{ 
                  margin: 0, 
                  padding: '16px',
                  background: 'rgba(30, 30, 50, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ 
                        margin: '0 0 4px 0', 
                        fontSize: '18px', 
                        color: 'var(--text-primary)',
                        fontWeight: '600'
                      }}>
                        {investment.plan_name}
                      </h3>
                      <p style={{ 
                        margin: '0', 
                        color: 'var(--gold-primary)', 
                        fontSize: '16px',
                        fontWeight: '600'
                      }}>
                        {formatCurrency(investment.amount)}
                      </p>
                    </div>
                    <span style={{ 
                      background: 'rgba(0, 200, 83, 0.1)',
                      color: 'var(--success)',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {investment.status}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Daily Income
                      </p>
                      <p style={{ margin: '0', color: 'var(--text-primary)', fontWeight: '600' }}>
                        {formatCurrency(investment.daily_income)}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Days Left
                      </p>
                      <p style={{ margin: '0', color: 'var(--text-primary)', fontWeight: '600' }}>
                        {investment.days_left}
                      </p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        ROI
                      </p>
                      <p style={{ margin: '0', color: 'var(--success)', fontWeight: '600' }}>
                        {investment.duration_days ? Math.round(((investment.daily_income * investment.duration_days) / investment.amount) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ 
                      height: '8px', 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${progress}%`,
                        background: 'linear-gradient(90deg, var(--royal-blue), var(--royal-blue-light))',
                        borderRadius: '4px',
                        transition: 'width 1s cubic-bezier(0.22, 0.61, 0.36, 1)'
                      }}></div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px'
                  }}>
                    <span>Progress</span>
                    <span>{investment.duration_days ? (investment.duration_days - investment.days_left) : 0}/{investment.duration_days || 0} days</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>
            No active investments
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '0 16px 24px 16px' }}>
        <h2 style={{ 
          margin: '0 0 16px 0', 
          fontSize: '20px', 
          color: 'var(--text-primary)',
          fontWeight: '600'
        }}>
          Quick Actions
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '16px',
          marginBottom: '24px'
        }}>
          <button 
            className="secondary-button"
            onClick={() => onViewChange('plans')}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '16px 8px',
              height: '80px'
            }}
          >
            <span style={{ fontSize: '24px', marginBottom: '8px' }}>📋</span>
            <span style={{ fontSize: '12px' }}>Products</span>
          </button>
          
          <button 
            className="secondary-button"
            onClick={() => onViewChange('recharge')}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '16px 8px',
              height: '80px'
            }}
          >
            <span style={{ fontSize: '24px', marginBottom: '8px' }}>💳</span>
            <span style={{ fontSize: '12px' }}>Recharge</span>
          </button>
          
          <button 
            className="secondary-button"
            onClick={() => onViewChange('withdraw')}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '16px 8px',
              height: '80px'
            }}
          >
            <span style={{ fontSize: '24px', marginBottom: '8px' }}>💸</span>
            <span style={{ fontSize: '12px' }}>Withdraw</span>
          </button>
          
          <button 
            className="secondary-button"
            onClick={copyReferralLink}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '16px 8px',
              height: '80px'
            }}
          >
            <span style={{ fontSize: '24px', marginBottom: '8px' }}>🔗</span>
            <span style={{ fontSize: '12px' }}>Refer</span>
          </button>
        </div>
        
        {userData?.is_admin && (
          <button 
            className="gradient-button"
            onClick={() => onViewChange('admin')}
            style={{ width: '100%', padding: '16px' }}
          >
            <span>🔒 Admin Panel</span>
          </button>
        )}
      </div>

      {/* Market Insights */}
      <div className="premium-card">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '12px', 
            background: 'rgba(255, 171, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            marginRight: '12px'
          }}>
            📈
          </div>
          <h2 style={{ 
            margin: '0', 
            fontSize: '18px', 
            color: 'var(--text-primary)',
            fontWeight: '600'
          }}>
            Market Insights
          </h2>
        </div>
        
        <p style={{ 
          margin: '0 0 16px 0', 
          color: 'var(--text-secondary)',
          lineHeight: '1.5'
        }}>
          Market is bullish today! High-performing plans showing +3.2% returns.
        </p>
        
        <button 
          className="secondary-button"
          onClick={() => onViewChange('plans')}
          style={{ width: '100%' }}
        >
          View Recommendations
        </button>
      </div>

      {/* Security Badge */}
      <div className="premium-card">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '12px', 
            background: 'rgba(0, 200, 83, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            marginRight: '12px'
          }}>
            🔒
          </div>
          <div>
            <h3 style={{ 
              margin: '0 0 4px 0', 
              fontSize: '16px', 
              color: 'var(--text-primary)',
              fontWeight: '600'
            }}>
              Platform Security
            </h3>
            <p style={{ 
              margin: '0', 
              color: 'var(--text-secondary)',
              fontSize: '14px'
            }}>
              Your investments are protected with bank-grade encryption.
            </p>
          </div>
        </div>
        <button 
          className="secondary-button"
          style={{ width: '100%', marginTop: '16px' }}
        >
          Learn More
        </button>
      </div>

      {/* Floating Action Button */}
      <button className="fab" onClick={() => onViewChange('recharge')}>
        +
      </button>
    </div>
  );
}

export default UserDashboard;