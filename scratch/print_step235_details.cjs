const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";

const transcriptLines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
for (const line of transcriptLines) {
  try {
    const step = JSON.parse(line);
    if (step.step_index === 235) {
      console.log("=== STEP 235 TOOL CALL ===");
      const call = step.tool_calls[0];
      console.log("Name:", call.name);
      console.log("StartLine:", call.args.StartLine);
      console.log("EndLine:", call.args.EndLine);
      console.log("ReplacementContent length:", call.args.ReplacementContent?.length);
      console.log("ReplacementContent ends with:", JSON.stringify(call.args.ReplacementContent?.slice(-100)));
      console.log("TargetContent ends with:", JSON.stringify(call.args.TargetContent?.slice(-100)));
    }
  } catch (e) {}
}
