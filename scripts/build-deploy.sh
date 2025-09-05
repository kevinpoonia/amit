#!/bin/bash

# Build and Deploy Script

echo "Building and Deploying Investment Platform..."
echo "=========================================="

# Build the frontend
echo ""
echo "1. Building Frontend..."
cd /root/my-fullstack-app/frontend
npm run build

if [ $? -eq 0 ]; then
    echo "Frontend build successful!"
else
    echo "Frontend build failed!"
    exit 1
fi

# Build the backend
echo ""
echo "2. Building Backend..."
cd /root/my-fullstack-app/backend
npm install

if [ $? -eq 0 ]; then
    echo "Backend build successful!"
else
    echo "Backend build failed!"
    exit 1
fi

# Deploy to Netlify (frontend)
echo ""
echo "3. Deploying Frontend to Netlify..."
# This would require Netlify CLI to be installed and configured
# netlify deploy --prod

# Deploy to Render (backend)
echo ""
echo "4. Deploying Backend to Render..."
# This would require Render CLI to be installed and configured
# render deploy

echo ""
echo "Build and deployment process completed!"
echo "Please manually deploy to Netlify and Render using their respective dashboards."