const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";

const transcriptLines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
for (const line of transcriptLines) {
  try {
    const step = JSON.parse(line);
    if (step.step_index === 239) {
      console.log("=== STEP 239 ===");
      console.log(JSON.stringify(step.tool_calls[0], null, 2));
    }
    if (step.step_index === 235) {
      console.log("=== STEP 235 ===");
      console.log("Target length:", step.tool_calls[0].args.TargetContent?.length);
      console.log("Replacement length:", step.tool_calls[0].args.ReplacementContent?.length);
    }
  } catch (e) {}
}
