import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./RechargeForm.css";
import qrCodeImage from "../assets/qr-code.png";

// Use environment variable for API base here
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://investmentpro-nu7s.onrender.com";

function RechargeForm({ token, onBack }) {
  const [step, setStep] = useState(1); // 1: Amount, 2: QR, 3: UTR
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [utr, setUtr] = useState("");
  const [recharges, setRecharges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch recharge history
  const fetchRecharges = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/recharges`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecharges(response.data.recharges || []);
    } catch (err) {
      console.error("Failed to fetch recharges:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchRecharges();
  }, [fetchRecharges]);

  // Keypad handling
  const handleKeyPress = (key) => {
    if (key === "backspace") {
      setAmount((prev) => prev.slice(0, -1));
    } else if (key === "clear") {
      setAmount("");
    } else if (amount.length < 6) {
      setAmount((prev) => prev + key);
    }
  };

  // Request recharge
  const handleRequestRecharge = async () => {
    if (!amount || parseInt(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Get UPI ID
      const upiResponse = await axios.get(`${API_BASE_URL}/api/upi-id`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUpiId(upiResponse.data.upiId);

      // Request recharge
      await axios.post(
        `${API_BASE_URL}/api/recharge`,
        { amount: parseInt(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("Recharge request submitted successfully!");
      setStep(2);
      fetchRecharges();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to request recharge");
    } finally {
      setLoading(false);
    }
  };

  // Submit UTR
  const handleUtrSubmit = async () => {
    if (!utr || utr.length < 12) {
      setError("Please enter a valid UTR number (min 12 chars)");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const pendingRecharge = recharges.find((r) => r.status === "pending");
      if (!pendingRecharge) {
        setError("No pending recharge found");
        return;
      }

      await axios.put(
        `${API_BASE_URL}/api/recharge/${pendingRecharge.id}/utr`,
        { utr },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("UTR submitted successfully! Awaiting admin approval.");
      setStep(1);
      setAmount("");
      setUtr("");
      fetchRecharges();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit UTR");
    } finally {
      setLoading(false);
    }
  };

  // Copy UPI
  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setSuccess("UPI ID copied to clipboard!");
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amt);

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="recharge-container">
      {/* Header */}
      <div className="recharge-header">
        <button onClick={onBack} className="secondary-button">
          ←
        </button>
        <h1>Wallet Recharge</h1>
        <button
          onClick={() => window.location.reload()}
          className="secondary-button"
        >
          ↪
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Steps */}
      <div className="recharge-card">
        {/* Stepper */}
        <div className="recharge-steps">
          {["Amount", "Pay", "Confirm"].map((label, i) => {
            const stepNum = i + 1;
            return (
              <div
                key={label}
                className={`step ${step >= stepNum ? "active" : ""} ${
                  step > stepNum ? "completed" : ""
                }`}
              >
                <div className="step-circle">{stepNum}</div>
                <div className="step-label">{label}</div>
              </div>
            );
          })}
        </div>

        {/* Step 1: Amount */}
        {step === 1 && (
          <div className="recharge-step">
            <h2>Enter Recharge Amount</h2>
            <div className="amount-display">{amount || "0"}</div>

            {/* Keypad */}
            <div className="keypad-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, "00", "backspace"].map((key) => (
                <button
                  key={key}
                  className={`keypad-button ${
                    key === "backspace" ? "action" : ""
                  }`}
                  onClick={() =>
                    handleKeyPress(
                      key === "backspace" ? "backspace" : key.toString()
                    )
                  }
                >
                  {key === "backspace" ? "⌫" : key}
                </button>
              ))}
            </div>

            <div className="form-buttons">
              <button
                className="secondary-button"
                onClick={() => handleKeyPress("clear")}
              >
                Clear
              </button>
              <button
                className="gradient-button"
                onClick={handleRequestRecharge}
                disabled={loading || !amount || parseInt(amount) <= 0}
              >
                {loading ? "Processing..." : "Proceed to Pay"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: QR */}
        {step === 2 && (
          <div className="recharge-step">
            <h2>Complete Payment</h2>
            <p>
              Scan QR to pay {formatCurrency(parseInt(amount) || 0)} or use UPI
              ID:
            </p>
            <img
              src={qrCodeImage}
              alt="UPI QR Code"
              style={{ width: "200px", height: "200px" }}
            />
            <div className="upi-id-display">
              {upiId}
              <button className="copy-button" onClick={copyUpiId}>
                Copy
              </button>
            </div>
            <div className="form-buttons">
              <button className="secondary-button" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="gradient-button" onClick={() => setStep(3)}>
                I've Paid
              </button>
            </div>
          </div>
        )}

        {/* Step 3: UTR */}
        {step === 3 && (
          <div className="recharge-step">
            <h2>Enter UTR Number</h2>
            <input
              type="text"
              placeholder="Enter min 12-digit UTR"
              value={utr}
              onChange={(e) =>
                setUtr(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20))
              }
              className="utr-input"
            />
            <div className="form-buttons">
              <button className="secondary-button" onClick={() => setStep(2)}>
                Back
              </button>
              <button
                className="gradient-button"
                onClick={handleUtrSubmit}
                disabled={loading || !utr || utr.length < 12}
              >
                {loading ? "Submitting..." : "Submit UTR"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="history-section">
        <h2>Recharge History</h2>
        {recharges.length > 0 ? (
          recharges.slice(0, 5).map((r) => (
            <div key={r.id} className="history-item">
              <div className="history-item-header">
                <div>{formatCurrency(r.amount)}</div>
                <span className={`history-item-status ${r.status}`}>
                  {r.status}
                </span>
              </div>
              <div className="history-item-details">
                <span>UTR: {r.utr || "Pending"}</span>
                <span>{formatDate(r.request_date)}</span>
              </div>
            </div>
          ))
        ) : (
          <p>No recharge history</p>
        )}
      </div>
    </div>
  );
}

export default RechargeForm;
