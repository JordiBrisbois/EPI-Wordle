const CONFIG = require('../config/config');

// In-memory chat storage as per requirements/simplicity
// Could be moved to DB later easily
const chatMessages = [];

exports.sendMessage = (req, res) => {
    // User guaranteed by middleware if we use authenticateToken
    if (!req.user) {
        return res.status(401).json({ error: 'Non autorise' });
    }

    const { message } = req.body;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message requis' });
    }

    if (message.length > CONFIG.CHAT.MAX_LENGTH) {
        return res.status(400).json({ error: `Message trop long (max ${CONFIG.CHAT.MAX_LENGTH} caracteres)` });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
        return res.status(400).json({ error: 'Message vide' });
    }

    const chatMessage = {
        username: req.user.username,
        message: trimmedMessage,
        timestamp: new Date().toISOString()
    };

    chatMessages.push(chatMessage);

    if (chatMessages.length > CONFIG.CHAT.MAX_MESSAGES) {
        chatMessages.shift();
    }

    res.json({ success: true, message: 'Message envoye' });
};

exports.getMessages = (req, res) => {
    res.json({ messages: chatMessages });
};

exports.clearMessages = (req, res) => {
    chatMessages.length = 0;
    res.json({ success: true, message: 'Chat cleared' });
};

exports.deleteMessage = (req, res) => {
    const index = parseInt(req.params.index);
    if (index >= 0 && index < chatMessages.length) {
        const msg = chatMessages[index];
        if (msg.username === req.user.username) {
            chatMessages.splice(index, 1);
            res.json({ success: true, message: 'Message deleted' });
        } else {
            res.status(403).json({ error: 'Unauthorized - can only delete own messages' });
        }
    } else {
        res.status(404).json({ error: 'Message not found' });
    }
};

// Internal method to add system messages
exports.addSystemMessage = (text) => {
    chatMessages.push({
        username: 'System',
        message: text,
        timestamp: new Date().toISOString()
    });
};
