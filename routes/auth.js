const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

router.get('/register', (req, res) => {
    res.render('register', { title: 'Регистрация', error: null });
});

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.render('register', { title: 'Регистрация', error: 'Заполните все поля' });
    }
    try {
        const hash = bcrypt.hashSync(password, 10);
        await req.db.runAsync('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash]);
        res.redirect('/login');
    } catch (e) {
        res.render('register', { title: 'Регистрация', error: 'Пользователь уже существует' });
    }
});

router.get('/login', (req, res) => {
    res.render('login', { title: 'Вход', error: null });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await req.db.getAsync('SELECT * FROM users WHERE username = ?', [username]);
    if (user && bcrypt.compareSync(password, user.password_hash)) {
        req.session.user = { id: user.id, username: user.username, is_admin: user.is_admin };
        res.redirect('/');
    } else {
        res.render('login', { title: 'Вход', error: 'Неверное имя или пароль' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;