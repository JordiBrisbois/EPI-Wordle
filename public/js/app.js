// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const game = new WordleGame();
  let currentUser = null;
  
  // Load saved game or start new one
  if (!game.loadGameState()) {
    game.startNewGame();
  }
  
  // Check auth status
  checkAuthStatus();
  
  // Setup event listeners
  setupEventListeners();
  setupKeyboardListeners();
  
  // Initialize chat
  setupChat();
  loadChatMessages();
  
  // Start polling for chat messages every 3 seconds
  setInterval(loadChatMessages, 3000);
  
  // Auth status check
  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await response.json();
      
      if (data.user) {
        currentUser = data.user;
        updateAuthUI();
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  }
  
  // Event listeners
  function setupEventListeners() {
    // Modal controls
    document.getElementById('help-btn').addEventListener('click', () => openModal('help-modal'));
    const authBtn = document.getElementById('auth-btn');
    const registerBtn = document.getElementById('register-btn');
    
    if (authBtn) {
      authBtn.addEventListener('click', () => openModal('auth-modal', 'login'));
    }
    
    if (registerBtn) {
      registerBtn.addEventListener('click', () => openModal('auth-modal', 'register'));
    }
    document.getElementById('leaderboard-btn').addEventListener('click', () => {
      loadLeaderboard();
      openModal('leaderboard-modal');
    });
    
    // Profile button (only visible when logged in)
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => openModal('auth-modal', 'login'));
    }
    
    // Close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        closeModal(e.target.closest('.modal').id);
      });
    });
    
    // Close modal on background click
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal.id);
        }
      });
    });
    
    // Auth form toggles
    document.getElementById('show-register').addEventListener('click', (e) => {
      e.preventDefault();
      toggleAuthForm('register');
    });
    
    document.getElementById('show-login').addEventListener('click', (e) => {
      e.preventDefault();
      toggleAuthForm('login');
    });
    
    // Auth submissions
    document.getElementById('login-submit').addEventListener('click', handleLogin);
    document.getElementById('register-submit').addEventListener('click', handleRegister);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Game controls
    document.getElementById('new-game-btn').addEventListener('click', () => {
      game.startNewGame();
    });
    
    document.getElementById('share-btn').addEventListener('click', showShareModal);
    document.getElementById('copy-result-btn').addEventListener('click', copyResult);
    
    // Enter key on auth inputs
    document.getElementById('login-password').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
    
    document.getElementById('register-password').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleRegister();
    });
  }
  
  // Keyboard listeners for physical keyboard
  function setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
      // Ignore if typing in input fields
      if (e.target.tagName === 'INPUT') return;
      
      const key = e.key;
      
      if (key === 'Enter') {
        e.preventDefault();
        game.handleKeyInput('ENTER');
      } else if (key === 'Backspace') {
        e.preventDefault();
        game.handleKeyInput('BACKSPACE');
      } else if (/^[a-zA-Z]$/.test(key)) {
        e.preventDefault();
        game.handleKeyInput(key);
      }
    });
  }
  
  // Modal functions
  function openModal(modalId, authType = null) {
    console.log(`Opening modal: ${modalId}, authType: ${authType}`);
    document.getElementById(modalId).classList.add('show');
    
    if (modalId === 'auth-modal') {
      console.log(`Updating auth UI with type: ${authType}`);
      updateAuthUI(authType);
    }
  }
  
  function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
  }
  
  // Auth functions
  function toggleAuthForm(type) {
    if (type === 'register') {
      document.getElementById('login-form').style.display = 'none';
      document.getElementById('register-form').style.display = 'block';
    } else {
      document.getElementById('login-form').style.display = 'block';
      document.getElementById('register-form').style.display = 'none';
    }
  }
  
  function updateAuthUI(authType = null) {
    const authForms = document.getElementById('auth-forms');
    const userInfo = document.getElementById('user-info');
    const authButtons = document.querySelectorAll('.auth-buttons');
    const userProfile = document.querySelector('.user-profile');
    
    if (currentUser) {
      authForms.style.display = 'none';
      userInfo.style.display = 'block';
      
      // Masquer boutons inscription/connexion, afficher profil
      authButtons.forEach(btn => btn.style.display = 'none');
      if (userProfile) userProfile.style.display = 'block';
      
      // Show user stats
      const statsHtml = `
        <div class="stat-item">
          <span class="stat-label">Nom d'utilisateur</span>
          <span class="stat-value">${currentUser.username}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Parties jouees</span>
          <span class="stat-value">${currentUser.total_games || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Victoires</span>
          <span class="stat-value">${currentUser.total_wins || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Serie actuelle</span>
          <span class="stat-value">${currentUser.current_streak || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Meilleure serie</span>
          <span class="stat-value">${currentUser.max_streak || 0}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Mots trouves</span>
          <span class="stat-value">${currentUser.total_words_found || 0}</span>
        </div>
      `;
      
      document.getElementById('user-stats').innerHTML = statsHtml;
    } else {
      authForms.style.display = 'block';
      userInfo.style.display = 'none';
      
      // Si authType est spécifié, utiliser celui-ci, sinon défaut sur login
      toggleAuthForm(authType || 'login');
      
      // Afficher boutons inscription/connexion, masquer profil
      authButtons.forEach(btn => btn.style.display = 'block');
      if (userProfile) userProfile.style.display = 'none';
    }
  }
  
  async function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
      showNotification('Veuillez remplir tous les champs', 'error');
      return;
    }
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        currentUser = data.user;
        updateAuthUI();
        showNotification('Connexion réussie !', 'success');
        closeModal('auth-modal');
      } else {
        showNotification(data.error || 'Erreur de connexion', 'error');
      }
    } catch (error) {
      showNotification('Erreur réseau', 'error');
    }
  }
  
  async function handleRegister() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    
    if (!username || !password) {
      showNotification('Veuillez remplir tous les champs', 'error');
      return;
    }
    
    if (username.length < 3) {
      showNotification('Nom d\'utilisateur trop court (min 3 caractères)', 'error');
      return;
    }
    
    if (password.length < 4) {
      showNotification('Mot de passe trop court (min 4 caractères)', 'error');
      return;
    }
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        currentUser = data.user;
        updateAuthUI();
        showNotification('Inscription réussie !', 'success');
        closeModal('auth-modal');
      } else {
        showNotification(data.error || 'Erreur d\'inscription', 'error');
      }
    } catch (error) {
      showNotification('Erreur réseau', 'error');
    }
  }
  
  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      currentUser = null;
      updateAuthUI();
      showNotification('Déconnexion réussie', 'success');
      closeModal('auth-modal');
    } catch (error) {
      showNotification('Erreur lors de la déconnexion', 'error');
    }
  }
  
  // Leaderboard
  async function loadLeaderboard() {
    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      
      const tbody = document.getElementById('leaderboard-body');
      tbody.innerHTML = '';
      
      if (data.leaderboard.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Aucune donnée disponible</td></tr>';
        return;
      }
      
      data.leaderboard.forEach((player, index) => {
        const row = document.createElement('tr');
        const winRate = player.win_rate ? Math.round(player.win_rate) : 0;
        
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${player.username}</td>
          <td>${player.total_games}</td>
          <td>${winRate}%</td>
          <td>${player.max_streak}</td>
          <td>${player.total_words_found}</td>
        `;
        
        tbody.appendChild(row);
      });
    } catch (error) {
      console.error('Leaderboard error:', error);
    }
  }
  
  // Share functionality
  function showShareModal() {
    const shareText = game.getShareText();
    document.getElementById('share-content').textContent = shareText;
    openModal('share-modal');
  }
  
  async function copyResult() {
    const shareText = game.getShareText();
    
    try {
      await navigator.clipboard.writeText(shareText);
      showNotification('Résultat copié !', 'success');
      closeModal('share-modal');
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showNotification('Résultat copié !', 'success');
      closeModal('share-modal');
    }
  }
  
  // Notification system
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: ${type === 'error' ? '#ff4444' : type === 'success' ? '#538d4e' : '#818384'};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 9999;
      animation: slideDown 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideUp 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  // Chat functionality
  let lastMessageCount = 0;
  
  function setupChat() {
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatAuthBtn = document.getElementById('chat-auth-btn');
    
    // Add welcome message
    addChatMessage('system', 'Bienvenue dans le chat EPI-Wordle ! Echangez avec les autres joueurs ici.', 'Systeme', new Date().toLocaleTimeString());
    
    // Handle send button click
    if (chatSendBtn) {
      chatSendBtn.addEventListener('click', async () => {
        if (!currentUser) {
          showNotification('Veuillez vous connecter pour envoyer des messages', 'error');
          return;
        }
        
        const message = chatInput.value.trim();
        if (!message) return;
        
        try {
          const response = await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ message })
          });
          
          if (response.ok) {
            chatInput.value = '';
            loadChatMessages();
          } else {
            const data = await response.json();
            showNotification(data.error || 'Erreur lors de l\'envoi du message', 'error');
          }
        } catch (error) {
          showNotification('Erreur reseau', 'error');
        }
      });
    }
    
    // Handle Enter key on chat input
    if (chatInput) {
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (chatSendBtn) chatSendBtn.click();
        }
      });
    }
    
    // Handle chat auth button
    if (chatAuthBtn) {
      chatAuthBtn.addEventListener('click', () => {
        openModal('auth-modal', 'login');
      });
    }
    
    updateChatInputState();
  }
  
  async function loadChatMessages() {
    try {
      const response = await fetch('/api/chat/messages');
      const data = await response.json();
      
      if (data.messages && data.messages.length !== lastMessageCount) {
        // Filter out messages containing HTML/script tags
        const validMessages = data.messages.filter(msg => {
          if (!msg || typeof msg.message !== 'string') return false;
          // Check if message contains HTML-like content
          const hasHtml = /<[^>]*>/g.test(msg.message);
          return !hasHtml;
        });
        displayChatMessages(validMessages);
        lastMessageCount = data.messages.length;
      }
    } catch (error) {
      console.error('Chat load error:', error);
    }
  }
  
  function displayChatMessages(messages) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Store scroll position
    const isAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop <= chatMessages.clientHeight + 50;
    
    chatMessages.innerHTML = '';
    
    messages.forEach((msg, index) => {
      // Check if it's a user message (has username) or system message
      const isUserMessage = msg.username && msg.username !== 'Systeme' && msg.username !== 'Serveur';
      addChatMessage(
        isUserMessage ? 'user' : 'system',
        msg.message,
        msg.username || 'Systeme',
        msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '',
        index
      );
    });
    
    // Auto-scroll to bottom if user was at bottom
    if (isAtBottom) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
  
  async function deleteChatMessage(index) {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`/api/chat/message/${index}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        loadChatMessages();
      } else {
        const data = await response.json();
        showNotification(data.error || 'Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      showNotification('Erreur reseau', 'error');
    }
  }
  
  function addChatMessage(type, message, username, timestamp, messageIndex = null) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${type}`;
    msgDiv.dataset.index = messageIndex;
    
    if (type === 'system') {
      msgDiv.innerHTML = `
        <div class="chat-message-content system-message">
          <span class="message-text">${escapeHtml(message)}</span>
          <span class="message-time">${timestamp}</span>
        </div>
      `;
    } else {
      const isCurrentUser = currentUser && username === currentUser.username;
      const deleteButton = isCurrentUser ? `<button class="delete-message-btn" title="Supprimer">×</button>` : '';
      msgDiv.innerHTML = `
        <div class="chat-message-content ${isCurrentUser ? 'own-message' : ''}">
          <span class="message-author">${escapeHtml(username)}</span>
          <span class="message-text">${escapeHtml(message)}</span>
          <span class="message-time">${timestamp}</span>
          ${deleteButton}
        </div>
      `;
      
      // Add delete functionality
      if (isCurrentUser) {
        const deleteBtn = msgDiv.querySelector('.delete-message-btn');
        if (deleteBtn && messageIndex !== null) {
          deleteBtn.addEventListener('click', () => deleteChatMessage(messageIndex));
        }
      }
    }
    
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  function updateChatInputState() {
    const chatInputWrapper = document.getElementById('chat-input-wrapper');
    const loginPrompt = document.getElementById('chat-login-prompt');
    
    if (!loginPrompt) return;
    
    if (currentUser) {
      loginPrompt.style.display = 'none';
      if (chatInputWrapper) chatInputWrapper.style.display = 'flex';
    } else {
      loginPrompt.style.display = 'block';
      if (chatInputWrapper) chatInputWrapper.style.display = 'none';
    }
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Override updateAuthUI to also update chat state
  const originalUpdateAuthUI = updateAuthUI;
  updateAuthUI = function(authType = null) {
    originalUpdateAuthUI(authType);
    updateChatInputState();
  };
});

// Add slide animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from { transform: translate(-50%, -100%); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translate(-50%, 0); opacity: 1; }
    to { transform: translate(-50%, -100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
