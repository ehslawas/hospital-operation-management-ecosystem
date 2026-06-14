const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";

const transcriptLines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
const steps = [];
for (const line of transcriptLines) {
  try {
    const step = JSON.parse(line);
    console.log(`Step ${step.step_index}: time=${step.timestamp || 'N/A'}`);
  } catch (e) {}
}
