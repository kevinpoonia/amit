#!/bin/bash

# Test Script

echo "Running Investment Platform Tests..."
echo "=============================="

# Run frontend tests
echo ""
echo "1. Running Frontend Tests..."
cd /root/my-fullstack-app/frontend
npm test -- --watchAll=false

if [ $? -eq 0 ]; then
    echo "  ✓ Frontend tests passed"
else
    echo "  ✗ Frontend tests failed"
fi

# Run backend tests
echo ""
echo "2. Running Backend Tests..."
cd /root/my-fullstack-app/backend
npm test

if [ $? -eq 0 ]; then
    echo "  ✓ Backend tests passed"
else
    echo "  ✗ Backend tests failed"
fi

# Run API tests
echo ""
echo "3. Running API Tests..."
/root/my-fullstack-app/scripts/test-api.sh

# Run service checks
echo ""
echo "4. Running Service Checks..."
/root/my-fullstack-app/scripts/check-services.sh

# Run status check
echo ""
echo "5. Running Status Check..."
/root/my-fullstack-app/scripts/status.sh

echo ""
echo "All tests completed."