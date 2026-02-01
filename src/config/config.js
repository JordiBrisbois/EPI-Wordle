const path = require('path');

const CONFIG = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-prod', // Fallback for dev convenience
    DB_PATH: path.join(__dirname, '../../database/wordle.db'),

    GAME: {
        MAX_ATTEMPTS: 6,
        WORD_LENGTH: 5
    },

    CHAT: {
        MAX_MESSAGES: 50,
        MAX_LENGTH: 200
    },

    RATE_LIMIT: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 1000,
        AUTH_MAX_REQUESTS: 20 // Slightly increased from 5 to avoid frustration during testing
    },

    AUTH: {
        TOKEN_EXPIRY: '24h',
        COOKIE_MAX_AGE: 24 * 60 * 60 * 1000 // 24 hours
    }
};

module.exports = CONFIG;
