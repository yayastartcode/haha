const mysql = require('mysql2');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function updatePassword() {
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);

    pool.execute('UPDATE users SET password_hash = ? WHERE username = ?', [hash, 'admin'], (err, results) => {
        if (err) {
            console.error(err);
        } else {
            console.log('Password updated successfully for user "admin". New password: ' + password);
        }
        pool.end();
    });
}

updatePassword();
