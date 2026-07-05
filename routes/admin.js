const express = require('express');
const router = express.Router();

function ensureAdmin(req, res, next) {
    if (req.session.user && req.session.user.is_admin) return next();
    res.redirect('/login');
}

router.get('/admin', ensureAdmin, async (req, res) => {
    const users = await req.db.allAsync(
        'SELECT id, username, is_admin, created_at FROM users'
    );
    res.render('admin', { title: 'Админ-панель', users });
});

router.get('/admin/users/:id/favorites', ensureAdmin, async (req, res) => {
    const user = await req.db.getAsync('SELECT id, username FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).send('Пользователь не найден');
    const cities = await req.db.allAsync(
        'SELECT * FROM favorite_cities WHERE user_id = ?',
        [req.params.id]
    );
    res.render('user_favorites', { title: `Избранное ${user.username}`, user, cities });
});

router.post('/admin/users/:id/delete', ensureAdmin, async (req, res) => {
    await req.db.runAsync('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.redirect('/admin');
});

module.exports = router;