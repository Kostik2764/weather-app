require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { initDB } = require('./db');

const authRoutes = require('./routes/auth');
const weatherRoutes = require('./routes/weather');
const favoritesRoutes = require('./routes/favorites');
const adminRoutes = require('./routes/admin');

async function start() {
    const dbWrapper = await initDB();
    const app = express();

    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());
    app.use(session({
        secret: process.env.SESSION_SECRET || 'default_secret',
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 24 * 60 * 60 * 1000 }
    }));

    app.use(express.static(path.join(__dirname, 'public')));
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views', 'pages'));

    app.use((req, res, next) => {
        req.db = dbWrapper;
        next();
    });

    app.use((req, res, next) => {
        res.locals.user = req.session.user || null;
        next();
    });

    app.use('/', authRoutes);
    app.use('/', weatherRoutes);
    app.use('/', favoritesRoutes);
    app.use('/', adminRoutes);

    app.get('/', (req, res) => {
        if (!req.session.user) return res.redirect('/login');
        res.render('index', { title: 'Погода' });
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Сервер запущен: http://localhost:${PORT}`));
}

start().catch(console.error);