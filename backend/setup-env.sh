#!/bin/bash

# Script to set up environment variables for the investment platform

echo "Setting up environment variables for the investment platform..."

# Check if .env file exists
if [ ! -f ".env" ]; then
  echo "Creating .env file from .env.example..."
  cp .env.example .env
fi

# Prompt user for Supabase URL
echo "Please enter your Supabase URL (e.g., https://your-project.supabase.co):"
read supabase_url

# Prompt user for Supabase API Key
echo "Please enter your Supabase API Key (anon key):"
read supabase_api_key

# Prompt user for JWT Secret
echo "Please enter your JWT Secret (can be any random string):"
read jwt_secret

# Update .env file with the provided values
sed -i "s|your_supabase_url|$supabase_url|g" .env
sed -i "s|your_supabase_api_key|$supabase_api_key|g" .env
sed -i "s|your_jwt_secret|$jwt_secret|g" .env

echo "Environment variables have been set up successfully!"
echo "To verify, here's the content of your .env file:"
echo "----------------------------------------"
cat .env
echo "----------------------------------------"

echo "Now you can run the database initialization script with:"
echo "node init-db-complete.js"