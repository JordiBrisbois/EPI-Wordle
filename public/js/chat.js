import { API } from './api.js';
import { UI } from './ui.js';

export class Chat {
    constructor() {
        this.container = document.getElementById('chat-messages');
        this.input = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('chat-send-btn');
        this.loginPrompt = document.getElementById('chat-login-prompt');
        this.inputWrapper = document.getElementById('chat-input-wrapper');

        this.setupListeners();
        this.startPolling();
    }

    setupListeners() {
        this.sendBtn.onclick = () => this.sendMessage();
        this.input.onkeypress = (e) => {
            if (e.key === 'Enter') this.sendMessage();
        };

        // Listen for auth events
        window.addEventListener('auth:login', () => this.updateAuthUI(true));
        window.addEventListener('auth:logout', () => this.updateAuthUI(false));
    }

    updateAuthUI(isAuthenticated) {
        if (isAuthenticated) {
            this.loginPrompt.style.display = 'none';
            this.inputWrapper.style.display = 'flex';
        } else {
            this.loginPrompt.style.display = 'block';
            this.inputWrapper.style.display = 'none';
        }
    }

    async sendMessage() {
        const msg = this.input.value.trim();
        if (!msg) return;

        try {
            await API.sendMessage(msg);
            this.input.value = '';
            this.fetchMessages();
        } catch (error) {
            UI.showNotification(error.message, 'error');
        }
    }

    async fetchMessages() {
        try {
            const data = await API.getMessages();
            this.renderMessages(data.messages);
        } catch (e) {
            console.error('Chat error', e);
        }
    }

    renderMessages(messages) {
        // Prevent re-render if messages are identical (avoids blinking)
        const currentMessages = this.container.querySelectorAll('.chat-message');
        if (currentMessages.length === messages.length) {
            // Simple length check usually enough if no deletes, but let's be safe(r) by checking last timestamp
            const lastMsg = messages[messages.length - 1];
            const lastDomMsg = currentMessages[currentMessages.length - 1];
            if (lastMsg && lastDomMsg && lastDomMsg.innerHTML.includes(this.escapeHtml(lastMsg.message))) {
                return;
            }
        }

        const wasScrolledToBottom = this.container.scrollHeight - this.container.scrollTop === this.container.clientHeight;

        this.container.innerHTML = messages.map(msg => `
            <div class="chat-message ${msg.username === 'System' ? 'system' : ''}">
                <span class="chat-user">${msg.username}</span>
                <span class="chat-text">${this.escapeHtml(msg.message)}</span>
                <span class="chat-time">${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        `).join('');

        if (wasScrolledToBottom) {
            this.container.scrollTop = this.container.scrollHeight;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    startPolling() {
        this.fetchMessages();
        setInterval(() => this.fetchMessages(), 3000);
    }
}
