import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './AdminPanelComplete.css';

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

function AdminPanel({ token, onLogout }) {
  const [pendingRecharges, setPendingRecharges] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null); // State for selected product to edit
  const [balanceAdjustment, setBalanceAdjustment] = useState({
    amount: '',
    reason: ''
  });
   const [productForm, setProductForm] = useState({ // State for product form
    name: '',
    description: '',
    price: '',
    image: null
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('admin'); // 'admin' or 'admin-users', or 'products'

  const fetchPendingRecharges = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/recharges/pending`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPendingRecharges(response.data.recharges);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch pending recharges');
    }
  }, [token]);

  const fetchPendingWithdrawals = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/withdrawals/pending`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPendingWithdrawals(response.data.withdrawals);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch pending withdrawals');
    }
  }, [token]);

  const fetchUsers = useCallback(async (query) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/users/search?query=${query}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response.data.users);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    }
  }, [token]);

   // New function to fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProducts(response.data.products);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch products');
    }
  }, [token]);

  

   useEffect(() => {
    if (view === 'admin') {
      fetchPendingRecharges();
      fetchPendingWithdrawals();
    } else if (view === 'products') {
      fetchProducts();
    }
  }, [view, fetchPendingRecharges, fetchPendingWithdrawals, fetchProducts]);

  useEffect(() => {
    if (searchTerm.length > 2) {
      fetchUsers(searchTerm);
    } else {
      setUsers([]);
    }
  }, [searchTerm, fetchUsers]);

  const handleApproveRecharge = async (rechargeId) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`${API_BASE_URL}/api/admin/recharge/${rechargeId}/approve`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSuccess('Recharge approved successfully');
      fetchPendingRecharges();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve recharge');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRecharge = async (rechargeId) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`${API_BASE_URL}/api/admin/recharge/${rechargeId}/reject`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSuccess('Recharge rejected successfully');
      fetchPendingRecharges();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject recharge');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`${API_BASE_URL}/api/admin/withdrawal/${withdrawalId}/approve`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSuccess('Withdrawal approved successfully');
      fetchPendingWithdrawals();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`${API_BASE_URL}/api/admin/withdrawal/${withdrawalId}/reject`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSuccess('Withdrawal rejected successfully');
      fetchPendingWithdrawals();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSelectedUser(response.data.user);
      setView('admin-users');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch user details');
    }
  };

  const handleBalanceAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await axios.post(`${API_BASE_URL}/api/admin/user/balance-adjust`, {
        user_id: selectedUser.id,
        amount: parseFloat(balanceAdjustment.amount),
        reason: balanceAdjustment.reason
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

       // New handler for product form submission (create and update)
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('name', productForm.name);
    formData.append('description', productForm.description);
    formData.append('price', productForm.price);
    if (productForm.image) {
      formData.append('image', productForm.image);
    }

    try {
      if (selectedProduct) {
        // Update existing product
        await axios.put(`${API_BASE_URL}/api/products/${selectedProduct.id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccess('Product updated successfully');
      } else {
        // Create new product
        await axios.post(`${API_BASE_URL}/api/products`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccess('Product created successfully');
      }
      fetchProducts();
      setProductForm({ name: '', description: '', price: '', image: null });
      setSelectedProduct(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

       // New handler to select a product for editing
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      image: null
    });
  };

  // New handler to delete a product
  const handleDeleteProduct = async (productId) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.delete(`${API_BASE_URL}/api/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSuccess('Product deleted successfully');
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete product');
    } finally {
      setLoading(false);
    }
  };


      
      setSuccess('Balance adjusted successfully');
      setBalanceAdjustment({ amount: '', reason: '' });
      
      // Refresh user details
      const response = await axios.get(`${API_BASE_URL}/api/admin/user/${selectedUser.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSelectedUser(response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to adjust balance');
    } finally {
      setLoading(false);
    }
  };

  // New function for manual daily plan recycling
  const handleDailyRecycle = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/daily-recycle`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSuccess(`Daily recycling completed: ${response.data.processedInvestments} investments processed, ${formatCurrency(response.data.totalAmountDistributed)} distributed`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to perform daily recycling');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
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

  // Calculate platform statistics
  const calculateStats = () => {
    const totalUsers = users.length;
    const totalRecharges = pendingRecharges.reduce((sum, recharge) => sum + recharge.amount, 0);
    const totalWithdrawals = pendingWithdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
    const pendingRequests = pendingRecharges.length + pendingWithdrawals.length;
    
    return {
      totalUsers,
      totalRecharges,
      totalWithdrawals,
      pendingRequests
    };
  };

  const stats = calculateStats();

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-actions">
          <button 
            className={view === 'admin' ? 'active' : ''}
            onClick={() => setView('admin')}
          >
            Requests
          </button>
          <button 
            className={view === 'admin-users' && selectedUser ? 'active' : ''}
            onClick={() => setView('admin-users')}
            disabled={!selectedUser}
          >
            {selectedUser ? selectedUser.name : 'Users'}
          </button>

               {/* New Products Button */}
          <button
            className={view === 'products' ? 'active' : ''}
            onClick={() => setView('products')}
          >
            Products
          </button>
              
          <button onClick={onLogout}>Logout</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {view === 'admin' && (
        <>
          {/* Daily Recycling Button */}
          <div className="daily-recycle-section">
            <h2>Daily Plan Recycling</h2>
            <button 
              className="recycle-btn"
              onClick={handleDailyRecycle}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Run Daily Plan Recycling'}
            </button>
            <p className="recycle-info">
              This will distribute daily income from all active investment plans to users' wallets.
            </p>
          </div>

          {/* Platform Statistics */}
          <div className="stats-card">
            <h2>Platform Statistics</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Total Users</div>
                <div className="stat-value">{stats.totalUsers}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Pending Requests</div>
                <div className="stat-value">{stats.pendingRequests}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total Recharges</div>
                <div className="stat-value">{formatCurrency(stats.totalRecharges)}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {view === 'admin' && (
        <div className="admin-requests">
          {/* Daily Recycling Button */}
          <div className="daily-recycle-section">
            <h2>Daily Plan Recycling</h2>
            <button 
              className="recycle-btn"
              onClick={handleDailyRecycle}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Run Daily Plan Recycling'}
            </button>
            <p className="recycle-info">
              This will distribute daily income from all active investment plans to users' wallets.
            </p>
          </div>

          <div className="requests-grid">
            {/* Pending Recharges */}
            <div className="requests-section">
              <h2>Pending Recharges ({pendingRecharges.length})</h2>
              {pendingRecharges.length > 0 ? (
                <div className="requests-list">
                  {pendingRecharges.map(recharge => (
                    <div key={recharge.id} className="request-card">
                      <div className="request-header">
                        <span className="request-id">#{recharge.id}</span>
                        <span className="request-date">{formatDate(recharge.request_date)}</span>
                      </div>
                      <div className="request-details">
                        <p><strong>User:</strong> {recharge.user_name} ({recharge.user_email})</p>
                        <p><strong>Amount:</strong> {formatCurrency(recharge.amount)}</p>
                        <p><strong>UTR:</strong> {recharge.utr}</p>
                      </div>
                      <div className="request-actions">
                        <button 
                          className="approve-btn"
                          onClick={() => handleApproveRecharge(recharge.id)}
                          disabled={loading}
                        >
                          Approve
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => handleRejectRecharge(recharge.id)}
                          disabled={loading}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-requests">No pending recharges</p>
              )}
            </div>

            {/* Pending Withdrawals */}
            <div className="requests-section">
              <h2>Pending Withdrawals ({pendingWithdrawals.length})</h2>
              {pendingWithdrawals.length > 0 ? (
                <div className="requests-list">
                  {pendingWithdrawals.map(withdrawal => (
                    <div key={withdrawal.id} className="request-card">
                      <div className="request-header">
                        <span className="request-id">#{withdrawal.id}</span>
                        <span className="request-date">{formatDate(withdrawal.request_date)}</span>
                      </div>
                      <div className="request-details">
                        <p><strong>User:</strong> {withdrawal.user_name} ({withdrawal.user_email})</p>
                        <p><strong>Amount:</strong> {formatCurrency(withdrawal.amount)}</p>
                        <p><strong>Net Amount:</strong> {formatCurrency(withdrawal.net_amount)}</p>
                        <p><strong>GST:</strong> {formatCurrency(withdrawal.gst_amount)}</p>
                        <p><strong>Method:</strong> {withdrawal.method.toUpperCase()}</p>
                        <p><strong>Details:</strong> {withdrawal.details}</p>
                      </div>
                      <div className="request-actions">
                        <button 
                          className="approve-btn"
                          onClick={() => handleApproveWithdrawal(withdrawal.id)}
                          disabled={loading}
                        >
                          Approve
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => handleRejectWithdrawal(withdrawal.id)}
                          disabled={loading}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-requests">No pending withdrawals</p>
              )}
            </div>
          </div>

          {/* User Search */}
          <div className="user-search-section">
            <h2>User Management</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search users by name, email, or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {users.length > 0 && (
                <div className="search-results">
                  {users.map(user => (
                    <div 
                      key={user.id} 
                      className="user-result"
                      onClick={() => handleUserSelect(user.id)}
                    >
                      <p><strong>{user.name}</strong></p>
                      <p>{user.email}</p>
                      <p>{user.mobile}</p>
                      <p>Balance: {formatCurrency(user.balance)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'admin-users' && selectedUser && (
        <div className="user-management">
          <button className="back-btn" onClick={() => setView('admin')}>
            ← Back to Requests
          </button>
          
          <div className="user-details">
            <h2>User Details</h2>
            <div className="user-info">
              <p><strong>Name:</strong> {selectedUser.name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Mobile:</strong> {selectedUser.mobile || 'N/A'}</p>
              <p><strong>Balance:</strong> {formatCurrency(selectedUser.balance)}</p>
              <p><strong>Admin:</strong> {selectedUser.is_admin ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div className="balance-adjustment">
            <h2>Adjust User Balance</h2>
            <form onSubmit={handleBalanceAdjustment}>
              <div className="form-group">
                <label>Amount:</label>
                <input
                  type="number"
                  step="0.01"
                  value={balanceAdjustment.amount}
                  onChange={(e) => setBalanceAdjustment({
                    ...balanceAdjustment,
                    amount: e.target.value
                  })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Reason:</label>
                <textarea
                  value={balanceAdjustment.reason}
                  onChange={(e) => setBalanceAdjustment({
                    ...balanceAdjustment,
                    reason: e.target.value
                  })}
                  required
                  className="form-textarea"
                  placeholder="Enter reason for balance adjustment"
                />
              </div>
              <button 
                type="submit" 
                className="adjust-btn"
                disabled={loading}
              >
                {loading ? 'Adjusting...' : 'Adjust Balance'}
              </button>
            </form>
          </div>
        {/* New view for Product Management */}
      {view === 'products' && (
        <div className="product-management">
          <h2>Product Management</h2>

          {/* Form for adding/editing a product */}
          <div className="product-form-container">
            <h3>{selectedProduct ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleProductSubmit}>
              <div className="form-group">
                <label>Product Name:</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Price:</label>
                <input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Product Image:</label>
                <input
                  type="file"
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.files[0] })}
                />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (selectedProduct ? 'Update Product' : 'Add Product')}
              </button>
              {selectedProduct && (
                <button type="button" onClick={() => {
                  setSelectedProduct(null);
                  setProductForm({ name: '', description: '', price: '', image: null });
                }}>
                  Cancel Edit
                </button>
              )}
            </form>
          </div>

          {/* List of existing products */}
          <div className="product-list-container">
            <h3>Existing Products</h3>
            <div className="product-list">
              {products.map(product => (
                <div key={product.id} className="product-card">
                  <img src={product.imageUrl} alt={product.name} className="product-image" />
                  <div className="product-details">
                    <h4>{product.name}</h4>
                    <p>{product.description}</p>
                    <p>Price: {formatCurrency(product.price)}</p>
                  </div>
                  <div className="product-actions">
                    <button onClick={() => handleEditProduct(product)}>Edit</button>
                    <button onClick={() => handleDeleteProduct(product.id)} disabled={loading}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default AdminPanel;
