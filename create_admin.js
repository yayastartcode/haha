require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const askQuestion = (query) => {
    return new Promise(resolve => rl.question(query, resolve));
};

async function createAdmin() {
    try {
        console.log('--- Create New Admin User ---');
        const username = await askQuestion('Enter username: ');
        const password = await askQuestion('Enter password: ');

        if (!username || !password) {
            console.log('Username and password are required!');
            process.exit(1);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            [username, hashedPassword]
        );

        console.log(`\nSuccess! User '${username}' created.`);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            console.error('\nError: Username already exists!');
        } else {
            console.error('\nError:', err.message);
        }
    } finally {
        rl.close();
        pool.end();
    }
}

createAdmin();
