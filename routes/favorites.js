const express = require('express');
const router = express.Router();

function ensureAuth(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/login');
}

router.get('/favorites', ensureAuth, async (req, res) => {
    const cities = await req.db.allAsync(
        'SELECT * FROM favorite_cities WHERE user_id = ?',
        [req.session.user.id]
    );
    res.render('favorites', { title: 'Избранное', cities });
});

router.post('/favorites', ensureAuth, async (req, res) => {
    const { city } = req.body;
    if (!city) return res.status(400).json({ error: 'Город не указан' });
    try {
        await req.db.runAsync(
            'INSERT INTO favorite_cities (user_id, city_name) VALUES (?, ?)',
            [req.session.user.id, city]
        );
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Ошибка базы данных' });
    }
});

router.delete('/favorites/:id', ensureAuth, async (req, res) => {
    await req.db.runAsync(
        'DELETE FROM favorite_cities WHERE id = ? AND user_id = ?',
        [req.params.id, req.session.user.id]
    );
    res.json({ success: true });
});

module.exports = router;