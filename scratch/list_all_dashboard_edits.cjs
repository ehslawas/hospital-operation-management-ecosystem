const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";

const transcriptLines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
for (const line of transcriptLines) {
  try {
    const step = JSON.parse(line);
    if (step.tool_calls) {
      for (const call of step.tool_calls) {
        const file = call.args.TargetFile || call.args.targetFile;
        if (file && file.includes("OxygenDashboardPage.tsx")) {
          console.log(`Step ${step.step_index}: action=${call.name} timestamp=${step.timestamp || 'N/A'}`);
        }
      }
    }
  } catch (e) {}
}
