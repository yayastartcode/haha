# Deployment Guide via GitHub
**Hudan Hidayat Website - Ubuntu 24.04 + Nginx + PM2 + Node.js**

---

## 📋 Prerequisites (Sudah Terinstall)
- ✅ Node.js 20.x
- ✅ PM2
- ✅ Nginx
- ✅ MySQL Server

---

## 🚀 Deployment Steps

### **STEP 1: Create System User**

Login sebagai root atau user dengan sudo privileges:

```bash
# Login sebagai root
sudo su

# Buat user sistem untuk aplikasi
useradd -r -s /bin/bash -d /var/www/hudanhidayat -m hudanhidayat

# Verifikasi user sudah dibuat
id hudanhidayat
# Output: uid=999(hudanhidayat) gid=999(hudanhidayat) groups=999(hudanhidayat)
```

**Penjelasan:**
- `-r` : System user (UID < 1000)
- `-s /bin/bash` : Set shell
- `-d /var/www/hudanhidayat` : Home directory
- `-m` : Create home directory

---

### **STEP 2: Create Directory Structure**

```bash
# Buat direktori aplikasi
mkdir -p /var/www/hudanhidayat

# Buat direktori tambahan
mkdir -p /var/www/hudanhidayat/logs
mkdir -p /var/www/hudanhidayat/public/uploads
mkdir -p /var/log/hudanhidayat

# Verifikasi
ls -la /var/www/
```

---

### **STEP 3: Setup GitHub Access**

#### **Opsi A: HTTPS (Recommended untuk private repo)**

```bash
# Switch ke user hudanhidayat
su - hudanhidayat

# Navigate ke home directory
cd /var/www/hudanhidayat

# Clone repository (akan diminta username & password/token)
git clone https://github.com/YOUR_USERNAME/hudanhidayat.git .

# Jika private repo, gunakan Personal Access Token:
# 1. Buka GitHub → Settings → Developer settings → Personal access tokens
# 2. Generate new token (classic) dengan scope 'repo'
# 3. Copy token
# 4. Saat clone, masukkan token sebagai password
```

#### **Opsi B: SSH (Jika sudah setup SSH keys)**

```bash
# Generate SSH key (jika belum ada)
su - hudanhidayat
ssh-keygen -t ed25519 -C "hudanhidayat@yourserver.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub
# Copy output dan tambahkan ke GitHub Settings → SSH Keys

# Clone repository
cd /var/www/hudanhidayat
git clone git@github.com:YOUR_USERNAME/hudanhidayat.git .
```

**Catatan:** Ganti `YOUR_USERNAME` dengan username GitHub Anda

---

### **STEP 4: Set File Permissions**

Exit dari user `hudanhidayat` dan kembali ke root/sudo:

```bash
# Exit dari user hudanhidayat
exit

# Set ownership
sudo chown -R hudanhidayat:hudanhidayat /var/www/hudanhidayat

# Set permissions untuk aplikasi
sudo chmod -R 755 /var/www/hudanhidayat

# Set permissions untuk uploads (perlu writable oleh web server)
sudo chmod -R 775 /var/www/hudanhidayat/public/uploads
sudo chown -R hudanhidayat:www-data /var/www/hudanhidayat/public/uploads

# Set permissions untuk logs
sudo chmod -R 775 /var/www/hudanhidayat/logs

# Verifikasi
ls -la /var/www/hudanhidayat
```

**Expected Output:**
```
drwxr-xr-x  hudanhidayat hudanhidayat  4096 ... .
-rwxr-xr-x  hudanhidayat hudanhidayat  1234 ... app.js
drwxrwxr-x  hudanhidayat www-data      4096 ... public/uploads
```

---

### **STEP 5: Setup Environment Variables**

```bash
# Switch ke user hudanhidayat
sudo su - hudanhidayat
cd /var/www/hudanhidayat

# Copy template .env
cp .env.example .env

# Edit .env
nano .env
```

**Isi .env dengan konfigurasi production:**
```env
DB_PASSWORD=your_secure_database_password
SESSION_SECRET=generate_random_string_min_32_chars
PORT=3002
NODE_ENV=production
```

**Generate secure session secret:**
```bash
# Cara generate random string:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Save file:**
- Tekan `Ctrl + O` untuk save
- Tekan `Enter` untuk confirm
- Tekan `Ctrl + X` untuk exit

**Secure .env file:**
```bash
chmod 600 .env
# Verifikasi
ls -la .env
# Output: -rw------- 1 hudanhidayat hudanhidayat
```

---

### **STEP 6: Setup MySQL Database**

Exit ke root/sudo user:

```bash
exit  # keluar dari user hudanhidayat

# Login ke MySQL
sudo mysql -u root -p
```

**Di MySQL prompt:**

```sql
-- Buat database
CREATE DATABASE hudan_hidayat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Buat user database
CREATE USER 'hudanhidayat'@'localhost' IDENTIFIED BY 'your_secure_database_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON hudan_hidayat_db.* TO 'hudanhidayat'@'localhost';
FLUSH PRIVILEGES;

-- Keluar
EXIT;
```

**Import database schema:**

```bash
# Import main schema
sudo mysql -u root -p hudan_hidayat_db < /var/www/hudanhidayat/schema.sql

# Import migrations
sudo mysql -u root -p hudan_hidayat_db < /var/www/hudanhidayat/migration_stats.sql
sudo mysql -u root -p hudan_hidayat_db < /var/www/hudanhidayat/migration_settings.sql

# Import full database (jika ada - untuk data awal)
sudo mysql -u root -p hudan_hidayat_db < /var/www/hudanhidayat/database_full.sql
```

**Verifikasi database:**

```bash
sudo mysql -u root -p hudan_hidayat_db -e "SHOW TABLES;"
```

**Expected Output:**
```
+---------------------------+
| Tables_in_hudan_hidayat_db|
+---------------------------+
| books                     |
| content                   |
| gallery                   |
| settings                  |
| stats                     |
| users                     |
+---------------------------+
```

---

### **STEP 7: Install Node.js Dependencies**

```bash
# Switch ke user hudanhidayat
sudo su - hudanhidayat
cd /var/www/hudanhidayat

# Install dependencies (production only)
npm install --production

# Verifikasi
ls -la node_modules/
```

**Tunggu proses instalasi selesai (2-5 menit)**

---

### **STEP 8: Update Nginx Configuration**

Exit ke root/sudo:

```bash
exit  # keluar dari user hudanhidayat

# Edit nginx config dari repository
sudo nano /var/www/hudanhidayat/nginx.conf
```

**Update `server_name` dengan domain Anda:**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # GANTI INI!
    
    # ... (rest of config remains the same)
}
```

**Save file** (`Ctrl+O`, `Enter`, `Ctrl+X`)

**Copy ke Nginx sites-available:**

```bash
# Copy config
sudo cp /var/www/hudanhidayat/nginx.conf /etc/nginx/sites-available/hudanhidayat

# Create symlink ke sites-enabled
sudo ln -s /etc/nginx/sites-available/hudanhidayat /etc/nginx/sites-enabled/

# Hapus default (optional)
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t
```

**Expected Output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**Reload Nginx:**

```bash
sudo systemctl reload nginx
```

---

### **STEP 9: Start Application with PM2**

```bash
# Switch ke user hudanhidayat
sudo su - hudanhidayat
cd /var/www/hudanhidayat

# Start aplikasi dengan PM2
pm2 start ecosystem.config.js

# Verifikasi aplikasi running
pm2 status
```

**Expected Output:**
```
┌────┬────────────────┬──────────┬──────┬───────────┬──────────┐
│ id │ name           │ mode     │ ↺    │ status    │ cpu      │
├────┼────────────────┼──────────┼──────┼───────────┼──────────┤
│ 0  │ hudanhidayat   │ fork     │ 0    │ online    │ 0%       │
└────┴────────────────┴──────────┴──────┴───────────┴──────────┘
```

**Save PM2 process list:**

```bash
pm2 save
```

**Setup PM2 startup (agar auto-start saat reboot):**

```bash
exit  # keluar dari user hudanhidayat

# Setup startup sebagai root
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u hudanhidayat --hp /var/www/hudanhidayat

# Verifikasi
sudo systemctl status pm2-hudanhidayat
```

---

### **STEP 10: Test Application**

**Test dari server:**

```bash
# Test local
curl http://localhost:3002

# Test via nginx
curl http://localhost
```

**Test dari browser lokal:**

```
http://YOUR_SERVER_IP
```

Jika sukses, website sudah live! 🎉

---

### **STEP 11: Setup Firewall (UFW)**

```bash
# Allow Nginx
sudo ufw allow 'Nginx Full'

# Allow SSH (PENTING! Jangan lupa!)
sudo ufw allow OpenSSH

# Enable firewall
sudo ufw enable

# Verifikasi status
sudo ufw status
```

**Expected Output:**
```
Status: active

To                         Action      From
--                         ------      ----
Nginx Full                 ALLOW       Anywhere
OpenSSH                    ALLOW       Anywhere
```

---

### **STEP 12: Setup SSL Certificate (HTTPS) - Optional tapi Recommended**

**Install Certbot:**

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

**Get SSL Certificate:**

```bash
# Ganti dengan domain Anda
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Certbot akan:**
1. Meminta email Anda
2. Minta persetujuan Terms of Service
3. Otomatis update Nginx config
4. Setup auto-renewal

**Test auto-renewal:**

```bash
sudo certbot renew --dry-run
```

**Setelah SSL aktif, website accessible via:**
- ✅ `https://yourdomain.com`
- ✅ `https://www.yourdomain.com`
- ✅ HTTP akan auto-redirect ke HTTPS

---

## ✅ Verification Checklist

Pastikan semua ini berfungsi:

- [ ] User `hudanhidayat` created
- [ ] Directory `/var/www/hudanhidayat` exists
- [ ] Repository cloned from GitHub
- [ ] File permissions correct (755 app, 775 uploads, 600 .env)
- [ ] `.env` configured with production values
- [ ] MySQL database created and imported
- [ ] Node modules installed
- [ ] Nginx configured and running
- [ ] PM2 running aplikasi (status: online)
- [ ] Website accessible via browser
- [ ] Firewall configured
- [ ] SSL certificate installed (optional)

---

## 🎯 Common Commands

### **PM2 Management**

```bash
# Sebagai user hudanhidayat
sudo su - hudanhidayat

pm2 status                    # Status aplikasi
pm2 logs hudanhidayat         # Lihat logs
pm2 restart hudanhidayat      # Restart aplikasi
pm2 stop hudanhidayat         # Stop aplikasi
pm2 start hudanhidayat        # Start aplikasi
pm2 monit                     # Real-time monitoring
```

### **Nginx Management**

```bash
sudo nginx -t                 # Test config
sudo systemctl reload nginx   # Reload config
sudo systemctl restart nginx  # Restart nginx
sudo systemctl status nginx   # Status nginx
```

### **View Logs**

```bash
# PM2 logs
sudo su - hudanhidayat
pm2 logs --lines 100

# Nginx access log
sudo tail -f /var/log/nginx/hudanhidayat-access.log

# Nginx error log
sudo tail -f /var/log/nginx/hudanhidayat-error.log
```

---

## 🔄 Update Application (Git Pull)

Untuk update aplikasi dari GitHub:

```bash
# Switch ke user hudanhidayat
sudo su - hudanhidayat
cd /var/www/hudanhidayat

# Pull latest changes
git pull origin main

# Install dependencies (jika ada perubahan di package.json)
npm install --production

# Restart aplikasi
pm2 restart hudanhidayat

# Verifikasi
pm2 status
pm2 logs hudanhidayat --lines 20
```

---

## 🐛 Troubleshooting

### **Aplikasi tidak start:**

```bash
# Cek PM2 logs
sudo su - hudanhidayat
pm2 logs hudanhidayat --err

# Cek .env file
cat /var/www/hudanhidayat/.env

# Test manual start
cd /var/www/hudanhidayat
node app.js
```

### **Cannot connect to database:**

```bash
# Test database connection
mysql -u hudanhidayat -p hudan_hidayat_db

# Check MySQL status
sudo systemctl status mysql
```

### **Nginx 502 Bad Gateway:**

```bash
# Pastikan aplikasi running
sudo su - hudanhidayat
pm2 status

# Cek port 3002
sudo netstat -tulpn | grep 3002

# Cek Nginx error log
sudo tail -f /var/log/nginx/hudanhidayat-error.log
```

### **Permission denied errors:**

```bash
# Reset permissions
sudo chown -R hudanhidayat:hudanhidayat /var/www/hudanhidayat
sudo chmod -R 755 /var/www/hudanhidayat
sudo chmod -R 775 /var/www/hudanhidayat/public/uploads
sudo chmod 600 /var/www/hudanhidayat/.env
```

---

## 🔐 Security Post-Deployment

### **1. Remove database_full.sql from GitHub**

Setelah deployment sukses, jalankan di lokal (Mac):

```bash
cd /Users/tyayuwono/Documents/application/hudanhidayat
./cleanup-after-deployment.sh
```

### **2. Change default admin password**

1. Login ke `/admin` dengan:
   - Username: `admin`
   - Password: `admin123`
2. Langsung ganti password di `/admin/password`

### **3. Setup regular database backup**

Di server:

```bash
# Buat direktori backup
sudo mkdir -p /var/backups/hudanhidayat

# Buat backup script
sudo nano /usr/local/bin/backup-hudanhidayat.sh
```

**Isi script:**
```bash
#!/bin/bash
mysqldump -u hudanhidayat -pYOUR_DB_PASSWORD hudan_hidayat_db > /var/backups/hudanhidayat/backup-$(date +%Y%m%d-%H%M%S).sql
find /var/backups/hudanhidayat -name "backup-*.sql" -mtime +7 -delete
```

**Setup cron:**
```bash
sudo chmod +x /usr/local/bin/backup-hudanhidayat.sh
sudo crontab -e

# Tambahkan (backup setiap hari jam 2 pagi):
0 2 * * * /usr/local/bin/backup-hudanhidayat.sh
```

---

## 📞 Need Help?

Jika ada masalah:
1. Cek PM2 logs: `pm2 logs hudanhidayat`
2. Cek Nginx error log: `sudo tail -f /var/log/nginx/hudanhidayat-error.log`
3. Cek aplikasi bisa start manual: `node app.js`

---

**Deployment Complete! 🚀**
Website Hudan Hidayat sekarang live di production server!
