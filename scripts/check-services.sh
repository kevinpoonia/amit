#!/bin/bash

# Service Status Check Script

echo "Checking Investment Platform Services..."
echo "======================================"

# Check frontend service
echo ""
echo "1. Checking Frontend Service..."
curl -s -I https://investment-pro-official.netlify.app | head -n 1

# Check backend service
echo ""
echo "2. Checking Backend Service..."
curl -s https://my-fullstack-app-backend-2omq.onrender.com/api/health | jq .

# Check database connectivity (if possible)
echo ""
echo "3. Checking Database Connectivity..."
# This would require database-specific checks

echo ""
echo "Service checks completed."