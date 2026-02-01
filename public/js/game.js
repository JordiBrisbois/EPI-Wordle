import { API } from './api.js';
import { UI } from './ui.js';

export class Game {
  constructor() {
    this.board = document.getElementById('game-board');
    this.keyboard = document.getElementById('keyboard');

    this.state = {
      gameId: null,
      guesses: [],
      currentGuess: '',
      isGameOver: false,
      wordLength: 5,
      maxAttempts: 6,
      revealedWord: null
    };

    this.initKeyboard();
    this.loadSavedState();
  }

  async loadSavedState() {
    const savedGameId = localStorage.getItem('epi-wordle-game-id');
    if (savedGameId) {
      try {
        const data = await API.getGameState(savedGameId);
        this.state = {
          ...this.state,
          gameId: data.gameId,
          guesses: data.guesses,
          isGameOver: data.isGameOver,
          revealedWord: data.revealedWord
        };

        this.renderBoard();
        this.updateKeyboardState();

        if (this.state.isGameOver) {
          this.showEndGame(data.revealedWord, data.guesses.some(g => g.result.every(l => l.status === 'correct')));
        }
      } catch (e) {
        console.log('No valid saved game', e);
        localStorage.removeItem('epi-wordle-game-id');
      }
    }
  }

  async startNewGame() {
    try {
      const data = await API.startGame();
      this.state = {
        gameId: data.gameId,
        guesses: [],
        currentGuess: '',
        isGameOver: false,
        wordLength: data.wordLength,
        maxAttempts: data.maxAttempts,
        revealedWord: null
      };

      localStorage.setItem('epi-wordle-game-id', data.gameId);

      this.renderBoard();
      this.resetKeyboard();
      UI.showNotification('Nouvelle partie commencee !', 'success');

      document.getElementById('new-game-btn').style.display = 'none';
    } catch (error) {
      UI.showNotification(error.message, 'error');
    }
  }

  handleInput(key) {
    if (this.state.isGameOver) return;

    if (key === 'Enter') {
      this.submitGuess();
    } else if (key === 'Backspace') {
      this.state.currentGuess = this.state.currentGuess.slice(0, -1);
      this.updateCurrentRow();
    } else if (/^[a-zA-Z]$/.test(key)) {
      if (this.state.currentGuess.length < this.state.wordLength) {
        this.state.currentGuess += key.toUpperCase();
        this.updateCurrentRow();
      }
    }
  }

  async submitGuess() {
    if (this.state.currentGuess.length !== this.state.wordLength) {
      UI.shake(this.getCurrentRow());
      UI.showNotification('Pas assez de lettres', 'warning');
      return;
    }

    try {
      const data = await API.submitGuess(this.state.gameId, this.state.currentGuess);

      // Animate reveal
      const row = this.getCurrentRow();
      const tiles = row.querySelectorAll('.tile');

      for (let i = 0; i < tiles.length; i++) {
        await UI.flipTile(tiles[i], data.result[i].letter.toUpperCase(), data.result[i].status, i * 50); // Ultra fast stagger
      }

      this.state.guesses.push({ guess: this.state.currentGuess, result: data.result });
      this.state.currentGuess = '';
      this.state.isGameOver = data.isGameOver;

      // Update Board State (Progression)
      row.classList.remove('current');
      row.classList.add('completed');

      if (!data.isGameOver) {
        const nextRow = row.nextElementSibling;
        if (nextRow) {
          nextRow.classList.add('current');
        }
      }

      this.updateKeyboardState();

      if (data.isGameOver) {
        this.showEndGame(data.revealedWord, data.isWin);
        localStorage.removeItem('epi-wordle-game-id');
      }

    } catch (error) {
      UI.shake(this.getCurrentRow());
      UI.showNotification(error.message, 'error');
    }
  }

  initKeyboard() {
    const rows = [
      'AZERTYUIOP',
      'QSDFGHJKLM',
      'WXCVBN'
    ];

    this.keyboard.innerHTML = '';

    rows.forEach(row => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'keyboard-row';

      row.split('').forEach(key => {
        const btn = document.createElement('button');
        btn.textContent = key;
        btn.className = 'key';
        btn.dataset.key = key;
        btn.onclick = () => this.handleInput(key);
        rowDiv.appendChild(btn);
      });

      if (row === 'WXCVBN') {
        // Add Enter and Backspace
        const enter = document.createElement('button');
        enter.textContent = '↵';
        enter.className = 'key key-wide key-enter';
        enter.onclick = () => this.handleInput('Enter');
        rowDiv.insertBefore(enter, rowDiv.firstChild);

        const back = document.createElement('button');
        back.textContent = '⌫';
        back.className = 'key key-wide key-back';
        back.onclick = () => this.handleInput('Backspace');
        rowDiv.appendChild(back);
      }

      this.keyboard.appendChild(rowDiv);
    });

    // Physical keyboard
    document.addEventListener('keydown', (e) => {
      // Prevent game input when typing in text fields
      if (e.target.matches('input, textarea')) return;

      const key = e.key.toUpperCase();
      if (key === 'ENTER' || key === 'BACKSPACE' || /^[A-Z]$/.test(key)) {
        this.handleInput(e.key);
      }
    });
  }

  resetKeyboard() {
    document.querySelectorAll('.key').forEach(k => {
      k.classList.remove('correct', 'present', 'absent');
    });
  }

  updateKeyboardState() {
    const state = {}; // key -> status (correct > present > absent)

    this.state.guesses.forEach(g => {
      g.result.forEach(r => {
        const k = r.letter.toUpperCase();
        const s = r.status;

        if (state[k] === 'correct') return;
        if (s === 'correct') state[k] = 'correct';
        else if (s === 'present' && state[k] !== 'correct') state[k] = 'present';
        else if (s === 'absent' && !state[k]) state[k] = 'absent';
      });
    });

    Object.entries(state).forEach(([key, status]) => {
      const btn = this.keyboard.querySelector(`[data-key="${key}"]`);
      if (btn) {
        btn.classList.remove('correct', 'present', 'absent');
        btn.classList.add(status);
      }
    });
  }

  renderBoard() {
    this.board.innerHTML = '';

    // Render existing guesses
    this.state.guesses.forEach(g => {
      const row = document.createElement('div');
      row.className = 'game-row completed';

      g.result.forEach(r => {
        const tile = document.createElement('div');
        tile.className = 'tile revealed';
        tile.dataset.status = r.status;
        tile.textContent = r.letter.toUpperCase();
        row.appendChild(tile);
      });
      this.board.appendChild(row);
    });

    // Render empty rows
    const attemptsLeft = this.state.maxAttempts - this.state.guesses.length;
    for (let i = 0; i < attemptsLeft; i++) {
      const row = document.createElement('div');
      row.className = 'game-row';
      if (i === 0 && !this.state.isGameOver) row.classList.add('current');

      for (let j = 0; j < this.state.wordLength; j++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        row.appendChild(tile);
      }
      this.board.appendChild(row);
    }
  }

  getCurrentRow() {
    return this.board.querySelector('.game-row.current');
  }

  updateCurrentRow() {
    const row = this.getCurrentRow();
    if (!row) return;

    const tiles = row.querySelectorAll('.tile');
    const chars = this.state.currentGuess.split('');

    tiles.forEach((tile, i) => {
      tile.textContent = chars[i] || '';
      if (chars[i]) {
        tile.dataset.status = 'tbd'; // To Be Determined (styling purposes)
        tile.classList.add('pop');
        setTimeout(() => tile.classList.remove('pop'), 100);
      } else {
        delete tile.dataset.status;
      }
    });
  }

  showEndGame(word, isWin) {
    const msg = isWin ? 'Felicitations ! Vous avez trouve le mot.' : `Dommage ! Le mot etait : ${word.toUpperCase()}`;
    UI.showNotification(msg, isWin ? 'success' : 'info', 5000);
    document.getElementById('new-game-btn').style.display = 'block';
  }
}
