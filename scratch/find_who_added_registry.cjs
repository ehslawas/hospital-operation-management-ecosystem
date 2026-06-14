const fs = require('fs');
const path = require('path');

const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\7b07684f-e9d2-44f5-b528-43a8f84984e4\\.system_generated\\logs\\transcript_full.jsonl";

if (!fs.existsSync(transcriptPath)) {
  console.log("No transcript found");
  process.exit(0);
}

const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
for (const line of lines) {
  try {
    const step = JSON.parse(line);
    if (step.tool_calls) {
      for (const call of step.tool_calls) {
        const text = JSON.stringify(call);
        if (text.includes("Live Cylinder QR Registry")) {
          console.log(`Step ${step.step_index}: tool=${call.name}`);
          if (call.args.Instruction) console.log(`  Instruction: ${call.args.Instruction}`);
        }
      }
    }
  } catch (e) {}
}
