const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors'); // Security: Control cross-origin requests
const CONFIG = require('./config/config');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimit'); // Apply globally to API?

// Routes
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: true, // Allow all origins for local network play ease-of-use (or restrict to localhost/192.168.x.x for stricter security)
    credentials: true // Allow cookies
}));
app.use(express.static(path.join(__dirname, '../public')));

// Global Rate Limit
app.use('/api', generalLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/chat', chatRoutes);

// Error Handling
app.use(errorHandler);

module.exports = app;
