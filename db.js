const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'weather.db');

async function initDB() {
    const SQL = await initSqlJs();
    let db;
    if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }

    db.run('PRAGMA foreign_keys = ON');

    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS favorite_cities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        city_name TEXT NOT NULL,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    const userCount = db.exec("SELECT COUNT(*) FROM users")[0].values[0][0];
    if (userCount === 0) {
        const bcrypt = require('bcryptjs');
        const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
        db.run("INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)", ['admin', hash]);
    }

    const save = () => {
        const data = db.export();
        fs.writeFileSync(DB_PATH, Buffer.from(data));
    };
    save();

    return {
        db,
        getAsync(sql, params = []) {
            const stmt = db.prepare(sql);
            if (params.length) stmt.bind(params);
            let row = null;
            if (stmt.step()) row = stmt.getAsObject();
            stmt.free();
            return row;
        },
        allAsync(sql, params = []) {
            const stmt = db.prepare(sql);
            if (params.length) stmt.bind(params);
            const rows = [];
            while (stmt.step()) rows.push(stmt.getAsObject());
            stmt.free();
            return rows;
        },
        runAsync(sql, params = []) {
            db.run(sql, params);
            save();
            return { changes: db.getRowsModified() };
        }
    };
}

module.exports = { initDB };