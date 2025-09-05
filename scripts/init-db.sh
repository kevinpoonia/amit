#!/bin/bash

# Database initialization script for the Investment Platform

echo "Initializing database for Investment Platform..."

# This script assumes you have Supabase CLI installed and configured
# If not, you can install it with: npm install -g supabase

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "Supabase CLI could not be found. Installing..."
    npm install -g supabase
fi

# Link to your Supabase project
# You'll need to run 'supabase link' with your project ID first
# supabase link --project-ref your-project-id

# Apply migrations
echo "Applying database migrations..."
# supabase db push

# Or run the SQL file directly
echo "Running SQL schema file..."
# psql -h your-db-host -d your-db-name -U your-db-user -f database/investment-platform-schema.sql

echo "Database initialization completed!"