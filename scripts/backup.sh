#!/bin/bash

# Backup Script

echo "Backing up Investment Platform Data..."
echo "==================================="

# Create backup directory
BACKUP_DIR="/root/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

echo ""
echo "1. Backing up frontend code..."
cp -r /root/my-fullstack-app/frontend $BACKUP_DIR/

echo ""
echo "2. Backing up backend code..."
cp -r /root/my-fullstack-app/backend $BACKUP_DIR/

echo ""
echo "3. Backing up documentation..."
cp -r /root/my-fullstack-app/docs $BACKUP_DIR/

echo ""
echo "4. Backing up database schema..."
cp /root/my-fullstack-app/database/investment-platform-schema.sql $BACKUP_DIR/

echo ""
echo "5. Backing up scripts..."
cp -r /root/my-fullstack-app/scripts $BACKUP_DIR/

echo ""
echo "Backup completed successfully!"
echo "Backup location: $BACKUP_DIR"