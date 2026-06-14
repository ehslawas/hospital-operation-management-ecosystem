const fs = require('fs');

const logPath = 'C:\\Users\\60113\\.gemini\\antigravity\\brain\\5f6f62dd-b5e5-4f4e-83a5-48b0c5c7c491\\.system_generated\\logs\\transcript.jsonl';

const steps = {};

// We will read the JSONL line by line and store the content of step 138, 26, 142, 144
const rl = require('readline').createInterface({
  input: fs.createReadStream(logPath),
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  const obj = JSON.parse(line);
  if ([138, 26, 142, 144].includes(obj.step_index)) {
    steps[obj.step_index] = obj.content;
  }
});

rl.on('close', () => {
  console.log('Read steps:', Object.keys(steps));
  
  // Now let's extract the lines
  const finalLines = [];
  
  // Helper to parse showing content
  function parseContent(content) {
    if (!content) return [];
    const lines = content.split('\n');
    const parsed = [];
    for (const line of lines) {
      const match = line.match(/^(\d+): (.*)$/);
      if (match) {
        const lineNum = parseInt(match[1]);
        const lineText = match[2];
        parsed.push({ lineNum, lineText });
      }
    }
    return parsed;
  }
  
  const parsed138 = parseContent(steps[138]); // 1 to 800
  const parsed26 = parseContent(steps[26]);   // 560 to 1359
  const parsed142 = parseContent(steps[142]); // 1250 to 1750
  const parsed144 = parseContent(steps[144]); // 1751 to 2057
  
  console.log(`Parsed sizes: 138(${parsed138.length}), 26(${parsed26.length}), 142(${parsed142.length}), 144(${parsed144.length})`);
  
  // Merge them by line number
  const allLinesMap = new Map();
  
  [parsed138, parsed26, parsed142, parsed144].forEach(arr => {
    arr.forEach(item => {
      allLinesMap.set(item.lineNum, item.lineText);
    });
  });
  
  const maxLine = Math.max(...allLinesMap.keys());
  console.log('Max line number found:', maxLine);
  
  const reconstructed = [];
  const missing = [];
  for (let i = 1; i <= maxLine; i++) {
    if (allLinesMap.has(i)) {
      reconstructed.push(allLinesMap.get(i));
    } else {
      missing.push(i);
      reconstructed.push('');
    }
  }
  
  console.log('Total missing lines count:', missing.length);
  if (missing.length > 0) {
    console.log('Sample missing lines:', missing.slice(0, 50));
  }
  
  fs.writeFileSync('scratch/reconstructed_file.tsx', reconstructed.join('\n'));
  console.log('Reconstructed file written to scratch/reconstructed_file.tsx');
});
