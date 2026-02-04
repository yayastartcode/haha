const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
});

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
    connection.query(schema, (err, results) => {
        if (err) {
            console.error('Error executing schema:', err);
        } else {
            console.log('Database initialized successfully');
        }
        connection.end();
    });
});
