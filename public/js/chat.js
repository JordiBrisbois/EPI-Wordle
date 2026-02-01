import { API } from './api.js';
import { UI } from './ui.js';

export class Chat {
    constructor() {
        this.container = document.getElementById('chat-messages');
        this.input = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('chat-send-btn');
        this.loginPrompt = document.getElementById('chat-login-prompt');
        this.inputWrapper = document.getElementById('chat-input-wrapper');
        this.currentUser = null;

        this.setupListeners();
        this.startPolling();
    }

    setupListeners() {
        this.sendBtn.onclick = () => this.sendMessage();
        this.input.onkeypress = (e) => {
            if (e.key === 'Enter') this.sendMessage();
        };

        // Listen for auth events
        window.addEventListener('auth:login', (e) => {
            this.currentUser = e.detail;
            this.updateAuthUI(true);
        });
        window.addEventListener('auth:logout', () => {
            this.currentUser = null;
            this.updateAuthUI(false);
        });
    }

    updateAuthUI(isAuthenticated) {
        if (isAuthenticated) {
            this.loginPrompt.style.display = 'none';
            this.inputWrapper.style.display = 'flex';
        } else {
            this.loginPrompt.style.display = 'block';
            this.inputWrapper.style.display = 'none';
        }
        this.fetchMessages(); // Refresh to update delete buttons
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
            const lastMsg = messages[messages.length - 1];
            const lastDomMsg = currentMessages[currentMessages.length - 1];
            // Check content AND ID if available to be sure
            if (lastMsg && lastDomMsg && lastDomMsg.innerHTML.includes(this.escapeHtml(lastMsg.message))) {
                return;
            }
        }

        const wasScrolledToBottom = this.container.scrollHeight - this.container.scrollTop === this.container.clientHeight;

        this.container.innerHTML = messages.map(msg => {
            const isSystem = msg.username === 'System';
            const canDelete = this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.username === msg.username);

            return `
            <div class="chat-message ${isSystem ? 'system' : ''}" data-id="${msg.id}">
                <div class="chat-header-line">
                    <span class="chat-user">${msg.username}</span>
                    <span class="chat-time">${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    ${canDelete && !isSystem ? `<button class="chat-delete-btn" onclick="window.deleteChatMessage('${msg.id}')" title="Supprimer">×</button>` : ''}
                </div>
                <span class="chat-text">${this.escapeHtml(msg.message)}</span>
            </div>
            `;
        }).join('');

        if (wasScrolledToBottom) {
            this.container.scrollTop = this.container.scrollHeight;
        }

        // Attach global delete handler if not exists
        if (!window.deleteChatMessage) {
            window.deleteChatMessage = async (id) => {
                if (!confirm('Supprimer ce message ?')) return;
                try {
                    await API.deleteMessage(id);
                    this.fetchMessages();
                } catch (e) {
                    UI.showNotification(e.message, 'error');
                }
            };
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
