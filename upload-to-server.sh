#!/bin/bash

# ===============================================
# Quick Upload Script to Server
# ===============================================

# Konfigurasi - GANTI DENGAN INFO SERVER ANDA
SERVER_USER="your-username"
SERVER_IP="your-server-ip"
SERVER_PATH="/tmp/hudanhidayat"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Uploading Hudan Hidayat to Server ===${NC}"
echo ""

# Create temp directory on server
echo -e "${YELLOW}[1/3] Creating directory on server...${NC}"
ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_PATH"

# Upload files using rsync
echo -e "${YELLOW}[2/3] Uploading files (this may take a while)...${NC}"
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.DS_Store' \
  --exclude '*.log' \
  --exclude '*_backup.ejs' \
  ./ $SERVER_USER@$SERVER_IP:$SERVER_PATH/

# Upload .env separately with secure permissions
echo -e "${YELLOW}[3/3] Uploading .env file...${NC}"
scp .env $SERVER_USER@$SERVER_IP:$SERVER_PATH/.env

echo ""
echo -e "${GREEN}Upload complete!${NC}"
echo ""
echo "Next steps on server:"
echo "1. SSH to server: ssh $SERVER_USER@$SERVER_IP"
echo "2. Run deployment: sudo /tmp/hudanhidayat/deploy.sh"
echo ""
