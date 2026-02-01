const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'wordle.db');

// Remove existing database if it exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Ancienne base de donnees supprimee');
}

const db = new sqlite3.Database(dbPath);

// Create users table
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  total_words_found INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

// Create games table
const createGamesTable = `
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  word TEXT NOT NULL,
  won BOOLEAN DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  guesses TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

// Create words table
const createWordsTable = `
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL,
  normalized TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1
);
`;

// Create indexes
const createIndexes = [
  'CREATE INDEX IF NOT EXISTS idx_words_normalized ON words(normalized);',
  'CREATE INDEX IF NOT EXISTS idx_words_active ON words(is_active);',
  'CREATE INDEX IF NOT EXISTS idx_games_user ON games(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);'
];

// Enable foreign keys
const enableForeignKeys = 'PRAGMA foreign_keys = ON;';

async function initDatabase() {
  try {
    // Enable foreign keys
    await new Promise((resolve, reject) => {
      db.exec(enableForeignKeys, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Create users table
    await new Promise((resolve, reject) => {
      db.exec(createUsersTable, (err) => {
        if (err) reject(err);
        else {
          console.log('Table users creee');
          resolve();
        }
      });
    });

    // Create games table
    await new Promise((resolve, reject) => {
      db.exec(createGamesTable, (err) => {
        if (err) reject(err);
        else {
          console.log('Table games creee');
          resolve();
        }
      });
    });

    // Create words table
    await new Promise((resolve, reject) => {
      db.exec(createWordsTable, (err) => {
        if (err) reject(err);
        else {
          console.log('Table words creee');
          resolve();
        }
      });
    });

    // Create indexes
    for (const indexSql of createIndexes) {
      await new Promise((resolve, reject) => {
        db.exec(indexSql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    console.log('Index crees');

    console.log('\nBase de donnees initialisee avec succes !');
    console.log('Fichier:', dbPath);

  } catch (error) {
    console.error('Erreur lors de la creation de la base de donnees:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

initDatabase();
