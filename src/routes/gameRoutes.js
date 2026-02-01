const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { authenticateToken } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// Public or optional auth
router.get('/dictionary/check/:word', asyncHandler(gameController.checkDictionary));
router.get('/leaderboard', asyncHandler(gameController.getLeaderboard));

// Requires/uses auth
router.post('/start', authenticateToken, asyncHandler(gameController.startGame));
router.get('/state', authenticateToken, asyncHandler(gameController.getGameState));
router.post('/guess', authenticateToken, asyncHandler(gameController.submitGuess));
router.get('/history', authenticateToken, asyncHandler(gameController.getHistory));

module.exports = router;
