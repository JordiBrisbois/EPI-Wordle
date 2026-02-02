const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'fetch-words.js');
const content = fs.readFileSync(targetFile, 'utf8');

const startMarker = "const FRENCH_WORDS = [";
const endMarker = "];";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find FRENCH_WORDS array markers.");
    process.exit(1);
}

const arrayContent = content.substring(startIndex + startMarker.length, endIndex);
const wordMatches = arrayContent.match(/'([^']+)'/g);

if (!wordMatches) {
    console.error("No words found.");
    process.exit(1);
}

const words = wordMatches.map(w => w.replace(/'/g, ''));
console.log(`Processing ${words.length} words...`);

const validWords = words.filter(w => w.length === 5);
const removedCount = words.length - validWords.length;

console.log(`Kept ${validWords.length} valid words.`);
console.log(`Removed ${removedCount} words with invalid length.`);

// Reformat
let newArrayContent = "\n";
let line = "  ";

for (let i = 0; i < validWords.length; i++) {
    const word = validWords[i];
    const isLast = i === validWords.length - 1;

    line += `'${word}'`;
    if (!isLast) {
        line += ", ";
    }

    if ((i + 1) % 10 === 0 && !isLast) {
        newArrayContent += line + "\n";
        line = "  ";
    }
}
newArrayContent += line + "\n";

const newFileContent = content.substring(0, startIndex + startMarker.length) +
    newArrayContent +
    content.substring(endIndex);

fs.writeFileSync(targetFile, newFileContent, 'utf8');
console.log("File cleaned successfully.");
