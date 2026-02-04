const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');

// Middleware to check authentication
const checkAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/auth/login');
    }
    next();
};

router.use(checkAuth);

router.get('/', async (req, res) => {
    try {
        // 1. Content Counts
        const [esai] = await db.query('SELECT COUNT(*) as c FROM content_items WHERE category = "esai"');
        const [novel] = await db.query('SELECT COUNT(*) as c FROM content_items WHERE category = "novel"');

        // 2. Traffic Stats
        const [totalViews] = await db.query('SELECT COUNT(*) as c FROM page_views');

        // Today's Views
        const [todayViews] = await db.query('SELECT COUNT(*) as c FROM page_views WHERE DATE(created_at) = CURDATE()');

        // Top Pages (Include all)
        const [topPages] = await db.query(`
            SELECT path, COUNT(*) as views 
            FROM page_views 
            GROUP BY path 
            ORDER BY views DESC 
            LIMIT 5
        `);

        // Chart Data (Last 7 Days)
        const [chartData] = await db.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM page_views 
            WHERE created_at >= DATE(NOW()) - INTERVAL 7 DAY 
            GROUP BY DATE(created_at) 
            ORDER BY date ASC
        `);

        // Location Stats (Show City, Country or just Country if city unknown)
        const [locations] = await db.query(`
            SELECT 
                CASE 
                    WHEN city IS NOT NULL AND city != 'Unknown' THEN CONCAT(city, ', ', COALESCE(country, ''))
                    WHEN country IS NOT NULL THEN country
                    ELSE 'Unknown Location'
                END as location,
                COUNT(*) as count 
            FROM page_views 
            WHERE city IS NOT NULL 
                AND city != 'Unknown' 
                AND city != 'Local'
                AND country IS NOT NULL
            GROUP BY location 
            ORDER BY count DESC 
            LIMIT 5
        `);

        res.render('admin/dashboard', {
            title: 'Dashboard',
            esaiCount: esai[0].c,
            novelCount: novel[0].c,
            stats: {
                total: totalViews[0].c,
                today: todayViews[0].c,
                topPages,
                locations,
                chartLabels: chartData.map(d => new Date(d.date).toLocaleDateString('id-ID')),
                chartValues: chartData.map(d => d.count)
            }
        });
    } catch (err) {
        console.error(err);
        res.render('admin/dashboard', { title: 'Dashboard', esaiCount: 0, novelCount: 0, stats: null });
    }
});

// === Dynamic Routes for Text Content ===
const categories = ['esai', 'novel', 'cerpen', 'puisi', 'dokumentasi'];
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });

categories.forEach(category => {
    // List Items
    router.get(`/${category}`, async (req, res) => {
        const [items] = await db.query(
            'SELECT * FROM content_items WHERE category = ? ORDER BY created_at DESC',
            [category]
        );
        res.render('admin/list', {
            title: `Manage ${category.charAt(0).toUpperCase() + category.slice(1)}`,
            items,
            basePath: `/admin/${category}`,
            createLink: `/admin/${category}/create`
        });
    });

    // Create Form
    router.get(`/${category}/create`, (req, res) => {
        res.render('admin/edit', {
            title: `Add New ${category.charAt(0).toUpperCase() + category.slice(1)}`,
            action: `/admin/${category}/create`,
            category: category,
            item: null
        });
    });

    // Handle Creation
    router.post(`/${category}/create`, upload.single('image'), async (req, res) => {
        const { title, content } = req.body;
        await db.query(
            'INSERT INTO content_items (category, title, content, image_url) VALUES (?, ?, ?, ?)',
            [category, title, content, req.file ? '/uploads/' + req.file.filename : null]
        );
        res.redirect(`/admin/${category}`);
    });

    // Edit Form
    router.get(`/${category}/edit/:id`, async (req, res) => {
        const [rows] = await db.query('SELECT * FROM content_items WHERE id = ? AND category = ?', [req.params.id, category]);
        if (rows.length === 0) return res.redirect(`/admin/${category}`);

        res.render('admin/edit', {
            title: `Edit ${category.charAt(0).toUpperCase() + category.slice(1)}`,
            action: `/admin/${category}/edit/${req.params.id}`,
            category: category,
            item: rows[0]
        });
    });

    // Handle Update
    router.post(`/${category}/edit/:id`, upload.single('image'), async (req, res) => {
        const { title, content } = req.body;
        const id = req.params.id;

        // Get current image to keep it if not replaced
        const [current] = await db.query('SELECT image_url FROM content_items WHERE id = ?', [id]);
        let imageUrl = current[0]?.image_url;

        if (req.file) {
            imageUrl = '/uploads/' + req.file.filename;
        }

        await db.query(
            'UPDATE content_items SET title = ?, content = ?, image_url = ? WHERE id = ? AND category = ?',
            [title, content, imageUrl, id, category]
        );
        res.redirect(`/admin/${category}`);
    });

    // Handle Delete
    router.get(`/${category}/delete/:id`, async (req, res) => {
        await db.query('DELETE FROM content_items WHERE id = ? AND category = ?', [req.params.id, category]);
        res.redirect(`/admin/${category}`);
    });
});

// === Books Routes (Separate because it might have distinct fields in future, but keeping fit for now) ===
router.get('/books', async (req, res) => {
    const [items] = await db.query('SELECT * FROM content_items WHERE category = "book" ORDER BY created_at DESC');
    res.render('admin/list', {
        title: 'Manage Books',
        items,
        basePath: '/admin/books',
        createLink: '/admin/books/create'
    });
});

router.get('/books/create', (req, res) => {
    res.render('admin/edit', {
        title: 'Add New Book',
        action: '/admin/books/create',
        category: 'book',
        item: null
    });
});

router.post('/books/create', upload.single('image'), async (req, res) => {
    const { title, content } = req.body;
    await db.query(
        'INSERT INTO content_items (category, title, content, image_url) VALUES (?, ?, ?, ?)',
        ['book', title, content, req.file ? '/uploads/' + req.file.filename : null]
    );
    res.redirect('/admin/books');
});

// Edit Book
router.get('/books/edit/:id', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM content_items WHERE id = ? AND category = "book"', [req.params.id]);
    if (rows.length === 0) return res.redirect('/admin/books');

    res.render('admin/edit', {
        title: 'Edit Book',
        action: `/admin/books/edit/${req.params.id}`,
        category: 'book',
        item: rows[0]
    });
});

router.post('/books/edit/:id', upload.single('image'), async (req, res) => {
    const { title, content } = req.body;
    const id = req.params.id;

    const [current] = await db.query('SELECT image_url FROM content_items WHERE id = ?', [id]);
    let imageUrl = current[0]?.image_url;

    if (req.file) {
        imageUrl = '/uploads/' + req.file.filename;
    }

    await db.query(
        'UPDATE content_items SET title = ?, content = ?, image_url = ? WHERE id = ? AND category = "book"',
        [title, content, imageUrl, id]
    );
    res.redirect('/admin/books');
});

router.get('/books/delete/:id', async (req, res) => {
    await db.query('DELETE FROM content_items WHERE id = ? AND category = "book"', [req.params.id]);
    res.redirect('/admin/books');
});

// === Gallery Routes ===
router.get('/gallery', async (req, res) => {
    const [items] = await db.query('SELECT * FROM gallery ORDER BY created_at DESC');
    // Re-use list template but might need tweaking if gallery has different fields
    // For now, let's map gallery items to appear like content items (title -> caption)
    const formattedItems = items.map(item => ({
        id: item.id,
        title: item.caption || 'No Caption',
        created_at: item.created_at,
        category: 'gallery'
    }));

    res.render('admin/list', {
        title: 'Manage Gallery',
        items: formattedItems,
        basePath: '/admin/gallery',
        createLink: '/admin/gallery/create'
    });
});

router.get('/gallery/create', (req, res) => {
    // Re-use edit template but we only need Image and Caption (Title)
    res.render('admin/edit', {
        title: 'Add New Photo',
        action: '/admin/gallery/create',
        category: 'gallery',
        item: null
    });
});

router.post('/gallery/create', upload.single('image'), async (req, res) => {
    const { title } = req.body; // Using 'title' input for caption
    await db.query(
        'INSERT INTO gallery (image_url, caption) VALUES (?, ?)',
        [req.file ? '/uploads/' + req.file.filename : null, title]
    );
    res.redirect('/admin/gallery');
});

// Edit Gallery
router.get('/gallery/edit/:id', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM gallery WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.redirect('/admin/gallery');

    const item = rows[0];
    // Mock item structure for edit view
    const viewItem = {
        id: item.id,
        title: item.caption, // Map caption to title for form
        content: '', // No content
        image_url: item.image_url
    };

    res.render('admin/edit', {
        title: 'Edit Photo',
        action: `/admin/gallery/edit/${req.params.id}`,
        category: 'gallery',
        item: viewItem
    });
});

router.post('/gallery/edit/:id', upload.single('image'), async (req, res) => {
    const { title } = req.body; // title field maps to caption
    const id = req.params.id;

    const [current] = await db.query('SELECT image_url FROM gallery WHERE id = ?', [id]);
    let imageUrl = current[0]?.image_url;

    if (req.file) {
        imageUrl = '/uploads/' + req.file.filename;
    }

    await db.query(
        'UPDATE gallery SET caption = ?, image_url = ? WHERE id = ?',
        [title, imageUrl, id]
    );
    res.redirect('/admin/gallery');
});

router.get('/gallery/delete/:id', async (req, res) => {
    await db.query('DELETE FROM gallery WHERE id = ?', [req.params.id]);
    res.redirect('/admin/gallery');
});

// === Biography Route (Singleton) ===
router.get('/biography', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM content_items WHERE category = "biography" LIMIT 1');
    let item = rows[0];

    // If no biography exists, create default (though init script should have done this)
    if (!item) {
        // Fallback rendered if database is empty 
        item = { title: 'Tentang', content: '', image_url: '' };
    }

    res.render('admin/edit', {
        title: 'Edit Biography',
        action: '/admin/biography', // Post to same URL
        category: 'biography',
        item: item // Pass the existing item to populate form
    });
});

router.post('/biography', upload.single('image'), async (req, res) => {
    const { title, content } = req.body;
    const [rows] = await db.query('SELECT * FROM content_items WHERE category = "biography" LIMIT 1');

    if (rows.length > 0) {
        // Update existing
        let imageUrl = rows[0].image_url;
        if (req.file) {
            imageUrl = '/uploads/' + req.file.filename;
        }
        await db.query(
            'UPDATE content_items SET title = ?, content = ?, image_url = ? WHERE category = "biography"',
            [title, content, imageUrl]
        );
    } else {
        // Insert new (should rarely happen if initialized)
        await db.query(
            'INSERT INTO content_items (category, title, content, image_url) VALUES (?, ?, ?, ?)',
            ['biography', title, content, req.file ? '/uploads/' + req.file.filename : null]
        );
    }
    res.redirect('/admin/biography'); // Reload the edit page
});

// ... (add routes before module.exports)

// === User Management ===
router.get('/users', async (req, res) => {
    const [users] = await db.query('SELECT id, username, created_at FROM users ORDER BY created_at DESC');
    res.render('admin/users_list', { title: 'Manage Users', users });
});

router.get('/users/create', (req, res) => {
    res.render('admin/users_create', { title: 'Add New User', error: null });
});

router.post('/users/create', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hashedPassword]);
        res.redirect('/admin/users');
    } catch (err) {
        console.error(err);
        res.render('admin/users_create', { title: 'Add New User', error: 'Error creating user. Username might exist.' });
    }
});

// === Change Password ===
router.get('/password', (req, res) => {
    res.render('admin/password', { title: 'Change Password', error: null, success: null });
});

router.post('/password', async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.session.userId;

    if (newPassword !== confirmPassword) {
        return res.render('admin/password', { title: 'Change Password', error: 'New passwords do not match.', success: null });
    }

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        const user = rows[0];

        const match = await bcrypt.compare(currentPassword, user.password_hash);
        if (!match) {
            return res.render('admin/password', { title: 'Change Password', error: 'Current password is incorrect.', success: null });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);

        res.render('admin/password', { title: 'Change Password', error: null, success: 'Password updated successfully.' });
    } catch (err) {
        console.error(err);
        res.render('admin/password', { title: 'Change Password', error: 'Server error.', success: null });
    }
});

// ... (add routes before module.exports)

// === User Management ===
router.get('/users', async (req, res) => {
    const [users] = await db.query('SELECT id, username, created_at FROM users ORDER BY created_at DESC');
    res.render('admin/users_list', { title: 'Manage Users', users });
});

router.get('/users/create', (req, res) => {
    res.render('admin/users_create', { title: 'Add New User', error: null });
});

router.post('/users/create', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hashedPassword]);
        res.redirect('/admin/users');
    } catch (err) {
        console.error(err);
        res.render('admin/users_create', { title: 'Add New User', error: 'Error creating user. Username might exist.' });
    }
});

// === Change Password ===
router.get('/password', (req, res) => {
    res.render('admin/password', { title: 'Change Password', error: null, success: null });
});

router.post('/password', async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.session.userId;

    if (newPassword !== confirmPassword) {
        return res.render('admin/password', { title: 'Change Password', error: 'New passwords do not match.', success: null });
    }

    try {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        const user = rows[0];

        const match = await bcrypt.compare(currentPassword, user.password_hash);
        if (!match) {
            return res.render('admin/password', { title: 'Change Password', error: 'Current password is incorrect.', success: null });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);

        res.render('admin/password', { title: 'Change Password', error: null, success: 'Password updated successfully.' });
    } catch (err) {
        console.error(err);
        res.render('admin/password', { title: 'Change Password', error: 'Server error.', success: null });
    }
});

// Site Settings
router.get('/settings', (req, res) => {
    res.render('admin/settings', {
        title: 'Settings',
        success: req.query.success === '1'
    });
});

router.post('/settings', async (req, res) => {
    try {
        const settings = req.body;

        for (const [key, value] of Object.entries(settings)) {
            await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', [key, value]);
        }

        res.redirect('/admin/settings?success=1');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;



