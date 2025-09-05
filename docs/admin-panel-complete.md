# Admin Panel Documentation

## Overview
The admin panel is a comprehensive management interface for the investment platform that allows administrators to manage recharges, withdrawals, and users. It provides a clean, responsive interface with all necessary functionality for platform administration.

## Features

### 1. Pending Requests Management
- View all pending recharge requests
- View all pending withdrawal requests
- Approve or reject requests with a single click
- See detailed information about each request including user details

### 2. User Management
- Search users by name, email, or mobile number
- View detailed user information
- Adjust user balances with reason tracking
- See user's current balance and admin status

## Accessing the Admin Panel

### Admin Login Credentials
- Email: admin@investpro.com
- Password: Admin123!

### Steps to Access
1. Log in with the admin account credentials
2. Once logged in, you'll see an "Admin" button in the Quick Actions section of the dashboard
3. Click the "Admin" button to navigate to the admin panel

## Database Schema

The admin panel relies on the following database tables:

### users
```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  mobile VARCHAR(20),
  balance DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE
);
```

### recharges
```sql
CREATE TABLE IF NOT EXISTS recharges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  utr VARCHAR(255) NOT NULL,
  request_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  processed_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### withdrawals
```sql
CREATE TABLE IF NOT EXISTS withdrawals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  gst_amount DECIMAL(10, 2) NOT NULL,
  net_amount DECIMAL(10, 2) NOT NULL,
  method VARCHAR(50) NOT NULL, -- 'bank' or 'upi'
  details TEXT NOT NULL,
  request_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  processed_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### balance_adjustments
```sql
CREATE TABLE IF NOT EXISTS balance_adjustments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  admin_id INTEGER REFERENCES users(id),
  adjustment_date TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Admin Authentication
- `GET /api/admin/recharges/pending` - Get pending recharges
- `GET /api/admin/withdrawals/pending` - Get pending withdrawals

### Recharge Management
- `POST /api/admin/recharge/:id/approve` - Approve a recharge
- `POST /api/admin/recharge/:id/reject` - Reject a recharge

### Withdrawal Management
- `POST /api/admin/withdrawal/:id/approve` - Approve a withdrawal
- `POST /api/admin/withdrawal/:id/reject` - Reject a withdrawal

### User Management
- `GET /api/admin/users/search?query=:query` - Search users
- `GET /api/admin/user/:id` - Get user details
- `POST /api/admin/user/balance-adjust` - Adjust user balance

## Admin Panel Components

### Frontend Files
1. `AdminPanelComplete.js` - Main admin panel component
2. `AdminPanelComplete.css` - Styling for the admin panel

### Backend Files
1. `admin-routes.js` - All admin API endpoints
2. Admin middleware for authentication verification

## Security Features

1. **Admin-only Access**: All admin endpoints are protected by middleware that verifies the user has admin privileges
2. **JWT Authentication**: Admin actions require a valid JWT token
3. **Balance Adjustment Tracking**: All balance adjustments are logged with reason and admin ID
4. **Transaction Rollbacks**: Failed operations are rolled back to maintain data consistency

## Usage Guidelines

### Managing Recharges
1. Navigate to the "Pending Requests" tab
2. Review pending recharge requests in the left column
3. Click "Approve" to confirm a recharge and add funds to the user's account
4. Click "Reject" to deny a recharge without adding funds

### Managing Withdrawals
1. Navigate to the "Pending Requests" tab
2. Review pending withdrawal requests in the right column
3. Click "Approve" to confirm a withdrawal and process the payment
4. Click "Reject" to deny a withdrawal and refund the amount to the user's account

### Managing Users
1. Use the search bar to find users by name, email, or mobile
2. Click on a user in the search results to view their details
3. Use the balance adjustment form to add or remove funds from a user's account
4. Always provide a reason for balance adjustments as they are logged for auditing

## Error Handling

The admin panel includes comprehensive error handling:
- Clear error messages for failed operations
- Success confirmations for completed actions
- Loading states during API requests
- Input validation for all forms

## Responsive Design

The admin panel is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

On smaller screens, the two-column layout adjusts to a single column for better usability.

## Troubleshooting

### Common Issues
1. **Unable to access admin panel**: Verify you're logged in with the admin account
2. **API errors**: Check that the backend server is running and database connections are working
3. **Permission errors**: Ensure the user has the `is_admin` flag set to `true`

### Database Issues
If you encounter database errors:
1. Verify all required tables exist
2. Check that the admin user has been created with `is_admin = true`
3. Ensure the database connection credentials are correct in the environment variables