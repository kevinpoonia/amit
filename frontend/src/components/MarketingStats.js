import React, { useState, useEffect } from 'react';
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

function MarketingStats() {
  const [stats, setStats] = useState({});
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMarketingStats();
  }, []);

  const fetchMarketingStats = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE_URL}/api/marketing-stats`);
      setStats(response.data.stats);
      setReviews(response.data.reviews);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch marketing stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="marketing-stats">
      <h2>Platform Statistics</h2>
      
      {error && <div className="error">{error}</div>}
      
      {loading ? (
        <div>Loading statistics...</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-item">
              <p className="stat-value">{stats.totalUsers?.toLocaleString() || '10,000,000'}</p>
              <p className="stat-label">Total Users</p>
            </div>
            <div className="stat-item">
              <p className="stat-value">{stats.dailyActiveUsers?.toLocaleString() || '1,000,000'}</p>
              <p className="stat-label">Daily Active</p>
            </div>
            <div className="stat-item">
              <p className="stat-value">₹{stats.totalWithdrawn?.toLocaleString() || '10 Cr'}</p>
              <p className="stat-label">Total Withdrawn</p>
            </div>
            <div className="stat-item">
              <p className="stat-value">{stats.successRate || '98.5'}%</p>
              <p className="stat-label">Success Rate</p>
            </div>
            <div className="stat-item">
              <p className="stat-value">{stats.averageRating || '4.9'}/5</p>
              <p className="stat-label">Average Rating</p>
            </div>
            <div className="stat-item">
              <p className="stat-value">{stats.totalReviews?.toLocaleString() || '25,000'}</p>
              <p className="stat-label">Total Reviews</p>
            </div>
          </div>
          
          <div className="anniversary-badge">
            <h3>5 YEARS ANNIVERSARY ACHIEVEMENT</h3>
          </div>
          
          <div className="fake-reviews">
            <h3>What Our Users Say</h3>
            <div className="reviews-grid">
              {reviews.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <p className="review-name">{review.name}</p>
                    <div className="review-rating">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                  </div>
                  <p className="review-comment">"{review.comment}"</p>
                  <p className="review-date">{review.date}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MarketingStats;
