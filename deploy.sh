#!/bin/bash

# Deployment script for the investment platform

echo "Starting deployment process..."

# Navigate to backend directory
echo "Deploying backend..."
cd backend

# Install backend dependencies
echo "Installing backend dependencies..."
npm install

# Build backend (if needed)
echo "Building backend..."
# Add any build commands here if needed

# Navigate to frontend directory
echo "Deploying frontend..."
cd ../frontend

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Build frontend
echo "Building frontend..."
npm run build

echo "Deployment process completed!"

echo "To start the backend server, run:"
echo "cd backend && npm start"

echo "To serve the frontend, upload the contents of frontend/build to your hosting provider."