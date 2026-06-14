const fs = require('fs');

const fileContent = fs.readFileSync('scratch/failed_undo_235.txt', 'utf8');
const repContent = fs.readFileSync('scratch/failed_undo_rep_235.txt', 'utf8');

console.log("File content length:", fileContent.length);
console.log("Replacement content length:", repContent.length);

const repLines = repContent.split('\n');
const fileLines = fileContent.split('\n');

console.log("Rep lines count:", repLines.length);
console.log("File lines count:", fileLines.length);

// Let's find where the first line of replacement matches in file lines
let foundIndices = [];
const firstLine = repLines[0].trim();
for (let i = 0; i < fileLines.length; i++) {
  if (fileLines[i].trim() === firstLine) {
    foundIndices.push(i);
  }
}

console.log("Indices matching first line of replacement:", foundIndices);

for (const idx of foundIndices) {
  console.log(`Checking match starting at index ${idx}:`);
  let match = true;
  for (let j = 0; j < repLines.length; j++) {
    if (idx + j >= fileLines.length) {
      console.log(`  EOF reached at j=${j}`);
      match = false;
      break;
    }
    const fl = fileLines[idx + j].trim();
    const rl = repLines[j].trim();
    if (fl !== rl) {
      console.log(`  Mismatch at line relative ${j} (absolute file line ${idx + j + 1}):`);
      console.log(`    File line: [${fileLines[idx + j]}]`);
      console.log(`    Rep line : [${repLines[j]}]`);
      match = false;
      break;
    }
  }
  if (match) {
    console.log(`  Full match found at index ${idx}!`);
  }
}
