const fs = require('fs');

const logPath = 'C:\\Users\\60113\\.gemini\\antigravity\\brain\\5f6f62dd-b5e5-4f4e-83a5-48b0c5c7c491\\.system_generated\\logs\\transcript.jsonl';

const rl = require('readline').createInterface({
  input: fs.createReadStream(logPath),
  output: process.stdout,
  terminal: false
});

const steps = {};

rl.on('line', (line) => {
  const obj = JSON.parse(line);
  if ([142, 144].includes(obj.step_index)) {
    steps[obj.step_index] = obj.content;
  }
});

rl.on('close', () => {
  const allLines = {};
  
  function parse(content) {
    if (!content) return;
    const lines = content.split('\n');
    for (const l of lines) {
      const match = l.match(/^(\d+): (.*)$/);
      if (match) {
        allLines[match[1]] = match[2];
      }
    }
  }
  
  parse(steps[142]);
  parse(steps[144]);
  
  const result = [];
  for (let i = 1731; i <= 1960; i++) {
    if (allLines[i] !== undefined) {
      result.push(`${i}: ${allLines[i]}`);
    } else {
      result.push(`${i}: [MISSING]`);
    }
  }
  
  console.log(result.join('\n'));
});
