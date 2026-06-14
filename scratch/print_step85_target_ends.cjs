const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";

const transcriptLines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');

for (const line of transcriptLines) {
  try {
    const step = JSON.parse(line);
    if (step.step_index === 85 && step.tool_calls) {
      const call = step.tool_calls[0];
      if (call.name === 'replace_file_content') {
        const target = call.args.TargetContent.split('\n');
        console.log("=== STEP 85 TARGET FIRST 10 LINES ===");
        for (let i = 0; i < Math.min(10, target.length); i++) {
          console.log(`${i}: [${target[i]}]`);
        }
        console.log("=== STEP 85 TARGET LAST 10 LINES ===");
        const len = target.length;
        for (let i = Math.max(0, len - 10); i < len; i++) {
          console.log(`${i}: [${target[i]}]`);
        }
      }
    }
  } catch (e) {}
}
