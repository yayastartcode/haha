const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
require('dotenv').config();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// === Analytics & Online Tracker ===
const db = require('./config/database');
const geoip = require('geoip-lite'); // Added GeoIP
const onlineUsers = new Map();

app.use(async (req, res, next) => {
    // 1. Track Online Users
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    onlineUsers.set(ip, now);

    // Cleanup stale users
    for (const [key, lastActive] of onlineUsers.entries()) {
        if (now - lastActive > 5 * 60 * 1000) {
            onlineUsers.delete(key);
        }
    }

    res.locals.onlineUsersCount = onlineUsers.size;

    // 2. Fetch Global Stats for Ticker
    try {
        const [todayCount] = await db.query('SELECT COUNT(*) as c FROM page_views WHERE DATE(created_at) = CURDATE()');
        res.locals.todayViewsCount = todayCount[0].c;

        const [recent] = await db.query('SELECT city, path FROM page_views ORDER BY created_at DESC LIMIT 10');
        res.locals.recentViews = recent;
    } catch (err) {
        console.error('Ticker Data Error:', err);
        res.locals.todayViewsCount = 0;
        res.locals.recentViews = [];
    }

    // 3. Log Page View (with Bot & Debug Endpoint Filtering)

    // Blacklist: Bot scanning & debug endpoints to ignore
    const blacklistedPaths = [
        '/debug', '/telescope', '/actuator', '/api-docs', '/v2/api-docs', '/v3/api-docs',
        '/wp-admin', '/wp-login', '/xmlrpc.php', '/.env', '/.git',
        '/phpmyadmin', '/phpMyAdmin', '/pma', '/mysql',
        '/admin.php', '/login.php', '/config.php',
        '/.well-known/security.txt', '/robots.txt', '/sitemap.xml'
    ];

    // Bot user agents to ignore
    const botUserAgents = [
        'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python',
        'java', 'http', 'scanner', 'test', 'monitor', 'uptime'
    ];

    // Check if path is blacklisted
    const isBlacklisted = blacklistedPaths.some(blocked => req.path.toLowerCase().includes(blocked.toLowerCase()));

    // Check if user agent is bot
    const userAgent = (req.get('User-Agent') || '').toLowerCase();
    const isBot = botUserAgents.some(bot => userAgent.includes(bot));

    // Check if localhost/local IP
    const isLocalhost = ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.');

    // Only log legitimate traffic
    if (req.method === 'GET'
        && !req.path.startsWith('/admin')
        && !req.path.startsWith('/auth')
        && !req.path.includes('.')
        && req.path !== '/favicon.ico'
        && !isBlacklisted
        && !isBot
        && !isLocalhost) {

        const geo = geoip.lookup(ip);
        let country = geo ? geo.country : null;
        let city = geo ? geo.city : 'Unknown';

        db.query('INSERT INTO page_views (path, ip_address, user_agent, country, city) VALUES (?, ?, ?, ?, ?)',
            [req.path, ip, req.get('User-Agent'), country, city]).catch(err => console.error('Stats Error:', err));
    }

    // 4. Fetch Site Settings
    try {
        const [settingsRows] = await db.query('SELECT * FROM settings');
        const siteSettings = {};
        settingsRows.forEach(row => {
            siteSettings[row.setting_key] = row.setting_value;
        });
        res.locals.siteSettings = siteSettings;
    } catch (err) {
        console.error('Settings Error:', err);
        res.locals.siteSettings = {};
    }

    next();
});

// Session Config with MySQL Store (Production-Ready)
const MySQLStore = require('express-mysql-session')(session);

const sessionStore = new MySQLStore({
    clearExpired: true,
    checkExpirationInterval: 900000, // 15 minutes
    expiration: 86400000, // 24 hours
    createDatabaseTable: true, // Auto-create sessions table
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
}, db.pool);

app.use(session({
    key: 'hudanhidayat_session',
    secret: process.env.SESSION_SECRET || 'secret_key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 86400000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' // HTTPS only in production
    }
}));

// Routes
const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');
const contentRouter = require('./routes/content');

app.use('/admin', adminRouter);
app.use('/auth', authRouter);
app.use('/', contentRouter);
app.use('/', indexRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
