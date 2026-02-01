const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

// Public
router.get('/messages', chatController.getMessages);

// Private
router.post('/send', authenticateToken, chatController.sendMessage);
router.post('/clear', authenticateToken, chatController.clearMessages);
router.delete('/delete/:id', authenticateToken, chatController.deleteMessage);

module.exports = router;
