#!/bin/bash

# Clean Script

echo "Cleaning Investment Platform..."
echo "=========================="

# Confirm before cleaning
echo ""
echo "WARNING: This will remove build files and node_modules directories!"
echo "Are you sure you want to continue? (y/N)"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Clean cancelled"
    exit 0
fi

# Clean frontend build directory
echo ""
echo "1. Cleaning frontend build directory..."
cd /root/my-fullstack-app/frontend
if [ -d "build" ]; then
    rm -rf build
    echo "  ✓ Frontend build directory removed"
else
    echo "  ✓ Frontend build directory not found"
fi

# Clean frontend node_modules
echo ""
echo "2. Cleaning frontend node_modules..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo "  ✓ Frontend node_modules removed"
else
    echo "  ✓ Frontend node_modules not found"
fi

# Clean backend node_modules
echo ""
echo "3. Cleaning backend node_modules..."
cd /root/my-fullstack-app/backend
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo "  ✓ Backend node_modules removed"
else
    echo "  ✓ Backend node_modules not found"
fi

# Clean logs (if any)
echo ""
echo "4. Cleaning logs..."
LOG_FILES=("/root/my-fullstack-app/frontend/npm-debug.log" "/root/my-fullstack-app/backend/npm-debug.log")
for log in "${LOG_FILES[@]}"; do
    if [ -f "$log" ]; then
        rm "$log"
        echo "  ✓ Removed $log"
    fi
done

echo ""
echo "Cleaning completed successfully!"
echo "To reinstall dependencies, run 'npm install' in both frontend and backend directories."