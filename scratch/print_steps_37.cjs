const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";

const transcriptLines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
for (const line of transcriptLines) {
  try {
    const step = JSON.parse(line);
    if (step.step_index === 37) {
      console.log("=== STEP 37 ===");
      const call = step.tool_calls[0];
      console.log("Instruction:", call.args.Instruction);
      console.log("StartLine:", call.args.StartLine);
      console.log("EndLine:", call.args.EndLine);
      console.log("Target length:", call.args.TargetContent.length);
      console.log("Replacement length:", call.args.ReplacementContent.length);
    }
  } catch (e) {}
}
