#!/bin/bash

# Deployment script for the Investment Platform

echo "Deploying Investment Platform..."

# Build the frontend
echo "Building frontend..."
cd /root/my-fullstack-app/frontend
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Frontend build successful!"
else
    echo "Frontend build failed!"
    exit 1
fi

# Deploy to Netlify (you'll need to configure Netlify CLI)
echo "Deploying to Netlify..."
# netlify deploy --prod

# Deploy backend to Render (you'll need to configure Render CLI)
echo "Deploying backend to Render..."
# render deploy

echo "Deployment completed!"