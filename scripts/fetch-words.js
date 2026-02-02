const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'database', 'wordle.db');
const SOLUTIONS_PATH = path.join(__dirname, 'data', 'solutions.json');
const WHITELIST_PATH = path.join(__dirname, 'data', 'whitelist.json');

function normalize(word) {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

function isValidWord(word) {
  return /^[a-zA-Z]{5}$/.test(word);
}

function loadLocalJson(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    throw err;
  }
}

async function importWords() {
  console.log('Loading local word lists...');

  try {
    const solutionsRaw = loadLocalJson(SOLUTIONS_PATH);
    const whitelistRaw = loadLocalJson(WHITELIST_PATH);

    console.log(`Loaded ${solutionsRaw.length} solution candidates and ${whitelistRaw.length} whitelist words.`);

    // Process words
    const solutions = new Set(solutionsRaw.map(w => normalize(w)).filter(isValidWord));
    const allWords = new Set();

    // Add all valid whitelist words (also normalized)
    whitelistRaw.forEach(w => {
      const norm = normalize(w);
      if (isValidWord(norm)) {
        allWords.add(norm);
      }
    });

    // Ensure all solutions are in allWords
    solutions.forEach(s => allWords.add(s));

    console.log(`Processing ${allWords.size} unique 5-letter words (${solutions.size} solutions)...`);

    const db = new sqlite3.Database(dbPath);

    // Initialize Schema/Table
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('DROP TABLE IF EXISTS words');
        db.run(`CREATE TABLE IF NOT EXISTS words (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          word TEXT NOT NULL,
          normalized TEXT NOT NULL,
          is_solution BOOLEAN DEFAULT 0,
          is_active BOOLEAN DEFAULT 1
        )`);
        db.run('CREATE INDEX IF NOT EXISTS idx_words_normalized ON words(normalized)');
        db.run('CREATE INDEX IF NOT EXISTS idx_words_active ON words(is_active)');
        resolve();
      });
    });

    const insert = db.prepare('INSERT INTO words (word, normalized, is_solution, is_active) VALUES (?, ?, ?, 1)');

    let count = 0;

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      for (const word of allWords) {
        const isSolution = solutions.has(word) ? 1 : 0;
        insert.run(word, word, isSolution);
        count++;
      }
      db.run("COMMIT");
    });

    insert.finalize();

    console.log('Import completed successfully!');
    db.close();

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

importWords();
