const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res) => {
    try {
        const [biography] = await db.query('SELECT * FROM content_items WHERE category = "biography" LIMIT 1');
        const [esais] = await db.query('SELECT * FROM content_items WHERE category = "esai" ORDER BY created_at DESC LIMIT 3');
        const [novels] = await db.query('SELECT * FROM content_items WHERE category = "novel" ORDER BY created_at DESC LIMIT 3');
        const [cerpens] = await db.query('SELECT * FROM content_items WHERE category = "cerpen" ORDER BY created_at DESC LIMIT 3');
        const [puisis] = await db.query('SELECT * FROM content_items WHERE category = "puisi" ORDER BY created_at DESC LIMIT 3');
        const [dokumentasis] = await db.query('SELECT * FROM content_items WHERE category = "dokumentasi" ORDER BY created_at DESC LIMIT 3');
        const [books] = await db.query('SELECT * FROM content_items WHERE category = "book" ORDER BY created_at DESC LIMIT 10'); // Fetch more for slider
        const [gallery] = await db.query('SELECT * FROM gallery ORDER BY created_at DESC LIMIT 5');

        res.render('index', {
            biography: biography[0] || null,
            esais,
            novels,
            cerpens,
            puisis,
            dokumentasis,
            books,
            gallery
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
