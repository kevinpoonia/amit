#!/bin/bash

# Development Start Script

echo "Starting Investment Platform Development Servers..."
echo "============================================="

# Start backend server
echo ""
echo "1. Starting Backend Server..."
cd /root/my-fullstack-app/backend
npm start &

if [ $? -eq 0 ]; then
    echo "  ✓ Backend server started successfully"
else
    echo "  ✗ Failed to start backend server"
    exit 1
fi

# Wait a moment for backend to start
sleep 3

# Start frontend development server
echo ""
echo "2. Starting Frontend Development Server..."
cd /root/my-fullstack-app/frontend
npm start &

if [ $? -eq 0 ]; then
    echo "  ✓ Frontend development server started successfully"
else
    echo "  ✗ Failed to start frontend development server"
    exit 1
fi

echo ""
echo "Development servers started successfully!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes to finish
wait