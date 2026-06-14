const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\60113\\.gemini\\antigravity\\brain\\5f6f62dd-b5e5-4f4e-83a5-48b0c5c7c491\\.system_generated\\logs\\transcript.jsonl';

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  if (line.includes('"type":"VIEW_FILE"')) {
    const obj = JSON.parse(line);
    const lines = obj.content ? obj.content.split('\n') : [];
    const showingLines = lines.find(l => l.includes('Showing lines'));
    console.log(`Step ${obj.step_index}: ${showingLines}`);
  }
});
