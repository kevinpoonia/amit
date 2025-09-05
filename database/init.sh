#!/bin/bash

# Database initialization script

echo "Initializing database schema..."

# This script would typically run the schema.sql file against your database
# For Supabase, you would usually run this through the Supabase dashboard
# or use the Supabase CLI

echo "Please run the following SQL commands in your Supabase SQL editor:"
echo ""
echo "------------------------------------------------------------------------"
cat /root/my-fullstack-app/database/investment-platform-schema.sql
echo "------------------------------------------------------------------------"
echo ""
echo "After running the SQL commands, your database will be initialized with all required tables."

exit 0