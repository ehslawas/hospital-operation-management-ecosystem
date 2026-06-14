const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";

const transcriptLines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
for (const line of transcriptLines) {
  try {
    const step = JSON.parse(line);
    if (step.step_index === 113) {
      console.log("=== STEP 113 TOOL CALL ===");
      const call = step.tool_calls[0];
      console.log("Name:", call.name);
      console.log("StartLine:", call.args.StartLine);
      console.log("EndLine:", call.args.EndLine);
      console.log("ReplacementContent:", JSON.stringify(call.args.ReplacementContent));
      console.log("TargetContent:", JSON.stringify(call.args.TargetContent));
    }
  } catch (e) {}
}
