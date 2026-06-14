const fs = require('fs');

const content = fs.readFileSync('src/pages/pharmacy/oxygen/OxygenDashboardPage.tsx', 'utf8');
const lines = content.split('\n');

let openIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('lg:col-span-7')) {
    openIdx = i;
    break;
  }
}

if (openIdx === -1) {
  console.log("Could not find lg:col-span-7");
  process.exit(0);
}

console.log("Found lg:col-span-7 at line", openIdx + 1);

// Let's count divs from openIdx to 1930
let divsOpen = 0;
for (let i = openIdx; i < 1925; i++) {
  const line = lines[i];
  const openMatches = line.match(/<div(\s|>)/g) || [];
  const closeMatches = line.match(/<\/div>/g) || [];
  divsOpen += openMatches.length - closeMatches.length;
  console.log(`Line ${i+1}: open=${openMatches.length}, close=${closeMatches.length}, balance=${divsOpen}. Line: [${line.trim()}]`);
}
