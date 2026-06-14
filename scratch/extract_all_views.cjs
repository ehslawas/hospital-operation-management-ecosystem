const fs = require('fs');

const logPath = 'C:\\Users\\60113\\.gemini\\antigravity\\brain\\5f6f62dd-b5e5-4f4e-83a5-48b0c5c7c491\\.system_generated\\logs\\transcript.jsonl';

const rl = require('readline').createInterface({
  input: fs.createReadStream(logPath),
  output: process.stdout,
  terminal: false
});

const allLines = {};

rl.on('line', (line) => {
  if (line.includes('"type":"VIEW_FILE"')) {
    const obj = JSON.parse(line);
    if (obj.content) {
      const lines = obj.content.split('\n');
      for (const l of lines) {
        const match = l.match(/^(\d+): (.*)$/);
        if (match) {
          allLines[match[1]] = match[2];
        }
      }
    }
  }
});

rl.on('close', () => {
  const result = [];
  const missing = [];
  const maxLine = Math.max(...Object.keys(allLines).map(Number));
  
  for (let i = 1730; i <= 2000; i++) {
    if (allLines[i] !== undefined) {
      result.push(`${i}: ${allLines[i]}`);
    } else {
      missing.push(i);
      result.push(`${i}: [MISSING]`);
    }
  }
  
  console.log(`Reconstructed lines 1730 to 2000. Missing count: ${missing.length}`);
  if (missing.length > 0) {
    console.log('Missing lines:', missing);
  }
  fs.writeFileSync('scratch/extracted_range.txt', result.join('\n'));
});
