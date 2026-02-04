#!/bin/bash

# ================================================
# Post-Deployment Cleanup Script
# Jalankan SETELAH server sudah berjalan dengan baik
# ================================================

set -e

echo "========================================"
echo "  Post-Deployment Cleanup"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}WARNING: Script ini akan menghapus file database_full.sql dari git history!${NC}"
echo -e "${YELLOW}Pastikan server sudah berjalan dengan baik sebelum melanjutkan.${NC}"
echo ""
read -p "Apakah Anda yakin ingin melanjutkan? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Dibatalkan."
    exit 0
fi

echo ""
echo -e "${GREEN}[1/5] Removing database_full.sql from filesystem...${NC}"
rm -f database_full.sql
echo "✓ File removed"

echo -e "${GREEN}[2/5] Updating .gitignore...${NC}"
# Uncomment the database_full.sql line in .gitignore
sed -i '' 's/^# database_full.sql  # Uncomment/database_full.sql  # Uncommented/' .gitignore
echo "✓ .gitignore updated"

echo -e "${GREEN}[3/5] Removing file from git cache...${NC}"
git rm --cached database_full.sql 2>/dev/null || echo "File already not tracked"
echo "✓ Cache cleared"

echo -e "${GREEN}[4/5] Committing changes...${NC}"
git add .gitignore
git commit -m "chore: remove database_full.sql after successful deployment"
echo "✓ Changes committed"

echo -e "${GREEN}[5/5] Pushing to remote...${NC}"
git push
echo "✓ Pushed to remote"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Cleanup Complete! ✅${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Database file sudah dihapus dari:"
echo "  - Local filesystem ✓"
echo "  - Git tracking ✓"
echo "  - Remote repository (setelah push) ✓"
echo ""
echo -e "${YELLOW}CATATAN:${NC}"
echo "  - Database di server tetap aman"
echo "  - Untuk backup database, gunakan mysqldump di server"
echo "  - Simpan backup di lokasi yang aman (bukan di git)"
echo ""
