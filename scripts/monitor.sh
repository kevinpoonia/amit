#!/bin/bash

# Application Monitoring Script

echo "Monitoring Investment Platform..."
echo "=============================="

# Monitor frontend
echo ""
echo "1. Monitoring Frontend..."
curl -s -w "HTTP Code: %{http_code}\nTime: %{time_total}s\n" -o /dev/null https://investment-pro-official.netlify.app

# Monitor backend
echo ""
echo "2. Monitoring Backend..."
curl -s -w "HTTP Code: %{http_code}\nTime: %{time_total}s\n" -o /dev/null https://my-fullstack-app-backend-2omq.onrender.com/api/health

# Monitor database (if possible)
echo ""
echo "3. Monitoring Database..."
# This would require database-specific monitoring

echo ""
echo "Monitoring completed."