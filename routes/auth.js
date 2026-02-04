const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');

router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.render('login', { error: 'Invalid username or password' });
        }
        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (match) {
            req.session.userId = user.id;
            req.session.isAdmin = true;
            req.session.save((err) => {
                if (err) {
                    console.error('Session Save Error:', err);
                    return res.status(500).send('Session Error');
                }
                res.redirect('/admin');
            });
        } else {
            res.render('login', { error: 'Invalid username or password' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
