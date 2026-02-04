#!/bin/bash

# ================================================
# Manual Server Setup (Step-by-step)
# Untuk pemahaman yang lebih baik tentang apa yang dilakukan deployment script
# ================================================

# JALANKAN SEBAGAI ROOT atau dengan sudo

# ===========================================
# STEP 1: CREATE USER & DIRECTORIES
# ===========================================

echo "Step 1: Creating user and directories..."

# Membuat user sistem untuk aplikasi
# -r : system user (UID < 1000)
# -s /bin/bash : shell yang digunakan
# -d /var/www/hudanhidayat : home directory
# -m : buat home directory
useradd -r -s /bin/bash -d /var/www/hudanhidayat -m hudanhidayat

# OPTIONAL: Set password jika ingin user bisa login via SSH
# echo "hudanhidayat:SecurePassword123!" | chpasswd

# OPTIONAL: Tambahkan user ke sudo group (jika perlu akses admin)
# usermod -aG sudo hudanhidayat
# Verify: groups hudanhidayat

# Buat direktori-direktori yang diperlukan
mkdir -p /var/www/hudanhidayat
mkdir -p /var/www/hudanhidayat/logs
mkdir -p /var/www/hudanhidayat/public
mkdir -p /var/www/hudanhidayat/public/uploads
mkdir -p /var/www/hudanhidayat/views
mkdir -p /var/www/hudanhidayat/routes
mkdir -p /var/log/hudanhidayat

# Verify directories created
ls -la /var/www/hudanhidayat

echo "✓ User and directories created"

# ===========================================
# STEP 2: SET OWNERSHIP & PERMISSIONS
# ===========================================

echo "Step 2: Setting ownership and permissions..."

# Set ownership ke user aplikasi
chown -R hudanhidayat:hudanhidayat /var/www/hudanhidayat

# Set permissions untuk direktori aplikasi
# 755 = rwxr-xr-x (owner: read/write/execute, group/others: read/execute)
chmod 755 /var/www/hudanhidayat

# Set permissions untuk semua file aplikasi
chmod -R 755 /var/www/hudanhidayat

# Uploads directory - perlu writable oleh web server (www-data)
# 775 = rwxrwxr-x (owner/group: read/write/execute, others: read/execute)
chmod -R 775 /var/www/hudanhidayat/public/uploads
chown -R hudanhidayat:www-data /var/www/hudanhidayat/public/uploads

# Logs directory - writable by app
chmod -R 775 /var/www/hudanhidayat/logs
chown -R hudanhidayat:hudanhidayat /var/www/hudanhidayat/logs

# .env file - secure! hanya owner yang bisa read/write
# 600 = rw------- (only owner can read/write)
chmod 600 /var/www/hudanhidayat/.env
chown hudanhidayat:hudanhidayat /var/www/hudanhidayat/.env

# Verify permissions
ls -la /var/www/hudanhidayat
ls -la /var/www/hudanhidayat/public/uploads
ls -la /var/www/hudanhidayat/.env

echo "✓ Permissions set correctly"

# ===========================================
# PERMISSION EXPLANATION
# ===========================================

# Permission format: rwxrwxrwx
#                    |||||||||||
#                    ||||||||||+- Others: execute
#                    |||||||||+-- Others: write
#                    ||||||||+--- Others: read
#                    |||||||+---- Group: execute
#                    ||||||+----- Group: write
#                    |||||+------ Group: read
#                    ||||+------- Owner: execute
#                    |||+-------- Owner: write
#                    ||+--------- Owner: read
#                    |+---------- File type (d=directory, -=file, l=link)

# Common permissions:
# 755 (rwxr-xr-x) - Standard for directories and executables
# 644 (rw-r--r--) - Standard for files
# 600 (rw-------) - Sensitive files (only owner can access)
# 775 (rwxrwxr-x) - Directory that needs group write access

# ===========================================
# USER & GROUP EXPLANATION
# ===========================================

# hudanhidayat:hudanhidayat
# ^^^^^^^^^^^:^^^^^^^^^^^
# |           |
# |           +-- Group owner
# +-------------- User owner

# Common groups:
# - hudanhidayat : Application user's primary group
# - www-data     : Nginx/Apache web server group
# - sudo         : Administrators group

# ===========================================
# VERIFY SETUP
# ===========================================

echo "Verification commands:"
echo "  id hudanhidayat                    # Check user info"
echo "  groups hudanhidayat                # Check user's groups"
echo "  ls -la /var/www/hudanhidayat       # Check ownership & permissions"
echo "  sudo -u hudanhidayat whoami        # Test sudo as app user"

# ===========================================
# TROUBLESHOOTING
# ===========================================

# If permission denied errors:
# sudo chown -R hudanhidayat:hudanhidayat /var/www/hudanhidayat
# sudo chmod -R 755 /var/www/hudanhidayat
# sudo chmod -R 775 /var/www/hudanhidayat/public/uploads

# If file upload errors:
# sudo chmod 775 /var/www/hudanhidayat/public/uploads
# sudo chown -R hudanhidayat:www-data /var/www/hudanhidayat/public/uploads

# If .env security warning:
# sudo chmod 600 /var/www/hudanhidayat/.env
# sudo chown hudanhidayat:hudanhidayat /var/www/hudanhidayat/.env
