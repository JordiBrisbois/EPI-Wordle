const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'fetch-words.js');
const content = fs.readFileSync(targetFile, 'utf8');

// Regex to extract the array content
const startMarker = "const FRENCH_WORDS = [";
const endMarker = "];";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find FRENCH_WORDS array markers.");
    process.exit(1);
}

const arrayContent = content.substring(startIndex + startMarker.length, endIndex);

// Extract words
const wordMatches = arrayContent.match(/'([^']+)'/g);

if (!wordMatches) {
    console.error("No words found in the array.");
    process.exit(1);
}

const words = wordMatches.map(w => w.replace(/'/g, ''));
console.log(`Checking ${words.length} words...`);

const invalidWords = words.filter(w => w.length !== 5);

if (invalidWords.length === 0) {
    console.log("SUCCESS: All words are exactly 5 letters long.");
} else {
    console.log(`FOUND ${invalidWords.length} INVALID WORDS (not 5 letters):`);
    console.log(invalidWords.join(', '));
    // Optional: Filter them out?
    // For now just report.
}
