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

    // 3. Log Page View
    if (req.method === 'GET' && !req.path.startsWith('/admin') && !req.path.startsWith('/auth') && !req.path.includes('.') && req.path !== '/favicon.ico') {
        const geo = geoip.lookup(ip);
        let country = geo ? geo.country : (ip === '::1' || ip === '127.0.0.1' ? 'ID' : null);
        let city = geo ? geo.city : (ip === '::1' || ip === '127.0.0.1' ? 'Local' : 'Unknown');

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

// Session Config
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret_key',
    resave: false,
    saveUninitialized: true
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
