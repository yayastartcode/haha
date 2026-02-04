# Hudan Hidayat Website - Deployment Guide

## 📦 Persiapan File

Pastikan file-file berikut sudah ada di folder lokal Anda:
- ✅ `ecosystem.config.js` - PM2 configuration
- ✅ `nginx.conf` - Nginx site configuration
- ✅ `deploy.sh` - Deployment script
- ✅ `.env` - Environment variables
- ✅ All application files

---

## 🚀 Deployment Steps

### 1. Export Database dari Lokal

```bash
# Dari komputer lokal (Mac)
cd /Users/tyayuwono/Documents/application/hudanhidayat

# Export full database (struktur + data)
mysqldump -u root -p hudan_hidayat_db > database_full.sql
```

### 2. Upload Files ke Server

```bash
# Dari komputer lokal
# Ganti 'your-server-ip' dengan IP server Anda
# Ganti 'your-user' dengan username SSH Anda

# Upload aplikasi
scp -r /Users/tyayuwono/Documents/application/hudanhidayat/* your-user@your-server-ip:/tmp/hudanhidayat/

# Atau gunakan rsync (lebih cepat)
rsync -avz --exclude 'node_modules' --exclude '.git' \
  /Users/tyayuwono/Documents/application/hudanhidayat/ \
  your-user@your-server-ip:/tmp/hudanhidayat/
```

### 3. Jalankan Deployment Script di Server

SSH ke server Ubuntu Anda:

```bash
ssh your-user@your-server-ip
```

Di server, jalankan:

```bash
# Copy files dari /tmp ke lokasi sementara
sudo mkdir -p /var/www/hudanhidayat
sudo cp -r /tmp/hudanhidayat/* /var/www/hudanhidayat/

# Berikan execute permission ke deployment script
sudo chmod +x /var/www/hudanhidayat/deploy.sh

# Jalankan deployment script
sudo /var/www/hudanhidayat/deploy.sh
```

Script akan otomatis:
- ✅ Membuat user `hudanhidayat`
- ✅ Install Node.js, MySQL, Nginx, PM2
- ✅ Setup permissions
- ✅ Import database
- ✅ Configure Nginx
- ✅ Start aplikasi dengan PM2

### 4. Update .env di Server

```bash
sudo nano /var/www/hudanhidayat/.env
```

Pastikan isinya:
```env
DB_PASSWORD=HudanDB2024!
SESSION_SECRET=your-very-secure-secret-key-here-change-this
PORT=3002
NODE_ENV=production
```

### 5. Update Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/hudanhidayat
```

Ganti `server_name` dengan domain Anda:
```nginx
server_name hudanhidayat.com www.hudanhidayat.com;
```

Reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Verifikasi Aplikasi Berjalan

```bash
# Cek status PM2
sudo -u hudanhidayat pm2 status

# Lihat logs
sudo -u hudanhidayat pm2 logs hudanhidayat

# Cek aplikasi accessible
curl http://localhost:3002
```

---

## 🔒 Setup SSL Certificate (Optional tapi Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate (ganti dengan domain Anda)
sudo certbot --nginx -d hudanhidayat.com -d www.hudanhidayat.com

# Auto-renewal sudah disiapkan oleh certbot
```

---

## 👤 Membuat Admin User

```bash
# Masuk ke MySQL
mysql -u root -p

# Pilih database
USE hudan_hidayat_db;

# Buat admin user (password: admin123 - GANTI SETELAH LOGIN PERTAMA!)
INSERT INTO users (username, password_hash, email, role) 
VALUES ('admin', '$2b$10$xK3Z8vQ.yxF4N8Z5rW4yOeQ3X7nH5bF2M1tP9qL4xJ6kR8sD0wE1Y', 'admin@hudanhidayat.com', 'admin');

# Keluar
EXIT;
```

**PENTING:** Password default di atas adalah `admin123`. Segera ganti setelah login pertama di `/admin/password`!

---

## 📊 Database Management

### Import Database Lengkap

```bash
mysql -u root -p hudan_hidayat_db < /var/www/hudanhidayat/database_full.sql
```

### Backup Database

```bash
# Manual backup
mysqldump -u root -p hudan_hidayat_db > /var/backups/hudan_$(date +%F).sql

# Setup automatic daily backup (crontab)
sudo crontab -e

# Tambahkan baris ini:
0 2 * * * mysqldump -u root -pYOUR_PASSWORD hudan_hidayat_db > /var/backups/hudan_$(date +\%F).sql
```

---

## 🔧 PM2 Commands

```bash
# Sebagai user hudanhidayat
sudo -u hudanhidayat pm2 status          # Status aplikasi
sudo -u hudanhidayat pm2 logs            # Lihat logs
sudo -u hudanhidayat pm2 restart hudanhidayat  # Restart aplikasi
sudo -u hudanhidayat pm2 stop hudanhidayat     # Stop aplikasi
sudo -u hudanhidayat pm2 start hudanhidayat    # Start aplikasi
sudo -u hudanhidayat pm2 monit           # Monitor real-time
```

---

## 🐛 Troubleshooting

### Aplikasi tidak bisa diakses

```bash
# Cek status PM2
sudo -u hudanhidayat pm2 status

# Cek logs error
sudo -u hudanhidayat pm2 logs hudanhidayat --err

# Cek Nginx error logs
sudo tail -f /var/log/nginx/hudanhidayat-error.log

# Cek apakah port 3002 listening
sudo netstat -tulpn | grep 3002
```

### Database connection error

```bash
# Cek MySQL running
sudo systemctl status mysql

# Test koneksi database
mysql -u hudanhidayat -p hudan_hidayat_db
```

### Permission issues

```bash
# Reset permissions
sudo chown -R hudanhidayat:hudanhidayat /var/www/hudanhidayat
sudo chmod -R 755 /var/www/hudanhidayat
sudo chmod -R 775 /var/www/hudanhidayat/public/uploads
sudo chmod 600 /var/www/hudanhidayat/.env
```

---

## 📁 File Structure di Server

```
/var/www/hudanhidayat/
├── app.js                      # Main application
├── ecosystem.config.js         # PM2 config
├── package.json
├── .env                        # Environment variables (chmod 600)
├── node_modules/
├── public/
│   └── uploads/               # User uploaded files (chmod 775)
├── routes/
├── views/
├── logs/                      # PM2 logs
│   ├── out.log
│   ├── err.log
│   └── combined.log
├── schema.sql                 # Database schema
├── migration_stats.sql
├── migration_settings.sql
└── database_full.sql          # Full backup
```

---

## 🔄 Update Aplikasi (Setelah Deployment Pertama)

```bash
# Di lokal, upload file yang diupdate
rsync -avz --exclude 'node_modules' \
  /Users/tyayuwono/Documents/application/hudanhidayat/ \
  your-user@your-server-ip:/tmp/hudanhidayat/

# Di server
cd /var/www/hudanhidayat
sudo -u hudanhidayat pm2 stop hudanhidayat

# Backup dulu
sudo cp -r /var/www/hudanhidayat /var/backups/hudanhidayat-$(date +%F)

# Copy files baru
sudo cp -r /tmp/hudanhidayat/* /var/www/hudanhidayat/

# Install dependencies jika ada perubahan
sudo -u hudanhidayat npm install --production

# Restart
sudo -u hudanhidayat pm2 restart hudanhidayat
```

---

## 📞 Support

Jika ada masalah:
1. Cek PM2 logs: `sudo -u hudanhidayat pm2 logs`
2. Cek Nginx error log: `sudo tail -f /var/log/nginx/hudanhidayat-error.log`
3. Cek system logs: `sudo journalctl -u nginx -f`

---

**Good Luck! 🚀**
