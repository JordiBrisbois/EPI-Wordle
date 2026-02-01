const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet, dbRun } = require('../database/db');
const CONFIG = require('../config/config');

exports.register = async (req, res) => {
    const { username, password } = req.body;

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!username || !password || !usernameRegex.test(username) || password.length < 4) {
        return res.status(400).json({
            error: 'Username (3-20 chars, alphanumeric only) et password (min 4 chars) requis'
        });
    }

    const existingUser = await dbGet('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
        return res.status(400).json({ error: 'Username deja utilise' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await dbRun(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hashedPassword]
    );

    const token = jwt.sign({ id: result.lastID, username }, CONFIG.JWT_SECRET, { expiresIn: CONFIG.AUTH.TOKEN_EXPIRY });

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: CONFIG.AUTH.COOKIE_MAX_AGE,
        sameSite: 'lax',
        path: '/'
    });

    res.status(201).json({
        success: true,
        user: { id: result.lastID, username },
        message: 'Inscription reussie !'
    });
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username et password requis' });
    }

    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);

    if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, CONFIG.JWT_SECRET, { expiresIn: CONFIG.AUTH.TOKEN_EXPIRY });

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: CONFIG.AUTH.COOKIE_MAX_AGE,
        sameSite: 'lax',
        path: '/'
    });

    res.json({
        success: true,
        user: {
            id: user.id,
            username: user.username,
            total_games: user.total_games,
            total_wins: user.total_wins,
            current_streak: user.current_streak,
            max_streak: user.max_streak,
            total_words_found: user.total_words_found
        },
        message: 'Connexion reussie !'
    });
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Deconnexion reussie' });
};

exports.getMe = async (req, res) => {
    if (!req.user) {
        return res.json({ user: null });
    }

    const user = await dbGet(
        'SELECT id, username, total_games, total_wins, current_streak, max_streak, total_words_found FROM users WHERE id = ?',
        [req.user.id]
    );

    // If user deleted but token valid
    if (!user) {
        res.clearCookie('token');
        return res.json({ user: null });
    }

    res.json({ user });
};
