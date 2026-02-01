import { API } from './api.js';
import { Game } from './game.js';
import { Chat } from './chat.js';
import { UI } from './ui.js';

class App {
    constructor() {
        this.game = new Game();
        this.chat = new Chat();
        this.user = null;

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkAuth();

        // Start game if no active game
        if (!this.game.state.gameId) {
            // Auto start game
            this.game.startNewGame();
        }
    }

    setupEventListeners() {
        // UI Buttons
        document.getElementById('new-game-btn').onclick = () => this.game.startNewGame();

        // Auth Modals
        const authModal = document.getElementById('auth-modal');
        document.getElementById('auth-btn').onclick = () => {
            authModal.style.display = 'block';
            document.getElementById('login-form').style.display = 'block';
            document.getElementById('register-form').style.display = 'none';
        };

        document.getElementById('register-btn').onclick = () => {
            authModal.style.display = 'block';
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
        };

        // Close Modals
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
            };
        });

        // Auth Forms
        document.getElementById('login-submit').onclick = () => this.handleLogin();
        document.getElementById('register-submit').onclick = () => this.handleRegister();
        document.getElementById('logout-btn').onclick = () => this.handleLogout();

        // Switch Forms
        document.getElementById('show-register').onclick = (e) => {
            e.preventDefault();
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
        };
        document.getElementById('show-login').onclick = (e) => {
            e.preventDefault();
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        };

        // Chat auth button
        document.getElementById('chat-auth-btn').onclick = () => {
            document.getElementById('auth-btn').click();
        };

        // Leaderboard
        document.getElementById('leaderboard-btn').onclick = () => this.showLeaderboard();

        // Profile
        document.getElementById('profile-btn').onclick = () => {
            authModal.style.display = 'block';
            this.showProfile();
        };

        // Help
        document.getElementById('help-btn').onclick = () => {
            document.getElementById('help-modal').style.display = 'block';
        };
    }

    async checkAuth() {
        try {
            const data = await API.getMe();
            this.user = data.user;
            this.updateAuthUI();
        } catch (e) {
            this.user = null;
            this.updateAuthUI();
        }
    }

    updateAuthUI() {
        const isAuth = !!this.user;
        window.dispatchEvent(new CustomEvent(isAuth ? 'auth:login' : 'auth:logout', { detail: this.user }));

        document.querySelectorAll('.auth-buttons').forEach(el => el.style.display = isAuth ? 'none' : 'block');
        document.querySelectorAll('.user-profile').forEach(el => el.style.display = isAuth ? 'block' : 'none');

        if (isAuth) {
            document.getElementById('profile-btn').textContent = this.user.username;
        }
    }

    async handleLogin() {
        const user = document.getElementById('login-username').value;
        const pass = document.getElementById('login-password').value;

        try {
            const data = await API.login(user, pass);
            this.user = data.user;
            UI.showNotification(`Bonjour ${user} !`, 'success');
            document.getElementById('auth-modal').style.display = 'none';
            this.updateAuthUI();
        } catch (e) {
            UI.showNotification(e.message, 'error');
        }
    }

    async handleRegister() {
        const user = document.getElementById('register-username').value;
        const pass = document.getElementById('register-password').value;

        try {
            const data = await API.register(user, pass);
            this.user = data.user;
            UI.showNotification('Compte cree avec succes !', 'success');
            document.getElementById('auth-modal').style.display = 'none';
            this.updateAuthUI();
        } catch (e) {
            UI.showNotification(e.message, 'error');
        }
    }

    async handleLogout() {
        try {
            await API.logout();
            this.user = null;
            UI.showNotification('A bientot !');
            document.getElementById('auth-modal').style.display = 'none';
            this.updateAuthUI();
        } catch (e) {
            console.error(e);
        }
    }

    async showLeaderboard() {
        try {
            const data = await API.getLeaderboard();
            const tbody = document.getElementById('leaderboard-body');
            tbody.innerHTML = data.leaderboard.map((u, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${u.username}</td>
                    <td>${u.total_games}</td>
                    <td>${Math.round(u.win_rate)}%</td>
                    <td>${u.max_streak}</td>
                    <td>${u.total_words_found}</td>
                </tr>
            `).join('');
            document.getElementById('leaderboard-modal').style.display = 'block';
        } catch (e) {
            UI.showNotification('Impossible de charger le classement', 'error');
        }
    }

    showProfile() {
        const div = document.getElementById('user-info');
        const stats = document.getElementById('user-stats');
        document.getElementById('auth-forms').style.display = 'none';
        div.style.display = 'block';

        if (this.user) {
            stats.innerHTML = `
                <div class="stat-grid">
                    <div class="stat-item"><span class="stat-value">${this.user.total_games}</span><span class="stat-label">Parties</span></div>
                    <div class="stat-item"><span class="stat-value">${this.user.total_wins}</span><span class="stat-label">Victoires</span></div>
                    <div class="stat-item"><span class="stat-value">${this.user.current_streak}</span><span class="stat-label">Serie</span></div>
                    <div class="stat-item"><span class="stat-value">${this.user.total_words_found}</span><span class="stat-label">Mots</span></div>
                </div>
            `;
        }
    }
}

// Start App
window.addEventListener('DOMContentLoaded', () => {
    new App();
});
