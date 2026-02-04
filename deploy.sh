#!/bin/bash

# ============================================
# Deployment Script for Hudan Hidayat Website
# Ubuntu 24.04 + Nginx + PM2 + Node.js
# ============================================

set -e  # Exit on error

echo "=== Hudan Hidayat Website Deployment ==="
echo ""

# Configuration
APP_NAME="hudanhidayat"
APP_DIR="/var/www/hudanhidayat"
APP_USER="hudanhidayat"
NGINX_CONF="/etc/nginx/sites-available/hudanhidayat"
DB_NAME="hudan_hidayat_db"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root (use sudo)${NC}" 
   exit 1
fi

echo -e "${GREEN}[1/10] Creating system user and directories...${NC}"

# Create user if doesn't exist
if id "$APP_USER" &>/dev/null; then
    echo "✓ User $APP_USER already exists"
else
    # Create system user with home directory
    useradd -r -s /bin/bash -d $APP_DIR -m $APP_USER
    echo "✓ User $APP_USER created"
    
    # Set password for the user (optional, for SSH access if needed)
    # Uncomment next line if you want to set password
    # echo "$APP_USER:YourSecurePassword" | chpasswd
fi

# Add user to sudo group (if needed for administrative tasks)
# Uncomment if you want the app user to have sudo privileges
# usermod -aG sudo $APP_USER
# echo "✓ User $APP_USER added to sudo group"

# Create application directories
echo "Creating application directories..."
mkdir -p $APP_DIR
mkdir -p $APP_DIR/logs
mkdir -p $APP_DIR/public
mkdir -p $APP_DIR/public/uploads
mkdir -p $APP_DIR/views
mkdir -p $APP_DIR/routes
mkdir -p /var/log/hudanhidayat

echo "✓ All directories created"

echo -e "${GREEN}[2/10] Installing dependencies (Node.js, MySQL, Nginx, PM2)...${NC}"
# Update system
apt update

# Install Node.js 20.x if not installed
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Install MySQL if not installed
if ! command -v mysql &> /dev/null; then
    apt install -y mysql-server
    systemctl start mysql
    systemctl enable mysql
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup systemd -u $APP_USER --hp $APP_DIR
fi

echo -e "${GREEN}[3/10] Creating application directory...${NC}"
# Create app directory if doesn't exist
mkdir -p $APP_DIR
mkdir -p $APP_DIR/logs
mkdir -p $APP_DIR/public/uploads

echo -e "${YELLOW}[4/10] Please upload your application files to $APP_DIR${NC}"
echo -e "${YELLOW}       You can use: scp -r /path/to/local/app/* user@server:$APP_DIR/${NC}"
echo ""
read -p "Press [Enter] when files are uploaded..."

echo -e "${GREEN}[5/10] Setting up file permissions and ownership...${NC}"

# Set ownership to application user
echo "Setting ownership to $APP_USER..."
chown -R $APP_USER:$APP_USER $APP_DIR

# Set directory permissions
echo "Setting directory permissions..."
# Base directory - readable and executable by all, writable by owner
chmod 755 $APP_DIR

# Application files - readable by all, writable by owner
chmod -R 755 $APP_DIR

# Uploads directory - writable by application (for file uploads)
chmod -R 775 $APP_DIR/public/uploads
chown -R $APP_USER:www-data $APP_DIR/public/uploads

# Logs directory - writable by application
chmod -R 775 $APP_DIR/logs
chown -R $APP_USER:$APP_USER $APP_DIR/logs

# .env file - readable only by owner (secure sensitive data)
if [ -f "$APP_DIR/.env" ]; then
    chmod 600 $APP_DIR/.env
    chown $APP_USER:$APP_USER $APP_DIR/.env
    echo "✓ .env file secured (600)"
fi

# Make deployment script executable
if [ -f "$APP_DIR/deploy.sh" ]; then
    chmod +x $APP_DIR/deploy.sh
fi

# Node modules (if exists) should be owned by app user
if [ -d "$APP_DIR/node_modules" ]; then
    chown -R $APP_USER:$APP_USER $APP_DIR/node_modules
fi

echo "✓ Permissions set:"
echo "  - Application files: 755 (owner: $APP_USER)"
echo "  - Uploads directory: 775 (owner: $APP_USER:www-data)"
echo "  - Logs directory: 775 (owner: $APP_USER)"
echo "  - .env file: 600 (owner: $APP_USER)"

echo -e "${GREEN}[6/10] Installing Node.js dependencies...${NC}"
cd $APP_DIR
sudo -u $APP_USER npm install --production

echo -e "${GREEN}[7/10] Setting up MySQL database...${NC}"
echo -e "${YELLOW}Please enter MySQL root password:${NC}"
read -s MYSQL_ROOT_PASSWORD
echo ""

# Create database and user
mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<MYSQL_SCRIPT
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'hudanhidayat'@'localhost' IDENTIFIED BY 'HudanDB2024!';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO 'hudanhidayat'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

echo -e "${YELLOW}Importing database schema...${NC}"
if [ -f "$APP_DIR/schema.sql" ]; then
    mysql -u root -p"$MYSQL_ROOT_PASSWORD" $DB_NAME < $APP_DIR/schema.sql
    echo "Schema imported"
fi

if [ -f "$APP_DIR/migration_stats.sql" ]; then
    mysql -u root -p"$MYSQL_ROOT_PASSWORD" $DB_NAME < $APP_DIR/migration_stats.sql
    echo "Stats migration imported"
fi

if [ -f "$APP_DIR/migration_settings.sql" ]; then
    mysql -u root -p"$MYSQL_ROOT_PASSWORD" $DB_NAME < $APP_DIR/migration_settings.sql
    echo "Settings migration imported"
fi

echo -e "${GREEN}[8/10] Setting up Nginx...${NC}"
# Copy nginx config
if [ -f "$APP_DIR/nginx.conf" ]; then
    cp $APP_DIR/nginx.conf $NGINX_CONF
    ln -sf $NGINX_CONF /etc/nginx/sites-enabled/$APP_NAME
    # Remove default if exists
    rm -f /etc/nginx/sites-enabled/default
    # Test nginx config
    nginx -t
    systemctl reload nginx
    echo "Nginx configured and reloaded"
else
    echo -e "${RED}nginx.conf not found in $APP_DIR${NC}"
fi

echo -e "${GREEN}[9/10] Starting application with PM2...${NC}"
cd $APP_DIR
# Stop if already running
sudo -u $APP_USER pm2 delete $APP_NAME 2>/dev/null || true
# Start with ecosystem file
sudo -u $APP_USER pm2 start ecosystem.config.js
# Save PM2 configuration
sudo -u $APP_USER pm2 save
# Setup PM2 to start on boot
env PATH=$PATH:/usr/bin pm2 startup systemd -u $APP_USER --hp $APP_DIR

echo -e "${GREEN}[10/10] Configuring firewall...${NC}"
# Allow HTTP and HTTPS
ufw allow 'Nginx Full' 2>/dev/null || true

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Application is running on: ${YELLOW}http://your-server-ip${NC}"
echo -e "PM2 status: ${YELLOW}pm2 status${NC}"
echo -e "PM2 logs: ${YELLOW}pm2 logs $APP_NAME${NC}"
echo -e "Application directory: ${YELLOW}$APP_DIR${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update nginx.conf with your domain name"
echo "2. Get SSL certificate: sudo certbot --nginx -d yourdomain.com"
echo "3. Check .env file settings"
echo "4. Create admin user in database"
echo ""
