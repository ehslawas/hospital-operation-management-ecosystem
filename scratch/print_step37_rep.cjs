const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";

const transcriptLines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
for (const line of transcriptLines) {
  try {
    const step = JSON.parse(line);
    if (step.step_index === 37) {
      console.log("=== STEP 37 REPLACEMENT ===");
      console.log(step.tool_calls[0].args.ReplacementContent.substring(0, 500));
    }
  } catch (e) {}
}
