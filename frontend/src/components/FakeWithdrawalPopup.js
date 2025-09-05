import React, { useState, useEffect } from 'react';
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

function FakeWithdrawalPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState(null);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    // Start the timer when component mounts
    startTimer();
    
    // Cleanup timer on unmount
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, []);

  const startTimer = () => {
    // Clear existing timer if any
    if (timer) {
      clearInterval(timer);
    }
    
    // Start new timer (every 10 seconds)
    const newTimer = setInterval(() => {
      generateFakeWithdrawal();
    }, 10000); // Every 10 seconds
    
    setTimer(newTimer);
  };

  const generateFakeWithdrawal = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fake-withdrawal`);
      setWithdrawalData(response.data.withdrawal);
      setShowPopup(true);
      
      // Hide popup after 5 seconds
      setTimeout(() => {
        setShowPopup(false);
      }, 5000);
    } catch (err) {
      console.error('Failed to generate fake withdrawal:', err);
    }
  };

  return (
    <>
      {showPopup && withdrawalData && (
        <div className="fake-withdrawal-popup">
          <div className="popup-content">
            <p><strong>New Withdrawal!</strong></p>
            <p>{withdrawalData.name}</p>
            <p>₹{withdrawalData.amount.toLocaleString()}</p>
            <p>{withdrawalData.timestamp}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default FakeWithdrawalPopup;