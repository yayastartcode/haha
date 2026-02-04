const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hudan_hidayat_db',
    waitForConnections: true,
    connectionLimit: 5, // Reduced from 10 to save memory
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

const db = pool.promise();
db.pool = pool; // Export pool separately for session store

module.exports = db;
