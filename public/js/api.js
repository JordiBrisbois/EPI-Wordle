export class API {
    static async request(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const config = { ...defaultOptions, ...options };

        try {
            const response = await fetch(`/api${endpoint}`, config);

            // Handle unauthorized (session expired)
            if (response.status === 401 && !endpoint.includes('/auth/')) {
                window.dispatchEvent(new CustomEvent('auth:expired'));
                throw new Error('Session expiree');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Une erreur est survenue');
            }

            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // Auth
    static login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    static register(username, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    static logout() {
        return this.request('/auth/logout', { method: 'POST' });
    }

    static getMe() {
        return this.request('/auth/me');
    }

    static deleteMessage(id) {
        return this.request(`/chat/delete/${id}`, { method: 'DELETE' });
    }

    // Game
    static startGame() {
        return this.request('/game/start', { method: 'POST' });
    }

    static getGameState(gameId) {
        return this.request(`/game/state?gameId=${gameId}`);
    }

    static submitGuess(gameId, guess) {
        return this.request('/game/guess', {
            method: 'POST',
            body: JSON.stringify({ gameId, guess })
        });
    }

    static getLeaderboard() {
        return this.request('/game/leaderboard');
    }

    // Chat
    static getMessages() {
        return this.request('/chat/messages');
    }

    static sendMessage(message) {
        return this.request('/chat/send', {
            method: 'POST',
            body: JSON.stringify({ message })
        });
    }
}
