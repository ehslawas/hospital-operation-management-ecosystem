const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";

const transcriptLines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
const targets = [137, 145, 151, 163];

for (const line of transcriptLines) {
  try {
    const step = JSON.parse(line);
    if (targets.includes(step.step_index)) {
      console.log(`=== STEP ${step.step_index} ===`);
      const call = step.tool_calls[0];
      console.log("Name:", call.name);
      if (call.name === 'multi_replace_file_content') {
        console.log("Chunks count:", call.args.ReplacementChunks.length);
      } else {
        console.log("Target length:", call.args.TargetContent?.length);
        console.log("Replacement length:", call.args.ReplacementContent?.length);
        console.log("Target start:", JSON.stringify(call.args.TargetContent?.substring(0, 100)));
      }
    }
  } catch (e) {}
}
