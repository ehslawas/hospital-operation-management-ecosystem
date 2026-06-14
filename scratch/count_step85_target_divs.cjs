const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";

const transcriptLines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');

for (const line of transcriptLines) {
  try {
    const step = JSON.parse(line);
    if (step.step_index === 85 && step.tool_calls) {
      const call = step.tool_calls[0];
      if (call.name === 'replace_file_content') {
        const target = call.args.TargetContent;
        const openMatches = target.match(/<div(\s|>)/g) || [];
        const closeMatches = target.match(/<\/div>/g) || [];
        console.log("Step 85 TargetContent:");
        console.log("  Total <div> open:", openMatches.length);
        console.log("  Total </div> close:", closeMatches.length);
        console.log("  Balance (open - close):", openMatches.length - closeMatches.length);
      }
    }
  } catch (e) {}
}
