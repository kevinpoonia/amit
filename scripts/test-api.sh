#!/bin/bash

# API Test Script

echo "Testing Investment Platform API Endpoints..."
echo "=========================================="

BASE_URL="https://my-fullstack-app-backend-2omq.onrender.com"

# Test health endpoint
echo ""
echo "1. Testing Health Endpoint..."
curl -s "$BASE_URL/api/health" | jq .

# Test registration endpoint (without actually registering)
echo ""
echo "2. Testing Registration Endpoint (validation)..."
curl -s -X POST "$BASE_URL/api/register" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

# Test login endpoint (without actually logging in)
echo ""
echo "3. Testing Login Endpoint (validation)..."
curl -s -X POST "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .

# Test product plans endpoint (without authentication)
echo ""
echo "4. Testing Product Plans Endpoint (without auth)..."
curl -s "$BASE_URL/api/product-plans" | jq .

# Test marketing stats endpoint
echo ""
echo "5. Testing Marketing Stats Endpoint..."
curl -s "$BASE_URL/api/marketing-stats" | jq .

# Test fake withdrawal endpoint
echo ""
echo "6. Testing Fake Withdrawal Endpoint..."
curl -s "$BASE_URL/api/fake-withdrawal" | jq .

# Test UPI ID endpoint
echo ""
echo "7. Testing UPI ID Endpoint..."
curl -s "$BASE_URL/api/upi-id" | jq .

echo ""
echo "API tests completed."