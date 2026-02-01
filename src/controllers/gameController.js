const { dbGet, dbRun, dbAll } = require('../database/db');
const CONFIG = require('../config/config');

// Use crypto for UUID if available, or fallback
const crypto = require('crypto');
const generateId = () => {
    if (crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

exports.startGame = async (req, res) => {
    // Clean up old anonymous games or old games for this user?
    // For now, just create new.

    const word = await dbGet('SELECT word, normalized FROM words WHERE is_active = 1 ORDER BY RANDOM() LIMIT 1');

    if (!word) {
        return res.status(500).json({ error: 'Aucun mot disponible' });
    }

    const gameId = generateId();
    const userId = req.user ? req.user.id : null;

    await dbRun(
        `INSERT INTO active_games (id, user_id, target_word, original_word, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
        [gameId, userId, word.normalized, word.word]
    );

    res.json({
        gameId,
        maxAttempts: CONFIG.GAME.MAX_ATTEMPTS,
        wordLength: CONFIG.GAME.WORD_LENGTH
    });
};

exports.getGameState = async (req, res) => {
    const { gameId } = req.query;

    if (!gameId) return res.status(400).json({ error: 'Game ID required' });

    const game = await dbGet('SELECT * FROM active_games WHERE id = ?', [gameId]);

    if (!game) {
        return res.status(404).json({ error: 'Partie non trouvee' });
    }

    // Verify ownership
    if (game.user_id !== null && game.user_id !== req.user?.id) {
        return res.status(403).json({ error: 'Non autorise' });
    }

    const isGameOver = !!game.is_game_over;
    const guesses = JSON.parse(game.guesses || '[]');

    res.json({
        gameId,
        revealedWord: isGameOver ? game.original_word : null,
        guesses: guesses,
        isGameOver: isGameOver
    });
};

exports.checkDictionary = async (req, res) => {
    const { word } = req.params;

    if (!word || word.length !== CONFIG.GAME.WORD_LENGTH || !/^[a-zA-ZÀ-ÿ]+$/.test(word)) {
        return res.status(400).json({ error: 'Format de mot invalide' });
    }

    const normalized = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const exists = await dbGet('SELECT 1 FROM words WHERE normalized = ?', [normalized]);
    res.json({ exists: !!exists, word: normalized });
};

exports.submitGuess = async (req, res) => {
    const { gameId, guess } = req.body;

    if (!gameId) return res.status(400).json({ error: 'Game ID required' });

    const game = await dbGet('SELECT * FROM active_games WHERE id = ?', [gameId]);

    if (!game) {
        return res.status(404).json({ error: 'Partie non trouvee' });
    }

    if (game.user_id !== null && game.user_id !== req.user?.id) {
        return res.status(403).json({ error: 'Non autorise' });
    }

    if (game.is_game_over) {
        return res.status(400).json({ error: 'Partie terminee' });
    }

    const currentGuesses = JSON.parse(game.guesses || '[]');

    if (currentGuesses.length >= CONFIG.GAME.MAX_ATTEMPTS) {
        await dbRun('UPDATE active_games SET is_game_over = 1 WHERE id = ?', [gameId]);
        return res.status(400).json({ error: 'Nombre maximum d\'essais atteint' });
    }

    if (!guess || guess.length !== CONFIG.GAME.WORD_LENGTH) {
        return res.status(400).json({ error: 'Mot invalide' });
    }

    const normalizedGuess = guess.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normalizedTarget = game.target_word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Dictionary check
    const exists = await dbGet('SELECT 1 FROM words WHERE normalized = ?', [normalizedGuess]);
    if (!exists) {
        return res.status(400).json({ error: 'Mot non trouve dans le dictionnaire' });
    }

    // Calculate result
    const result = [];
    const targetArray = normalizedTarget.split('');
    const guessArray = normalizedGuess.split('');

    // Green
    for (let i = 0; i < CONFIG.GAME.WORD_LENGTH; i++) {
        if (guessArray[i] === targetArray[i]) {
            result[i] = { letter: guessArray[i], status: 'correct' };
            targetArray[i] = null;
        }
    }

    // Yellow
    for (let i = 0; i < CONFIG.GAME.WORD_LENGTH; i++) {
        if (result[i]) continue;
        const index = targetArray.indexOf(guessArray[i]);
        if (index !== -1) {
            result[i] = { letter: guessArray[i], status: 'present' };
            targetArray[index] = null;
        } else {
            result[i] = { letter: guessArray[i], status: 'absent' };
        }
    }

    currentGuesses.push({ guess: normalizedGuess, result });

    const isWin = normalizedGuess === normalizedTarget;
    const isGameOver = isWin || currentGuesses.length >= CONFIG.GAME.MAX_ATTEMPTS;

    // Update Active Game
    await dbRun(
        'UPDATE active_games SET guesses = ?, is_game_over = ? WHERE id = ?',
        [JSON.stringify(currentGuesses), isGameOver ? 1 : 0, gameId]
    );

    // If Game Over and User, update History and Stats
    if (isGameOver && req.user) {
        // Record in history
        await dbRun(
            `INSERT INTO games (user_id, word, guesses, won, created_at) 
       VALUES (?, ?, ?, ?, datetime('now'))`,
            [req.user.id, game.original_word, JSON.stringify(currentGuesses), isWin ? 1 : 0]
        );

        // Update stats
        const stats = await dbGet('SELECT total_games, total_wins, current_streak, max_streak FROM users WHERE id = ?', [req.user.id]);
        if (stats) {
            const newTotalGames = stats.total_games + 1;
            const newTotalWins = stats.total_wins + (isWin ? 1 : 0);
            const newCurrentStreak = isWin ? stats.current_streak + 1 : 0;
            const newMaxStreak = Math.max(stats.max_streak, newCurrentStreak);

            await dbRun(
                `UPDATE users SET 
         total_games = ?, total_wins = ?, current_streak = ?, max_streak = ?, total_words_found = total_words_found + ?
         WHERE id = ?`,
                [newTotalGames, newTotalWins, newCurrentStreak, newMaxStreak, isWin ? 1 : 0, req.user.id]
            );
        }
    }

    res.json({
        result,
        isWin,
        isGameOver,
        guessCount: currentGuesses.length,
        revealedWord: isGameOver ? game.original_word : null
    });
};

exports.getLeaderboard = async (req, res) => {
    const leaderboard = await dbAll(`
    SELECT 
      username,
      total_games,
      total_wins,
      CAST(total_wins AS REAL) / CAST(total_games AS REAL) * 100 as win_rate,
      current_streak,
      max_streak,
      total_words_found
    FROM users
    WHERE total_games > 0
    ORDER BY win_rate DESC, total_words_found DESC
    LIMIT 50
  `);

    res.json({ leaderboard });
};

exports.getHistory = async (req, res) => {
    if (!req.user) return res.json({ games: [] });

    const games = await dbAll(`
      SELECT word, won, attempts, guesses, created_at
      FROM games
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `, [req.user.id]);

    res.json({ games });
};
