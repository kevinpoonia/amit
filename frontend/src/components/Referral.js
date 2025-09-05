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

function Referral({ token, userData, onBack }) {
  const [referralLink, setReferralLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('referral');
  const [referralDetails, setReferralDetails] = useState(null);
  const [leaderBoxWinners, setLeaderBoxWinners] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchReferralLink = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.get(`${API_BASE_URL}/api/referral-link`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setReferralLink(response.data.referralLink);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch referral link');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchReferralDetails = useCallback(async () => {
    if (activeTab !== 'details') return;
    
    setDetailsLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE_URL}/api/referral-details`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setReferralDetails(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch referral details');
    } finally {
      setDetailsLoading(false);
    }
  }, [token, activeTab]);

  const fetchLeaderBoxWinners = useCallback(async () => {
    if (activeTab !== 'leaderbox') return;
    
    setDetailsLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE_URL}/api/leader-box-winners`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setLeaderBoxWinners(response.data.winners);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch leader box winners');
    } finally {
      setDetailsLoading(false);
    }
  }, [token, activeTab]);

  useEffect(() => {
    if (token) {
      fetchReferralLink();
    }
  }, [token, fetchReferralLink]);

  useEffect(() => {
    if (token && activeTab === 'details') {
      fetchReferralDetails();
    } else if (token && activeTab === 'leaderbox') {
      fetchLeaderBoxWinners();
    }
  }, [token, activeTab, fetchReferralDetails, fetchLeaderBoxWinners]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('Copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    }).catch(err => {
      setError('Failed to copy to clipboard');
    });
  };

  const copyReferralLink = () => {
    if (referralLink) {
      copyToClipboard(referralLink);
    } else {
      fetchReferralLink().then(() => {
        if (referralLink) {
          copyToClipboard(referralLink);
        }
      });
    }
  };

  const shareReferralLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join Investment Platform',
        text: 'Check out this amazing investment platform!',
        url: referralLink
      }).catch(err => {
        console.error('Sharing failed:', err);
        copyReferralLink();
      });
    } else {
      copyReferralLink();
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px'
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
          Refer & Earn
        </h1>
        <div style={{ width: '40px' }}></div> {/* Spacer for alignment */}
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      {/* Debug: Show current active tab */}
      <div style={{ 
        padding: '8px', 
        background: 'rgba(255, 215, 0, 0.1)', 
        borderRadius: '4px', 
        marginBottom: '12px',
        textAlign: 'center',
        color: 'var(--gold-primary)',
        fontSize: '14px'
      }}>
        Active Tab: {activeTab}
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        background: 'rgba(30, 30, 50, 0.5)',
        padding: '4px',
        borderRadius: '12px',
        border: '1px solid var(--card-border)'
      }}>
        <button
          onClick={() => setActiveTab('referral')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--gold-primary)',
            background: activeTab === 'referral' ? 'var(--gold-primary)' : 'transparent',
            color: activeTab === 'referral' ? 'var(--text-primary)' : 'var(--gold-primary)',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Referral
        </button>
        <button
          onClick={() => setActiveTab('details')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--gold-primary)',
            background: activeTab === 'details' ? 'var(--gold-primary)' : 'transparent',
            color: activeTab === 'details' ? 'var(--text-primary)' : 'var(--gold-primary)',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('leaderbox')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--gold-primary)',
            background: activeTab === 'leaderbox' ? 'var(--gold-primary)' : 'transparent',
            color: activeTab === 'leaderbox' ? 'var(--text-primary)' : 'var(--gold-primary)',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Leader Box
        </button>
      </div>

      {/* Referral Tab Content */}
      {activeTab === 'referral' && (
        <div className="premium-card">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '24px', 
              color: 'var(--text-primary)',
              fontWeight: '600'
            }}>
              Invite Friends, Earn Rewards!
            </h2>
            <p style={{ 
              margin: '0', 
              color: 'var(--text-secondary)',
              lineHeight: '1.6'
            }}>
              Share your referral link and earn when your friends join and make their first investment.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div className="premium-card" style={{ 
              margin: 0, 
              padding: '20px',
              textAlign: 'center',
              background: 'rgba(30, 30, 50, 0.5)',
              border: '1px solid rgba(255, 215, 0, 0.2)'
            }}>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: 'var(--gold-primary)',
                margin: '0 0 8px 0'
              }}>
                ₹100
              </div>
              <div style={{ 
                color: 'var(--text-secondary)',
                fontSize: '14px'
              }}>
                Per Active Referral
              </div>
              <div style={{ 
                color: 'var(--text-secondary)',
                fontSize: '12px',
                marginTop: '4px',
                fontStyle: 'italic'
              }}>
                (One time per referred user)
              </div>
            </div>
            <div className="premium-card" style={{ 
              margin: 0, 
              padding: '20px',
              textAlign: 'center',
              background: 'rgba(30, 30, 50, 0.5)',
              border: '1px solid rgba(65, 105, 225, 0.2)'
            }}>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: 'var(--royal-blue-light)',
                margin: '0 0 8px 0'
              }}>
                ₹50
              </div>
              <div style={{ 
                color: 'var(--text-secondary)',
                fontSize: '14px'
              }}>
                Friend's Reward
              </div>
            </div>
          </div>

          <div className="premium-card" style={{ 
            margin: '0 0 24px 0', 
            padding: '20px',
            background: 'rgba(30, 30, 50, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <h3 style={{ 
              margin: '0 0 16px 0', 
              color: 'var(--text-primary)',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              Your Referral Link
            </h3>
            
            <div style={{ 
              position: 'relative',
              marginBottom: '16px'
            }}>
              <input
                type="text"
                value={referralLink || (loading ? 'Loading...' : '')}
                readOnly
                placeholder="Loading referral link..."
                style={{ 
                  width: '100%',
                  padding: '16px',
                  background: 'rgba(30, 30, 50, 0.5)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  paddingRight: '100px'
                }}
              />
              <button 
                onClick={copyReferralLink}
                disabled={!referralLink || loading}
                className="secondary-button"
                style={{ 
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '8px 16px'
                }}
              >
                {loading ? 'Loading...' : 'Copy'}
              </button>
            </div>
            
            <button 
              onClick={shareReferralLink}
              className="gradient-button"
              style={{ width: '100%', padding: '16px' }}
              disabled={!referralLink || loading}
            >
              Share Referral Link
            </button>
          </div>

          <div className="premium-card" style={{ 
            margin: 0, 
            padding: '20px',
            background: 'rgba(30, 30, 50, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <h3 style={{ 
              margin: '0 0 12px 0', 
              color: 'var(--text-primary)',
              fontWeight: '600'
            }}>
              How it works:
            </h3>
            <ol style={{ 
              margin: '0', 
              padding: '0 0 0 20px',
              color: 'var(--text-secondary)'
            }}>
              <li style={{ margin: '8px 0' }}>Share your referral link with friends</li>
              <li style={{ margin: '8px 0' }}>Friend signs up using your link</li>
              <li style={{ margin: '8px 0' }}>Friend makes their first investment</li>
              <li style={{ margin: '8px 0' }}>You both receive rewards!</li>
            </ol>
            <p style={{ 
              margin: '12px 0 0 0', 
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              * Active referral means that whenever the person you refer purchases a product, 
              you will receive ₹100 only once from an active account.
            </p>
          </div>
        </div>
      )}

      {/* Details Tab Content */}
      {activeTab === 'details' && (
        <div className="premium-card">
          <h2 style={{ 
            margin: '0 0 24px 0', 
            fontSize: '24px', 
            color: 'var(--text-primary)',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Referral Details
          </h2>
          
          {detailsLoading ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <p>Loading referral details...</p>
            </div>
          ) : referralDetails ? (
            <div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div className="premium-card" style={{ 
                  margin: 0, 
                  padding: '20px',
                  textAlign: 'center',
                  background: 'rgba(30, 30, 50, 0.5)',
                  border: '1px solid rgba(255, 215, 0, 0.2)'
                }}>
                  <div style={{ 
                    fontSize: '28px', 
                    fontWeight: '700', 
                    color: 'var(--gold-primary)',
                    margin: '0 0 8px 0'
                  }}>
                    {referralDetails.activeReferrals.length}
                  </div>
                  <div style={{ 
                    color: 'var(--text-secondary)',
                    fontSize: '14px'
                  }}>
                    Active Referrals
                  </div>
                </div>
                <div className="premium-card" style={{ 
                  margin: 0, 
                  padding: '20px',
                  textAlign: 'center',
                  background: 'rgba(30, 30, 50, 0.5)',
                  border: '1px solid rgba(65, 105, 225, 0.2)'
                }}>
                  <div style={{ 
                    fontSize: '28px', 
                    fontWeight: '700', 
                    color: 'var(--royal-blue-light)',
                    margin: '0 0 8px 0'
                  }}>
                    {referralDetails.referredUsers.length}
                  </div>
                  <div style={{ 
                    color: 'var(--text-secondary)',
                    fontSize: '14px'
                  }}>
                    Total Referred
                  </div>
                </div>
              </div>
              
              <div className="premium-card" style={{ 
                margin: '0 0 24px 0', 
                padding: '20px',
                background: 'rgba(30, 30, 50, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <h3 style={{ 
                  margin: '0 0 16px 0', 
                  color: 'var(--text-primary)',
                  fontWeight: '600'
                }}>
                  Active Referrals ({referralDetails.activeReferrals.length})
                </h3>
                
                {referralDetails.activeReferrals.length === 0 ? (
                  <p style={{ 
                    margin: '0', 
                    color: 'var(--text-secondary)',
                    textAlign: 'center'
                  }}>
                    No active referrals yet. Share your link to start earning!
                  </p>
                ) : (
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {referralDetails.activeReferrals.map((user) => (
                      <div key={user.id} style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        background: 'rgba(30, 30, 50, 0.3)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 215, 0, 0.1)'
                      }}>
                        <div>
                          <div style={{ 
                            fontWeight: '600',
                            color: 'var(--text-primary)'
                          }}>
                            {user.name}
                          </div>
                          <div style={{ 
                            fontSize: '14px',
                            color: 'var(--text-secondary)'
                          }}>
                            {user.email}
                          </div>
                        </div>
                        <div style={{ 
                          fontWeight: '700',
                          color: 'var(--gold-primary)'
                        }}>
                          ₹100
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="premium-card" style={{ 
                margin: 0, 
                padding: '20px',
                background: 'rgba(30, 30, 50, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <h3 style={{ 
                  margin: '0 0 16px 0', 
                  color: 'var(--text-primary)',
                  fontWeight: '600'
                }}>
                  All Referred Users ({referralDetails.referredUsers.length})
                </h3>
                
                {referralDetails.referredUsers.length === 0 ? (
                  <p style={{ 
                    margin: '0', 
                    color: 'var(--text-secondary)',
                    textAlign: 'center'
                  }}>
                    You haven't referred any users yet.
                  </p>
                ) : (
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {referralDetails.referredUsers.map((user) => (
                      <div key={user.id} style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        background: 'rgba(30, 30, 50, 0.3)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        <div>
                          <div style={{ 
                            fontWeight: '600',
                            color: 'var(--text-primary)'
                          }}>
                            {user.name}
                          </div>
                          <div style={{ 
                            fontSize: '14px',
                            color: 'var(--text-secondary)'
                          }}>
                            {user.email}
                          </div>
                        </div>
                        <div style={{ 
                          fontSize: '12px',
                          color: 'var(--text-secondary)'
                        }}>
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <p>No referral data available.</p>
            </div>
          )}
        </div>
      )}

      {/* Leader Box Tab Content */}
      {activeTab === 'leaderbox' && (
        <div className="premium-card">
          <h2 style={{ 
            margin: '0 0 24px 0', 
            fontSize: '24px', 
            color: 'var(--text-primary)',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Leader Box Winners
          </h2>
          
          <div className="premium-card" style={{ 
            margin: '0 0 24px 0', 
            padding: '20px',
            background: 'rgba(30, 30, 50, 0.5)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            textAlign: 'center'
          }}>
            <h3 style={{ 
              margin: '0 0 12px 0', 
              color: 'var(--gold-primary)',
              fontWeight: '700'
            }}>
              Daily Prize Pool
            </h3>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: 'var(--text-primary)',
              margin: '0 0 16px 0'
            }}>
              ₹1,00,000 - ₹5,00,000
            </div>
            <p style={{ 
              margin: '0', 
              color: 'var(--text-secondary)',
              fontSize: '14px'
            }}>
              * Top 10 winners are randomly generated daily
            </p>
          </div>
          
          {detailsLoading ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <p>Loading winners...</p>
            </div>
          ) : leaderBoxWinners.length > 0 ? (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {leaderBoxWinners.map((winner, index) => (
                <div key={winner.id} style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: 'rgba(30, 30, 50, 0.3)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{ 
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: index < 3 ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      color: index < 3 ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <div style={{ 
                        fontWeight: '600',
                        color: 'var(--text-primary)'
                      }}>
                        {winner.name}
                      </div>
                      <div style={{ 
                        fontSize: '12px',
                        color: 'var(--text-secondary)'
                      }}>
                        {winner.date}
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    fontWeight: '700',
                    color: 'var(--gold-primary)'
                  }}>
                    ₹{winner.amount}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <p>No winners data available.</p>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <button className="fab" onClick={onBack}>
        +
      </button>
    </div>
  );
}

export default Referral;
