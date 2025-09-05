#!/bin/bash

# Restore Script

echo "Restoring Investment Platform Data..."
echo "=================================="

# Check if backup directory is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_directory>"
    echo "Example: $0 /root/backups/20230815_143022"
    exit 1
fi

BACKUP_DIR=$1

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "Error: Backup directory $BACKUP_DIR does not exist"
    exit 1
fi

echo ""
echo "Restoring from backup: $BACKUP_DIR"

# Confirm before restoring
echo ""
echo "WARNING: This will overwrite your current application files!"
echo "Are you sure you want to continue? (y/N)"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Restore cancelled"
    exit 0
fi

# Restore frontend
echo ""
echo "1. Restoring frontend code..."
if [ -d "$BACKUP_DIR/frontend" ]; then
    cp -r $BACKUP_DIR/frontend /root/my-fullstack-app/
    echo "Frontend restored successfully"
else
    echo "Warning: Frontend directory not found in backup"
fi

# Restore backend
echo ""
echo "2. Restoring backend code..."
if [ -d "$BACKUP_DIR/backend" ]; then
    cp -r $BACKUP_DIR/backend /root/my-fullstack-app/
    echo "Backend restored successfully"
else
    echo "Warning: Backend directory not found in backup"
fi

# Restore documentation
echo ""
echo "3. Restoring documentation..."
if [ -d "$BACKUP_DIR/docs" ]; then
    cp -r $BACKUP_DIR/docs /root/my-fullstack-app/
    echo "Documentation restored successfully"
else
    echo "Warning: Documentation directory not found in backup"
fi

# Restore database schema
echo ""
echo "4. Restoring database schema..."
if [ -f "$BACKUP_DIR/investment-platform-schema.sql" ]; then
    cp $BACKUP_DIR/investment-platform-schema.sql /root/my-fullstack-app/database/
    echo "Database schema restored successfully"
else
    echo "Warning: Database schema not found in backup"
fi

# Restore scripts
echo ""
echo "5. Restoring scripts..."
if [ -d "$BACKUP_DIR/scripts" ]; then
    cp -r $BACKUP_DIR/scripts /root/my-fullstack-app/
    echo "Scripts restored successfully"
else
    echo "Warning: Scripts directory not found in backup"
fi

echo ""
echo "Restore completed successfully!"