const fs = require('fs');

const content = fs.readFileSync('src/pages/pharmacy/oxygen/OxygenDashboardPage.tsx', 'utf8');
const lines = content.split('\n');

// Let's analyze block from line 1288 to 2061
const blockLines = lines.slice(1287, 2061);

let divsOpen = 0;
let divsClose = 0;
let otherOpens = {};
let otherCloses = {};

for (let i = 0; i < blockLines.length; i++) {
  const line = blockLines[i];
  
  // Count <div and </div>
  const openMatches = line.match(/<div(\s|>)/g) || [];
  const closeMatches = line.match(/<\/div>/g) || [];
  
  divsOpen += openMatches.length;
  divsClose += closeMatches.length;
  
  if (openMatches.length > 0 || closeMatches.length > 0) {
    // console.log(`Line ${1288 + i}: open=${openMatches.length}, close=${closeMatches.length}. Current balance: ${divsOpen - divsClose}`);
  }
}

console.log("Total <div> open:", divsOpen);
console.log("Total </div> close:", divsClose);
console.log("Balance (open - close):", divsOpen - divsClose);
