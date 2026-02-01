const jwt = require('jsonwebtoken');
const CONFIG = require('../config/config');

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Non autorise' });
    }
    next();
};

module.exports = { authenticateToken, requireAuth };
