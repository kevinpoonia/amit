import React, { useState, useEffect } from 'react';
import './App.css';
import UserDashboard from './components/UserDashboard';
import InvestmentPlans from './components/InvestmentPlans';
import WithdrawalForm from './components/WithdrawalForm';
import RechargeForm from './components/RechargeForm';
import Referral from './components/Referral';
import AdminPanel from './components/AdminPanel';

function App() {
  // Removed real login states for bypass
  const [, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [view, setView] = useState('login'); // fallback view if bypass disabled
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Temporary login bypass: auto-login with dummy user and token
  useEffect(() => {
    const dummyToken = 'bypass-dummy-jwt-token';
    const dummyUser = {
      id: 1,
      name: 'Bypass User',
      email: 'bypass@example.com',
      is_admin: true
    };

    setToken(dummyToken);
    setUser(dummyUser);
    setUserData(dummyUser);
    setView('dashboard');
  }, []);

  const handleLogout = () => {
    // To logout properly, you may want to disable bypass here if needed
    setToken(null);
    setUser(null);
    setUserData(null);
    setView('login');
  };

  const handleViewChange = (newView) => {
    setView(newView);
    setError('');
    setSuccess('');
  };

  const renderDashboard = () => (
    <UserDashboard 
      token={token} 
      userData={userData} 
      onLogout={handleLogout} 
      onViewChange={handleViewChange} 
    />
  );

  const renderInvestmentPlans = () => (
    <InvestmentPlans 
      token={token} 
      userData={userData} 
      onPlanPurchase={() => {}}
      onBack={() => handleViewChange('dashboard')}
    />
  );

  const renderWithdrawalForm = () => (
    <WithdrawalForm 
      token={token} 
      userData={userData} 
      onWithdrawalRequest={() => {}}
      onBack={() => handleViewChange('dashboard')}
    />
  );

  const renderRechargeForm = () => (
    <RechargeForm 
      token={token} 
      userData={userData} 
      onRechargeRequest={() => {}}
      onBack={() => handleViewChange('dashboard')}
    />
  );

  const renderReferral = () => (
    <Referral 
      token={token} 
      userData={userData} 
      onBack={() => handleViewChange('dashboard')}
    />
  );

  const renderAdminPanel = () => (
    <AdminPanel 
      token={token} 
      onLogout={handleLogout}
    />
  );

  return (
    <div className="App">
      {token ? (
        <>
          {view === 'dashboard' && renderDashboard()}
          {view === 'plans' && renderInvestmentPlans()}
          {view === 'withdraw' && renderWithdrawalForm()}
          {view === 'recharge' && renderRechargeForm()}
          {view === 'referral' && renderReferral()}
          {view === 'admin' && renderAdminPanel()}
        </>
      ) : (
        // If bypass logout is triggered, show login/register views
        <div>
          <h2>Login Bypass Disabled - Please login normally</h2>
        </div>
      )}
    </div>
  );
}

export default App;
