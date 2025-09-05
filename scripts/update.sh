#!/bin/bash

# Update Script

echo "Updating Investment Platform..."
echo "============================"

# Pull latest changes from repository
echo ""
echo "1. Pulling latest changes from repository..."
cd /root/my-fullstack-app
git pull origin master

if [ $? -eq 0 ]; then
    echo "Repository updated successfully!"
else
    echo "Failed to update repository!"
    exit 1
fi

# Update frontend dependencies
echo ""
echo "2. Updating frontend dependencies..."
cd /root/my-fullstack-app/frontend
npm install

if [ $? -eq 0 ]; then
    echo "Frontend dependencies updated successfully!"
else
    echo "Failed to update frontend dependencies!"
    exit 1
fi

# Update backend dependencies
echo ""
echo "3. Updating backend dependencies..."
cd /root/my-fullstack-app/backend
npm install

if [ $? -eq 0 ]; then
    echo "Backend dependencies updated successfully!"
else
    echo "Failed to update backend dependencies!"
    exit 1
fi

# Rebuild frontend
echo ""
echo "4. Rebuilding frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "Frontend rebuilt successfully!"
else
    echo "Failed to rebuild frontend!"
    exit 1
fi

# Restart backend service (if running locally)
echo ""
echo "5. Restarting backend service..."
# This would depend on how the backend is deployed

echo ""
echo "Application update completed successfully!"
echo "Please redeploy to your hosting platforms (Netlify/Render) if needed."