# Full-Stack Investment Platform

A complete investment platform with user authentication, product plans, daily income, withdrawals, and recharges.

## Features Implemented

### ✅ 1. User Authentication:
- Simple Registration & Login: Users can easily register and log in with minimal details
- Secure Login: Passwords are handled securely with JWT tokens for persistent login
- No complex steps: Just create an account once, and return users can simply log in

### ✅ 2. Product Plans:
- Clear Product List: Users can easily view product plans with clear pricing
- Simple Purchase Process: Click to buy, and it gets activated in the dashboard
- One Plan Per Month Rule: Handled in the backend to ensure compliance

### ✅ 3. Daily Income:
- Automatic Credits: Users don't need to do anything—daily income is automatically added to their wallet
- No Duplicates: Each day's income is added once, with no risk of duplicate credits

### ✅ 4. Withdrawals:
- Easy Withdrawal Process: Users can request withdrawals with a simple form
- Simple Rules: Only one withdrawal every 24 hours
- Instant Status: Users are notified when their withdrawal is approved or rejected

### ✅ 5. Recharges:
- Simple Recharge Flow: Users can recharge their wallet with just a UPI payment
- UPI ID Copying: One-click copy of the entire UPI ID
- Admin Approval: Recharges require admin approval for security

### ✅ 6. Referral System:
- Refer & Earn: Users can invite friends and earn rewards
- Active Referral Tracking: See who you've referred and which are active
- Leader Box: Daily winners display with prizes from 1-5 lakh rupees

## Referral System Details

The referral system allows users to invite friends and earn rewards:

1. **Referral Rewards**:
   - Users earn ₹100 for each active referral (one-time payment per referred user)
   - Referred friends receive ₹50 as a welcome bonus
   - Active referral means the referred user has made at least one investment

2. **Tracking Features**:
   - View all users you've referred
   - See which referrals are active (have made investments)
   - Detailed list of referral activity

3. **Leader Box**:
   - Daily display of top 10 winners with prizes from 1-5 lakh rupees
   - Winners are randomly generated each day for demonstration purposes
   - Provides motivation and engagement for users

## API Endpoints

### Referral Endpoints:
- `GET /api/referral-link` - Get user's referral link
- `GET /api/referral-details` - Get detailed referral information
- `GET /api/leader-box-winners` - Get daily leader box winners

### ✅ 6. Sharing System:
- Easy Sharing Button: Users can simply click to copy a referral link to share with others

### ✅ 7. User Dashboard:
- Clean Overview: A simple dashboard with wallet balance and user information
- Status Tracking: Users can track their active product plans and transactions

### ✅ 8. Marketing Features:
- Fake Withdrawal Popups: For trust building with random names and amounts
- Dynamic Marketing Stats: Real-time appearing statistics
- Anniversary Achievement Badge: Celebrating platform milestones

### ✅ 9. Admin Panel:
- Minimal Admin Actions: Admin can approve recharges and withdrawals
- Efficient Management: All user transactions are easily viewable

### ✅ 10. Mobile-First Premium UI:
- Responsive Design: Works on smartphones, tablets, and desktops
- Premium Look: Clean, minimalistic, and modern UI
- Simple Navigation: Everything is intuitive and easy to find

## Technology Stack

- **Frontend**: React.js (Hosted on Netlify)
- **Backend**: Node.js + Express.js (Hosted on Render)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (JSON Web Tokens)

## Deployment Status

- **Frontend**: https://investment-pro-official.netlify.app
- **Backend**: https://my-fullstack-app-backend-2omq.onrender.com

## Database Schema

The application uses the following tables in Supabase:

1. `users` - Stores user information including name, email, password, mobile, and balance
2. `product_plans` - Contains investment plan details
3. `investments` - Tracks user investments in various plans
4. `withdrawals` - Records withdrawal requests with status tracking
5. `recharges` - Records recharge requests with UTR numbers
6. `balance_adjustments` - Logs admin balance adjustments for auditing

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/data` - Get authenticated user data

### Product Plans
- `GET /api/product-plans` - Get available investment plans
- `POST /api/purchase-plan` - Purchase an investment plan

### Transactions
- `POST /api/withdraw` - Request withdrawal
- `GET /api/withdrawals` - Get user withdrawals
- `POST /api/recharge` - Request recharge
- `GET /api/recharges` - Get user recharges

### Investments
- `GET /api/investments` - Get user investments

### Marketing
- `GET /api/marketing-stats` - Get marketing statistics
- `GET /api/fake-withdrawal` - Generate fake withdrawal for popup
- `GET /api/upi-id` - Get UPI ID for payments
- `GET /api/referral-link` - Generate referral link

### Admin
- `GET /api/admin/recharges/pending` - Get pending recharges
- `GET /api/admin/withdrawals/pending` - Get pending withdrawals
- `POST /api/admin/recharge/:id/approve` - Approve recharge
- `POST /api/admin/recharge/:id/reject` - Reject recharge
- `POST /api/admin/withdrawal/:id/approve` - Approve withdrawal
- `POST /api/admin/withdrawal/:id/reject` - Reject withdrawal
- `GET /api/admin/users/search` - Search users
- `POST /api/admin/user/balance-adjust` - Adjust user balance

## Environment Variables

### Backend (.env)
Create a `.env` file in the `backend` directory with the following variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_API_KEY=your_supabase_api_key
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

### Frontend (.env.production)
The frontend uses environment variables for API configuration:

```
REACT_APP_API_URL=https://my-fullstack-app-backend-2omq.onrender.com
```

## Referral System Details

The referral system allows users to invite friends and earn rewards:

1. **Referral Rewards**:
   - Users earn ₹100 for each active referral (one-time payment per referred user)
   - Referred friends receive ₹50 as a welcome bonus
   - Active referral means the referred user has made at least one investment

2. **Tracking Features**:
   - View all users you've referred
   - See which referrals are active (have made investments)
   - Detailed list of referral activity

3. **Leader Box**:
   - Daily display of top 10 winners with prizes from 1-5 lakh rupees
   - Winners are randomly generated each day for demonstration purposes
   - Provides motivation and engagement for users

## API Endpoints

### Referral Endpoints:
- `GET /api/referral-link` - Get user's referral link
- `GET /api/referral-details` - Get detailed referral information
- `GET /api/leader-box-winners` - Get daily leader box winners

## How to Deploy

### 1. Frontend (Netlify)
1. Connect your GitHub repository to Netlify
2. Set build command: `cd frontend && npm run build`
3. Set publish directory: `frontend/build`
4. Add environment variables as needed

### 2. Backend (Render)
1. Connect your GitHub repository to Render
2. Set environment variables from your `.env` file
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`

### 3. Database (Supabase)
1. Create a Supabase project
2. Run the schema from `database/investment-platform-schema.sql`
3. Configure environment variables with your Supabase credentials

## Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/adittaya/my-fullstack-app.git
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```
   cd ../frontend
   npm install
   ```

4. Create `.env` file in the backend directory with your credentials

5. Start backend server:
   ```
   cd backend
   npm start
   ```

6. Start frontend development server:
   ```
   cd frontend
   npm start
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.