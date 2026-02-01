export class UI {
    static showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container') || this.createNotificationContainer();

        const notif = document.createElement('div');
        notif.className = `notification notification-${type}`;
        notif.innerHTML = `
            <span class="notification-icon">${this.getIconForType(type)}</span>
            <span class="notification-message">${message}</span>
        `;

        container.appendChild(notif);

        // Enter animation
        requestAnimationFrame(() => notif.classList.add('visible'));

        // Remove after duration
        setTimeout(() => {
            notif.classList.remove('visible');
            setTimeout(() => notif.remove(), 300);
        }, duration);
    }

    static createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    static getIconForType(type) {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    }

    static shake(element) {
        element.classList.add('shake');
        element.addEventListener('animationend', () => {
            element.classList.remove('shake');
        }, { once: true });
    }

    static flipTile(tile, letter, status, delay = 0) {
        return new Promise(resolve => {
            setTimeout(() => {
                tile.classList.add('flipping');

                // Change content halfway through flip
                setTimeout(() => {
                    tile.textContent = letter;
                    tile.dataset.status = status;
                    tile.classList.remove('flipping');
                    tile.classList.add('revealed');
                    resolve();
                }, 250);
            }, delay);
        });
    }
}
