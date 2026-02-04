# Hudan Hidayat - Personal Website

Personal literary website untuk Hudan Hidayat featuring essays, novels, short stories, poems, and galleries.

## 🚀 Features

- ✅ Content Management System (CMS)
- ✅ Admin Dashboard with Analytics
- ✅ Rich Text Editor (Quill.js)
- ✅ Image Upload & Gallery
- ✅ Books Management
- ✅ Biography Section
- ✅ Visitor Analytics & Stats
- ✅ News Ticker with Live Stats
- ✅ Responsive Design
- ✅ SEO Optimized

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Template Engine:** EJS
- **Authentication:** bcrypt, express-session
- **File Upload:** Multer
- **Styling:** Tailwind CSS
- **Process Manager:** PM2 (production)
- **Web Server:** Nginx (reverse proxy)

## 📋 Prerequisites

- Node.js 20.x or higher
- MySQL 8.x or higher
- Nginx (for production)
- PM2 (for production)

## 🔧 Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/hudanhidayat.git
cd hudanhidayat
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

```bash
cp .env.example .env
nano .env
```

Fill in your configuration:
```env
DB_PASSWORD=your_database_password
SESSION_SECRET=your_secure_session_secret
PORT=3000
NODE_ENV=development
```

### 4. Setup Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE hudan_hidayat_db;

# Import schema
mysql -u root -p hudan_hidayat_db < schema.sql
mysql -u root -p hudan_hidayat_db < migration_stats.sql
mysql -u root -p hudan_hidayat_db < migration_settings.sql

# Create admin user (password: admin123)
USE hudan_hidayat_db;
INSERT INTO users (username, password_hash, email, role) 
VALUES ('admin', '$2b$10$xK3Z8vQ.yxF4N8Z5rW4yOeQ3X7nH5bF2M1tP9qL4xJ6kR8sD0wE1Y', 'admin@hudanhidayat.com', 'admin');
```

### 5. Run Development Server

```bash
npm start
# or
node app.js
```

Visit: http://localhost:3000

## 📦 Production Deployment

See detailed deployment guide: [DEPLOYMENT.md](DEPLOYMENT.md)

Quick deployment to Ubuntu server:

```bash
# 1. Upload files
./upload-to-server.sh

# 2. SSH to server and run
sudo /tmp/hudanhidayat/deploy.sh
```

## 📁 Project Structure

```
hudanhidayat/
├── app.js                      # Main application
├── package.json               
├── ecosystem.config.js         # PM2 config
├── .env.example               # Environment template
├── routes/
│   ├── index.js               # Homepage routes
│   ├── content.js             # Content routes
│   ├── admin.js               # Admin routes
│   ├── auth.js                # Authentication
│   ├── books.js               # Books management
│   └── gallery.js             # Gallery management
├── views/
│   ├── index.ejs              # Homepage
│   ├── category.ejs           # Category page
│   ├── single.ejs             # Single content
│   ├── admin/                 # Admin panels
│   └── partials/              # Reusable components
├── public/
│   └── uploads/               # User uploads
├── schema.sql                 # Database schema
├── migration_stats.sql        # Analytics tables
└── migration_settings.sql     # Settings tables
```

## 🔐 Security

- ✅ Environment variables for sensitive data
- ✅ bcrypt for password hashing
- ✅ Session-based authentication
- ✅ SQL injection protection (parameterized queries)
- ✅ File upload validation
- ✅ Secure file permissions (production)

## 📊 Admin Panel

Access admin panel at: `/admin`

Default credentials:
- Username: `admin`
- Password: `admin123`

**⚠️ IMPORTANT:** Change password immediately after first login!

## 🤝 Contributing

This is a personal project. If you find bugs or have suggestions, please open an issue.

## 📝 License

Private project - All rights reserved

## 👤 Author

**Hudan Hidayat**

## 🙏 Acknowledgments

- Tailwind CSS
- Chart.js
- Quill.js
- Express.js community
