/**
 * EPI-Wordle Client Configuration
 * Only client-side settings - safe to expose
 */

const CONFIG = {
  // Game settings (used by browser)
  GAME: {
    MAX_ATTEMPTS: 6,
    WORD_LENGTH: 5,
    ANIMATION_DURATION: 300,
    MESSAGE_DURATION: 3000
  },

  // Chat settings (used by browser)
  CHAT: {
    MAX_MESSAGE_LENGTH: 200,
    POLL_INTERVAL: 3000
  },

  // Validation (used by browser for UI feedback only)
  VALIDATION: {
    MIN_USERNAME_LENGTH: 3,
    MIN_PASSWORD_LENGTH: 4
  }
};

// Note: Server-side config (rate limits, JWT expiry, etc.) is private
// and defined directly in server.js, not in this file
