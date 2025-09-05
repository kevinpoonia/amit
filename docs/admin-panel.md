# Admin Panel for Investment Platform

## Overview
This admin panel provides administrative capabilities for managing the investment platform, including:
- Approving/rejecting recharge requests
- Approving/rejecting withdrawal requests
- Searching and managing users
- Adjusting user balances

## Accessing the Admin Panel
To access the admin panel:
1. Log in with an admin account
2. Once logged in, you'll see an "Admin" button in the Quick Actions section of the dashboard
3. Click the "Admin" button to navigate to the admin panel

## Creating an Admin User
To create an admin user, you need to update the database directly:

1. Connect to your Supabase database
2. Run the following SQL command to create an admin user:

```sql
INSERT INTO users (name, email, password, mobile, balance, is_admin, created_at)
VALUES ('Admin User', 'admin@investpro.com', 'Admin123!', '9999999999', 0, true, NOW())
ON CONFLICT (email) DO UPDATE SET is_admin = true;
```

3. Alternatively, to make an existing user an admin:

```sql
UPDATE users SET is_admin = true WHERE email = 'admin@investpro.com';
```

## Admin Login Credentials
After creating the admin user, you can log in with:
- Email: admin@investpro.com
- Password: Admin123!

## Admin Panel Features

### Pending Requests Tab
- View all pending recharge requests
- View all pending withdrawal requests
- Approve or reject requests with a single click

### User Management Tab
- Search users by name, email, or mobile number
- Select a user to view their details
- Adjust user balances with reason tracking

## Security
- Only users with `is_admin = true` can access the admin panel
- All admin actions are protected by authentication middleware
- Balance adjustments are logged in the `balance_adjustments` table

## API Endpoints
The admin panel uses the following API endpoints:

- `GET /api/admin/recharges/pending` - Get pending recharges
- `GET /api/admin/withdrawals/pending` - Get pending withdrawals
- `POST /api/admin/recharge/:id/approve` - Approve a recharge
- `POST /api/admin/recharge/:id/reject` - Reject a recharge
- `POST /api/admin/withdrawal/:id/approve` - Approve a withdrawal
- `POST /api/admin/withdrawal/:id/reject` - Reject a withdrawal
- `GET /api/admin/users/search?query=:query` - Search users
- `POST /api/admin/user/balance-adjust` - Adjust user balance