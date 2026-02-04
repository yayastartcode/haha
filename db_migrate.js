require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true // Enable multiple statements for SQL scripts
});

async function runMigration(filename) {
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filename}`);
        return;
    }

    const sql = fs.readFileSync(filePath, 'utf8');

    try {
        console.log(`Running migration: ${filename}...`);
        await pool.query(sql);
        console.log(`Success: ${filename} applied.`);
    } catch (err) {
        console.error(`Error applying ${filename}:`, err.message);
    }
}

async function main() {
    try {
        // Run specific migrations
        await runMigration('migration_hero_slider.sql');

        // You can add others here if needed, e.g.:
        // await runMigration('migration_settings.sql');

        console.log('\nAll migrations processed.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
}

main();
