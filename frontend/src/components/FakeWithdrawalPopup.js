import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://investmentpro-nu7s.onrender.com";

function FakeWithdrawalPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // Start interval on mount
    timerRef.current = setInterval(() => {
      generateFakeWithdrawal();
    }, 10000); // every 10s

    // Cleanup on unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const generateFakeWithdrawal = async () => {
    try {
      // Try to fetch from backend
      const response = await axios.get(`${API_BASE_URL}/api/fake-withdrawal`);
      setWithdrawalData(response.data.withdrawal);
    } catch (err) {
      console.warn("Backend route missing, using local fake data...");

      // Fallback: generate local fake withdrawal
      const fakeNames = ["Rahul", "Sneha", "Amit", "Kavya", "Arjun", "Priya"];
      const randomName = fakeNames[Math.floor(Math.random() * fakeNames.length)];
      const fakeAmount = Math.floor(Math.random() * 5000 + 500); // ₹500 - ₹5500
      const fakeData = {
        name: randomName,
        amount: fakeAmount,
        timestamp: new Date().toLocaleTimeString("en-IN"),
      };
      setWithdrawalData(fakeData);
    }

    // Show popup
    setShowPopup(true);

    // Auto-hide after 5s
    setTimeout(() => setShowPopup(false), 5000);
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
