#!/bin/bash

# Development Stop Script

echo "Stopping Investment Platform Development Servers..."
echo "============================================"

# Find and kill processes running on ports 3000 and 5000
echo ""
echo "1. Stopping processes on port 3000 (Frontend)..."
PID_3000=$(lsof -ti:3000)
if [ ! -z "$PID_3000" ]; then
    kill $PID_3000
    echo "  ✓ Killed process $PID_3000 on port 3000"
else
    echo "  ✓ No process found on port 3000"
fi

echo ""
echo "2. Stopping processes on port 5000 (Backend)..."
PID_5000=$(lsof -ti:5000)
if [ ! -z "$PID_5000" ]; then
    kill $PID_5000
    echo "  ✓ Killed process $PID_5000 on port 5000"
else
    echo "  ✓ No process found on port 5000"
fi

echo ""
echo "Development servers stopped successfully!"