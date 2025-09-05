# Finance System Implementation

## Overview
This document describes the implementation of the new finance system for the investment platform, which includes:
1. Two wallet types for users
2. Multi-level commission system
3. Updated product profit rules
4. New withdrawal rules

## Wallet Types

### 1. Product Revenue Wallet
- Stores daily profits from product investments
- NOT withdrawable
- Funds are locked until product cycle completes

### 2. Withdrawable Wallet
- Stores funds that can be withdrawn by users
- Receives commissions from referrals
- Receives funds when product cycles complete

## Commission Levels

When a user buys a product, their upline (referrer) receives commission:
- Level 1 (direct referrer): 30% of daily product profit
- Level 2: 2% of daily product profit
- Level 3: 1% of daily product profit

Commissions are added to the upline's withdrawable wallet immediately.

## Product Profit Rules

Each product has:
- Price (investment amount)
- Daily profit percentage
- Cycle duration (in days)

When a user buys a product:
1. Investment amount is deducted from their withdrawable wallet
2. Daily profits are added to their product revenue wallet
3. Referral commissions are distributed to uplines' withdrawable wallets
4. When cycle completes, total invested amount + total profit moves to withdrawable wallet

## Flow of Money

### Day 0 (Buy Product)
1. User invests money to buy product
2. Investment amount is locked (not withdrawable)

### Daily Profit (Day 1 to N)
1. Daily profit % is credited to user's Product Revenue Wallet
2. Commission (30%, 2%, 1%) is credited to uplines' Withdrawable Wallets

### End of Cycle (Day N complete)
1. Total invested amount + total product profit moves from Product Revenue Wallet to Withdrawable Wallet
2. Product expires or needs reinvestment

## Example Calculation

For a product with:
- Price: ₹1000
- Daily Profit: 5%
- Cycle: 20 Days

### User's Calculation:
- Daily Profit: ₹1000 × 5% = ₹50
- For 20 Days: ₹1000 (capital) + ₹1000 profit = ₹2000
- After 20 days: ₹2000 moves to withdrawable wallet

### Referrer Commission:
- Level 1 upline gets 30% of ₹50 = ₹15 daily
- Level 2 upline gets 2% of ₹50 = ₹1 daily
- Level 3 upline gets 1% of ₹50 = ₹0.50 daily

## Withdrawal Rules

- Users can only withdraw from Withdrawable Wallet
- No withdrawal allowed from Product Revenue Wallet
- Minimum withdrawal amount is determined by admin (e.g., ₹200)
- Withdrawal methods: Bank / UPI

## Admin Panel Controls

From admin panel, administrators can:
- Add/Edit/Delete Products (price, % profit, cycle days)
- Manage commissions (change % anytime)
- View users & their team levels
- View product revenue & withdrawable wallet balances
- Approve / reject withdrawals
- Manage announcements & banners

## Database Changes

### Users Table
- Added `product_revenue_wallet` column (DECIMAL)
- Added `withdrawable_wallet` column (DECIMAL)
- Removed `balance` column
- Removed `recharge_balance` column

### New Database Functions
- `increment_user_product_revenue_wallet(user_id, amount)`
- `increment_user_withdrawable_wallet(user_id, amount)`
- `decrement_user_withdrawable_wallet(user_id, amount)`

## API Endpoints Updated

### User Endpoints
- `/api/data` - Returns both wallet balances
- `/api/financial-summary` - Shows detailed financial information
- `/api/investments` - Enhanced with profit calculations
- `/api/purchase-plan` - Deducts from withdrawable wallet
- `/api/withdraw` - Checks withdrawable wallet balance

### Admin Endpoints
- `/api/admin/daily-recycle` - Implements new commission system
- `/api/admin/recharge/:id/approve` - Adds to withdrawable wallet
- `/api/admin/withdrawal/:id/approve` - Deducts from withdrawable wallet
- `/api/admin/user/balance-adjust` - Works with withdrawable wallet

## Implementation Notes

1. All monetary values are stored as DECIMAL(10, 2) for precision
2. Commission percentages are hardcoded but can be made configurable
3. Daily recycling must be triggered manually by admin
4. Wallet updates use database functions for consistency
5. All financial operations are logged for audit purposes