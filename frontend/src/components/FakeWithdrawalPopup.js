import React, { useState, useEffect } from "react";
import axios from "axios";

// Determine the API base URL
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return "https://investmentpro-nu7s.onrender.com";
  } else {
    return ""; // dev proxy
  }
};
const API_BASE_URL = getApiBaseUrl();

function FakeWithdrawalPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      generateFakeWithdrawal();
    }, 10000); // every 10s

    return () => clearInterval(interval);
  }, []);

  const generateFakeWithdrawal = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/fake-withdrawal`);
      const withdrawal = response.data?.withdrawal;

      if (withdrawal) {
        setWithdrawalData(withdrawal);
        setShowPopup(true);

        // Hide popup after 5 seconds
        setTimeout(() => {
          setShowPopup(false);
        }, 5000);
      }
    } catch (err) {
      console.error("Failed to generate fake withdrawal:", err);
    }
  };

  if (!showPopup || !withdrawalData) return null;

  return (
    <div
      className="fixed bottom-6 right-6 bg-white border border-gray-300 rounded-xl shadow-lg p-4 w-72 animate-fadeIn z-50"
      style={{
        animation: "fadeIn 0.3s ease",
      }}
    >
      <p className="font-bold text-green-600">💸 New Withdrawal!</p>
      <p className="text-gray-800">{withdrawalData.name}</p>
      <p className="text-lg font-semibold">₹{withdrawalData.amount.toLocaleString()}</p>
      <p className="text-xs text-gray-500">{withdrawalData.timestamp}</p>
    </div>
  );
}

export default FakeWithdrawalPopup;
