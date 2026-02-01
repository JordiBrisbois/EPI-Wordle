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
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
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
    const id = req.params.id; // Correct param name matching route
    console.log('Attempting delete. ID requested:', id);
    console.log('Available IDs:', chatMessages.map(m => m.id));

    const msgIndex = chatMessages.findIndex(m => m.id === id);

    if (msgIndex !== -1) {
        const msg = chatMessages[msgIndex];

        // Allow if owner OR admin
        if (msg.username === req.user.username || req.user.role === 'admin') {
            chatMessages.splice(msgIndex, 1);
            res.json({ success: true, message: 'Message deleted' });
        } else {
            res.status(403).json({ error: 'Unauthorized' });
        }
    } else {
        res.status(404).json({ error: 'Message not found' });
    }
};

// Internal method to add system messages
exports.addSystemMessage = (text) => {
    chatMessages.push({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        username: 'System',
        message: text,
        timestamp: new Date().toISOString()
    });
};
