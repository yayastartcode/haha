const express = require('express');
const router = express.Router();
const db = require('../config/database');

const categories = ['esai', 'novel', 'cerpen', 'puisi', 'dokumentasi', 'book', 'gallery'];

// Category View (View All)
router.get('/:category', async (req, res, next) => {
    const category = req.params.category.toLowerCase();

    // Check if valid category
    if (!categories.includes(category)) {
        return next(); // 404
    }

    try {
        let title = category.charAt(0).toUpperCase() + category.slice(1);
        let items;

        if (category === 'gallery') {
            [items] = await db.query('SELECT * FROM gallery ORDER BY created_at DESC');
        } else {
            [items] = await db.query('SELECT * FROM content_items WHERE category = ? ORDER BY created_at DESC', [category]);
        }

        res.render('category', {
            title,
            category,
            items,
            // SEO Data
            metaDesc: `Arsip dan kumpulan ${title} karya Hudan Hidayat.`,
            metaUrl: `http://hudanhidayat.com/${category}`
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Single Page View
router.get('/:category/:id', async (req, res, next) => {
    const category = req.params.category.toLowerCase();
    const id = req.params.id;

    if (!categories.includes(category)) {
        return next();
    }

    try {
        let item;
        if (category === 'gallery') {
            const [rows] = await db.query('SELECT * FROM gallery WHERE id = ?', [id]);
            item = rows[0];
            if (item) item.title = item.caption; // Normalize title
        } else {
            const [rows] = await db.query('SELECT * FROM content_items WHERE id = ? AND category = ?', [id, category]);
            item = rows[0];
        }

        if (!item) {
            return res.status(404).render('404', { url: req.originalUrl }); // Handle nicely if we had a 404 view, else default express error
        }

        res.render('single', {
            item,
            category,
            categoryTitle: category.charAt(0).toUpperCase() + category.slice(1),

            // SEO Data
            title: item.title || item.caption, // Override default title
            metaDesc: item.content ? item.content.replace(/<[^>]*>/g, '').substring(0, 160) : (item.caption || 'Karya Hudan Hidayat'),
            metaImage: item.image_url || 'http://hudanhidayat.com/images/tentang.jpeg',
            metaUrl: `http://hudanhidayat.com/${category}/${id}`
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
