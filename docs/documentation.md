# Investment Platform Documentation

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [API Documentation](#api-documentation)
5. [Database Schema](#database-schema)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

## Overview

The Investment Platform is a full-stack web application that allows users to register, invest in various plans, earn daily income, and withdraw their earnings. The platform includes both user-facing features and administrative capabilities.

## Features

### User Authentication
- Simple registration with name, email, mobile, and password
- Secure login with JWT token authentication
- Persistent sessions with token expiration

### Product Plans
- Multiple investment plans with different pricing tiers
- Daily income generation based on plan selection
- One plan per month limitation

### Daily Income
- Automatic daily income crediting to user wallets
- Prevention of duplicate income credits

### Withdrawals
- Easy withdrawal requests with bank or UPI options
- 24-hour withdrawal cooldown period
- Automatic 5% GST deduction

### Recharges
- UPI payment integration with QR code scanning
- UPI ID copying functionality
- Payment UTR submission for admin approval

### Sharing System
- Referral link generation for user acquisition
- Easy copying of referral links

### User Dashboard
- Clean overview of wallet balance and investments
- Real-time status tracking for active plans
- Transaction history display

### Marketing Features
- Fake withdrawal popups for trust building
- Dynamic marketing statistics
- Anniversary achievement badges

### Admin Panel
- Recharge and withdrawal approval system
- User balance adjustments
- Transaction management

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│  (Supabase)     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       │                       │                       │
       ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Netlify       │    │    Render       │    │   PostgreSQL    │
│  (Hosting)      │    │   (Hosting)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Frontend (React)
- Single-page application with responsive design
- Client-side routing for different views
- JWT token management for authenticated requests
- State management using React hooks

### Backend (Node.js + Express)
- RESTful API with JWT authentication
- Supabase integration for database operations
- Business logic for investment plans, withdrawals, and recharges
- Error handling and validation

### Database (Supabase/PostgreSQL)
- Relational database schema for users, plans, investments, etc.
- Indexes for performance optimization
- Stored procedures for complex operations

## API Documentation

### Authentication Endpoints

#### POST /api/register
Register a new user.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "mobile": "string"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "JWT token",
  "user": {
    "id": "integer",
    "name": "string",
    "email": "string"
  }
}
```

#### POST /api/login
Authenticate an existing user.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "JWT token",
  "user": {
    "id": "integer",
    "name": "string",
    "email": "string"
  }
}
```

#### GET /api/data
Get authenticated user data.

**Headers:**
```
Authorization: Bearer <JWT token>
```

**Response:**
```json
{
  "message": "Data fetched successfully",
  "user": {
    "id": "integer",
    "name": "string",
    "email": "string",
    "balance": "decimal"
  }
}
```

### Product Plan Endpoints

#### GET /api/product-plans
Get available investment plans.

**Headers:**
```
Authorization: Bearer <JWT token>
```

**Response:**
```json
{
  "message": "Product plans fetched successfully",
  "plans": [
    {
      "id": "integer",
      "name": "string",
      "price": "decimal",
      "dailyIncome": "decimal",
      "totalReturn": "decimal",
      "durationDays": "integer"
    }
  ]
}
```

#### POST /api/purchase-plan
Purchase an investment plan.

**Headers:**
```
Authorization: Bearer <JWT token>
```

**Request Body:**
```json
{
  "planId": "integer"
}
```

**Response:**
```json
{
  "message": "Plan purchased successfully",
  "newBalance": "decimal"
}
```

### Investment Endpoints

#### GET /api/investments
Get user's investments.

**Headers:**
```
Authorization: Bearer <JWT token>
```

**Response:**
```json
{
  "message": "Investments fetched successfully",
  "investments": [
    {
      "id": "integer",
      "user_id": "integer",
      "plan_id": "integer",
      "plan_name": "string",
      "amount": "decimal",
      "purchase_date": "timestamp",
      "status": "string"
    }
  ]
}
```

### Withdrawal Endpoints

#### POST /api/withdraw
Request a withdrawal.

**Headers:**
```
Authorization: Bearer <JWT token>
```

**Request Body:**
```json
{
  "amount": "decimal",
  "method": "string", // 'bank' or 'upi'
  "details": "string"
}
```

**Response:**
```json
{
  "message": "Withdrawal request submitted successfully",
  "newBalance": "decimal"
}
```

#### GET /api/withdrawals
Get user's withdrawals.

**Headers:**
```
Authorization: Bearer <JWT token>
```

**Response:**
```json
{
  "message": "Withdrawals fetched successfully",
  "withdrawals": [
    {
      "id": "integer",
      "user_id": "integer",
      "amount": "decimal",
      "gst_amount": "decimal",
      "net_amount": "decimal",
      "method": "string",
      "details": "string",
      "request_date": "timestamp",
      "status": "string"
    }
  ]
}
```

### Recharge Endpoints

#### POST /api/recharge
Request a recharge.

**Headers:**
```
Authorization: Bearer <JWT token>
```

**Request Body:**
```json
{
  "amount": "decimal",
  "utr": "string"
}
```

**Response:**
```json
{
  "message": "Recharge request submitted successfully. Waiting for admin approval."
}
```

#### GET /api/recharges
Get user's recharges.

**Headers:**
```
Authorization: Bearer <JWT token>
```

**Response:**
```json
{
  "message": "Recharges fetched successfully",
  "recharges": [
    {
      "id": "integer",
      "user_id": "integer",
      "amount": "decimal",
      "utr": "string",
      "request_date": "timestamp",
      "status": "string"
    }
  ]
}
```

### Marketing Endpoints

#### GET /api/marketing-stats
Get marketing statistics.

**Response:**
```json
{
  "message": "Marketing stats fetched successfully",
  "stats": {
    "totalUsers": "integer",
    "dailyActiveUsers": "integer",
    "totalWithdrawn": "integer",
    "successRate": "float",
    "averageRating": "float",
    "totalReviews": "integer"
  },
  "reviews": [
    {
      "id": "integer",
      "name": "string",
      "rating": "integer",
      "comment": "string",
      "date": "string"
    }
  ]
}
```

#### GET /api/fake-withdrawal
Generate a fake withdrawal for popup.

**Response:**
```json
{
  "message": "Fake withdrawal generated",
  "withdrawal": {
    "name": "string",
    "amount": "integer",
    "timestamp": "string"
  }
}
```

#### GET /api/upi-id
Get UPI ID for payments.

**Response:**
```json
{
  "message": "UPI ID fetched successfully",
  "upiId": "string"
}
```

#### GET /api/referral-link
Generate referral link.

**Headers:**
```
Authorization: Bearer <JWT token>
```

**Response:**
```json
{
  "message": "Referral link generated successfully",
  "referralLink": "string"
}
```

### Health Check Endpoint

#### GET /api/health
Check backend health.

**Response:**
```json
{
  "status": "OK",
  "message": "Backend server is running"
}
```

## Database Schema

### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  mobile VARCHAR(20),
  balance DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### product_plans
```sql
CREATE TABLE product_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  daily_income DECIMAL(10, 2) NOT NULL,
  total_return DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### investments
```sql
CREATE TABLE investments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  plan_id INTEGER,
  plan_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  purchase_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### withdrawals
```sql
CREATE TABLE withdrawals (
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

### recharges
```sql
CREATE TABLE recharges (
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

### balance_adjustments
```sql
CREATE TABLE balance_adjustments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  admin_id INTEGER REFERENCES users(id),
  adjustment_date TIMESTAMP DEFAULT NOW()
);
```

## Deployment

### Prerequisites
1. Node.js and npm installed
2. Supabase account and project
3. Netlify account
4. Render account

### Frontend Deployment (Netlify)
1. Connect your GitHub repository to Netlify
2. Set build command: `cd frontend && npm run build`
3. Set publish directory: `frontend/build`
4. Add environment variables:
   - `REACT_APP_API_URL=https://your-render-backend-url.onrender.com`

### Backend Deployment (Render)
1. Connect your GitHub repository to Render
2. Set environment variables:
   - `SUPABASE_URL=your_supabase_url`
   - `SUPABASE_API_KEY=your_supabase_api_key`
   - `JWT_SECRET=your_jwt_secret_key`
   - `PORT=5000`
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`

### Database Setup (Supabase)
1. Create a new Supabase project
2. Run the SQL schema from `database/investment-platform-schema.sql`
3. Configure environment variables with your Supabase credentials

## Troubleshooting

### Common Issues

#### 1. "Access token required" error
- Make sure you're including the JWT token in the Authorization header
- Check that the token hasn't expired (tokens expire after 24 hours)

#### 2. "Invalid or expired token" error
- Log in again to get a new token
- Check that the JWT_SECRET is consistent between frontend and backend

#### 3. "Database error" messages
- Verify that your Supabase credentials are correct
- Check that the database tables have been created
- Ensure that your Supabase project is not paused

#### 4. Frontend not loading
- Check the browser console for JavaScript errors
- Verify that the API endpoints are accessible
- Ensure that the Netlify redirects are configured correctly

#### 5. Backend not responding
- Check the Render logs for error messages
- Verify that the PORT environment variable is set correctly
- Ensure that the backend is listening on 0.0.0.0

### Debugging Tips

1. Use browser developer tools to inspect network requests
2. Check the backend logs on Render for error messages
3. Test API endpoints directly with tools like Postman or curl
4. Verify environment variables are set correctly
5. Ensure database connections are working properly

### Contact Support
For additional help, please contact the development team at support@investment-platform.com.