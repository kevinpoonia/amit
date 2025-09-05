#!/bin/bash

# Development Restart Script

echo "Restarting Investment Platform Development Servers..."
echo "=============================================="

# Stop existing servers
echo ""
echo "1. Stopping existing servers..."
/root/my-fullstack-app/scripts/stop-dev.sh

# Wait a moment for servers to stop
sleep 3

# Start new servers
echo ""
echo "2. Starting new servers..."
/root/my-fullstack-app/scripts/start-dev.sh

echo ""
echo "Development servers restarted successfully!"