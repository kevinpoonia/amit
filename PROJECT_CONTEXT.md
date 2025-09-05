# Investment Platform - Project Context

## Project Overview
We've developed a full-featured investment platform with a React frontend and Node.js/Express backend, using Supabase as the database. The platform includes user authentication, investment plans, wallet management, recharge/withdrawal flows, and referral system.

## Current Features Implemented
1. User Authentication: Registration/login with email or mobile
2. Investment Plans: 10 premium plans (₹490-₹5000) with 1.47x-1.5x returns
3. Wallet System: Balance tracking with deposit/withdrawal history
4. Withdrawal Processing: Bank/UPI options with 18% GST deduction
5. Recharge Handling: UTP verification workflow with admin approval
6. Referral System: Unique referral codes and link generation
7. Daily Income Automation: Automatic daily crediting to active investments
8. Admin Panel: Complete admin interface for managing recharges/withdrawals/users
9. Security: Password validation, one plan per month rule, 24hr withdrawal limit

## Technology Stack
- Frontend: React.js (v19.1.1), CSS3 (Custom Properties, Flexbox, Grid)
- Backend: Node.js, Express.js (v4.21.2)
- Database: Supabase (PostgreSQL)
- Authentication: JWT tokens
- Hosting: Netlify (Frontend), Render (Backend)
- API Communication: Axios
- UI Enhancements: CSS Animations, Transitions, Glassmorphism

## Deployment
- Frontend URL: https://investment-pro-official.netlify.app
- Backend URL: https://my-fullstack-app-backend-2omq.onrender.com
- Database: Supabase PostgreSQL

## File Structure
```
my-fullstack-app/
├── backend/
│   ├── server.js (Node.js + Express backend with 700+ lines)
│   ├── package.json
│ └── ...
├── frontend/
│ ├── src/
│   │ ├── components/
│   │ │   ├── UserDashboard.js (Premium dashboard with wallet, products, transactions)
│   │   │   ├── InvestmentPlans.js (10 animated investment plan cards)
│   │   │   ├── RechargeForm.js (Numeric keypad → QR → UTR flow)
│   │   │   ├── WithdrawalForm.js (Bank/UPI withdrawal with validation)
│   │   │   ├── Referral.js (Referral link sharing)
│   │   │   └── AdminPanel.js (Complete admin panel)
│   │   ├── assets/
│   │ │   ├── qr-code.png (UPI payment QR code)
│   │   │   └── product-listing.jpg (Product listing image)
│   │   ├── App.js (Main app with routing and auth)
│   │   ├── App.css (Premium dark mode theme - 600+ lines)
│   │ └── ...
│   ├── package.json
│   └── ...
├── database/
│   ├── investment-platform-schema.sql (Full database schema with all tables and admin user)
│   ├── add-admin-column-and-user.sql (Script to add admin column and create admin user)
│   └── ...
├── docs/
│ └── admin-panel.md (Documentation for admin panel)
├── scripts/
│   ├── create-admin-user.js (Node.js script to create admin user)
│ └── ...
├── database/investment-platform-schema.sql (Complete database schema with all tables)
├── netlify.toml (Netlify redirects for API proxying)
├── render.yaml (Render deployment config)
└── README.md
```

## Admin Panel Features
The admin panel provides administrative capabilities for managing the investment platform, including:
1. Pending Requests Tab:
   - View all pending recharge requests
   - View all pending withdrawal requests
   - Approve or reject requests with a single click
2. User Management Tab:
   - Search users by name, email, or mobile number
   - Select a user to view their details
   - Adjust user balances with reason tracking

## Admin Access
To access the admin panel:
1. Log in with the admin account
2. Once logged in, you'll see an "Admin" button in the Quick Actions section of the dashboard
3. Click the "Admin" button to navigate to the admin panel

## Admin Login Credentials
- Email: admin@investpro.com
- Password: Admin123!

## Database Schema
The database includes the following tables:
1. users - User accounts with authentication details and balances
2. product_plans - Investment plans with pricing and return information
3. investments - User investments in various plans
4. withdrawals - Withdrawal requests with processing status
5. recharges - Recharge requests with UTR verification
6. balance_adjustments - Admin balance adjustments for users

## API Endpoints
- POST /api/register - User registration
- POST /api/login - User login (email or mobile)
- GET /api/data - Authenticated user data
- GET /api/product-plans - Available investment plans
- POST /api/purchase-plan - Purchase investment plan
- GET /api/investments - User's active investments
- POST /api/withdraw - Request withdrawal
- GET /api/withdrawals - User's withdrawal history
- POST /api/recharge - Request recharge
- GET /api/recharges - User's recharge history
- GET /api/referral-link - Generate referral link
- GET /api/upi-id - Get UPI payment ID

## Admin Endpoints
- GET /api/admin/recharges/pending - Get pending recharges
- GET /api/admin/withdrawals/pending - Get pending withdrawals
- POST /api/admin/recharge/:id/approve - Approve a recharge
- POST /api/admin/recharge/:id/reject - Reject a recharge
- POST /api/admin/withdrawal/:id/approve - Approve a withdrawal
- POST /api/admin/withdrawal/:id/reject - Reject a withdrawal
- GET /api/admin/users/search?query=:query - Search users
- POST /api/admin/user/balance-adjust - Adjust user balance

## UI Components
1. Auth System - Fullscreen minimal UI with gradient background
2. Dashboard - Wallet summary cards with glowing borders
3. Investment Plans - Expandable animated cards with detailed ROI information
4. Recharge Flow - Step-by-step numeric keypad → QR code → UTR entry
5. Withdrawal Form - Method selection (Bank/UPI) with proper validation fields
6. Referral System - Referral link display with copy-to-clipboard functionality
7. Admin Panel - Complete admin interface with tabs for requests and user management

## Mobile Features
- Single-hand optimized interface
- Bottom navigation bar (Home, Products, Wallet, Profile)
- Floating action button for quick recharge
- Toast notifications for fake withdrawals
- Step-by-step workflows
- Responsive grid layouts
- Touch-friendly large buttons

## Investment Plan Details
| Product No. | Product Name     | Price  | Daily Income | Duration | Return | Profit |
|-------------|------------------|--------|--------------|----------|--------|--------|
| 1           | Starter Plan     | ₹490   | ₹80          | 9 days   | ₹720   | ₹230   |
| 2           | Smart Saver      | ₹750   | ₹85          | 14 days  | ₹1190  | ₹440   |
| 3           | Bronze Booster   | ₹1000  | ₹100         | 15 days  | ₹1500  | ₹500   |
| 4           | Silver Growth    | ₹1500  | ₹115         | 20 days  | ₹2300  | ₹800   |
| 5           | Gold Income      | ₹2000  | ₹135         | 23 days  | ₹3105  | ₹1105  |
| 6           | Platinum Plan    | ₹2500  | ₹160         | 24 days  | ₹3840  | ₹1340  |
| 7           | Elite Earning    | ₹3000  | ₹180         | 25 days  | ₹4500  | ₹1500  |
| 8           | VIP Profiter     | ₹3500  | ₹200         | 27 days  | ₹5400  | ₹1900  |
| 9           | Executive Growth | ₹4000  | ₹220         | 28 days  | ₹6160  | ₹2160  |
| 10          | Royal Investor   | ₹5000  | ₹250         | 30 days  | ₹7500  | ₹2500  |

## Business Features
- Daily Income: Automatic crediting to user wallets
- Withdrawal Limits: One per 24 hours with 18% GST
- Recharge Verification: Manual UTR approval workflow
- Investment Rules: One plan per month per user
- Referral System: Share links for user acquisition
- Admin Controls: Balance adjustments and transaction approval
- Marketing Elements: Fake withdrawal popups, trust badges

## Recent Changes
1. Fixed ESLint href errors by converting anchor tags to buttons in bottom navigation
2. Fixed unused variable error in UserDashboard component
3. Implemented complete admin panel with user management and transaction approval features
4. Added is_admin field to users table and created admin user
5. Created comprehensive documentation for admin panel usage
6. Fixed "record 'new' has no field 'updated_at'" error by removing updated_at column from user balance updates
7. Fixed schema cache issue by creating SQL script to refresh Supabase cache

## Database Setup
To set up the database from scratch, run the complete schema file:
database/investment-platform-schema.sql

This will create all tables, indexes, functions, sample data, and the admin user.

## Next Steps
When continuing work on this project, you can:
1. Review the admin panel documentation in docs/admin-panel.md
2. Test the admin functionality using the provided credentials
3. Add new features or improvements as needed
4. Deploy updates to Netlify (frontend) and Render (backend)

## Known Issues
1. The admin panel may still have issues with updating user balances due to Supabase schema cache issues
2. Need to run the refresh_schema_cache.sql script in Supabase to fully resolve the "Could not find the 'updated_at' column of 'users' in the schema cache" error

## Files to Check
1. /storage/emulated/0/tempdat/refresh_schema_cache.sql - SQL script to fix schema cache issues
2. /storage/emulated/0/tempdat/fix_updated_at_error.sql - Alternative SQL script to fix updated_at column issues
3. backend/server.js - Backend code with recent fixes for user balance updates
4. database/investment-platform-schema.sql - Complete database schema with updated_at column
5. database/add-admin-column-and-user.sql - Script to add admin column and create admin user

## Git Repository Status
The latest commit (0201981) includes fixes for the schema cache issue by removing the updated_at column from user balance updates in the backend code.