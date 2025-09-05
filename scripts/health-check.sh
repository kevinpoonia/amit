#!/bin/bash

# Health check script for the Investment Platform

echo "Performing health checks for Investment Platform..."

# Check if backend is running
echo "Checking backend health..."
curl -s https://my-fullstack-app-backend-2omq.onrender.com/api/health | jq .

# Check if frontend is accessible
echo "Checking frontend accessibility..."
curl -s -I https://investment-pro-official.netlify.app | head -n 1

# Check database connectivity
echo "Checking database connectivity..."
# This would require database-specific checks

echo "Health checks completed!"