#!/bin/bash

# Status Check Script

echo "Checking Investment Platform Status..."
echo "=================================="

# Check if required directories exist
echo ""
echo "1. Checking required directories..."

DIRECTORIES=(
    "/root/my-fullstack-app/frontend"
    "/root/my-fullstack-app/backend"
    "/root/my-fullstack-app/database"
    "/root/my-fullstack-app/scripts"
    "/root/my-fullstack-app/docs"
)

for dir in "${DIRECTORIES[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✓ $dir exists"
    else
        echo "  ✗ $dir missing"
    fi
done

# Check if required files exist
echo ""
echo "2. Checking required files..."

FILES=(
    "/root/my-fullstack-app/frontend/package.json"
    "/root/my-fullstack-app/backend/package.json"
    "/root/my-fullstack-app/database/investment-platform-schema.sql"
    "/root/my-fullstack-app/README.md"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file exists"
    else
        echo "  ✗ $file missing"
    fi
done

# Check if required executables exist
echo ""
echo "3. Checking required executables..."

EXECUTABLES=(
    "node"
    "npm"
    "git"
    "curl"
)

for exe in "${EXECUTABLES[@]}"; do
    if command -v "$exe" &> /dev/null; then
        echo "  ✓ $exe is installed"
    else
        echo "  ✗ $exe is not installed"
    fi
done

# Check frontend build status
echo ""
echo "4. Checking frontend build status..."

if [ -d "/root/my-fullstack-app/frontend/build" ]; then
    echo "  ✓ Frontend build directory exists"
    
    # Count files in build directory
    BUILD_FILE_COUNT=$(find /root/my-fullstack-app/frontend/build -type f | wc -l)
    echo "  ✓ Build contains $BUILD_FILE_COUNT files"
else
    echo "  ✗ Frontend build directory missing"
fi

# Check backend dependencies
echo ""
echo "5. Checking backend dependencies..."

cd /root/my-fullstack-app/backend
if [ -d "node_modules" ]; then
    echo "  ✓ Backend node_modules directory exists"
    
    # Count dependencies
    DEPENDENCY_COUNT=$(ls node_modules | wc -l)
    echo "  ✓ Backend has approximately $DEPENDENCY_COUNT dependencies"
else
    echo "  ✗ Backend node_modules directory missing"
fi

echo ""
echo "Status check completed."