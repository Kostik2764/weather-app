const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

function ensureAuth(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/login');
}

router.get('/weather', ensureAuth, async (req, res) => {
    const city = req.query.city;
    if (!city) return res.json({ error: 'Город не указан' });
    try {
        const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${process.env.API_KEY}`;
        const geoResp = await fetch(geoUrl);
        const geoData = await geoResp.json();
        if (geoData.length === 0) return res.json({ error: 'Город не найден' });
        const { lat, lon } = geoData[0];

        const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.API_KEY}&units=metric&lang=ru`;
        const weatherResp = await fetch(weatherUrl);
        const weatherData = await weatherResp.json();
        res.json({
            city: weatherData.city.name,
            current: weatherData.list[0],
            forecast: weatherData.list.filter((_, i) => i % 8 === 0).slice(1, 6)
        });
    } catch (e) {
        res.json({ error: 'Ошибка получения данных' });
    }
});

module.exports = router;