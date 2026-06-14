const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";

const stepsToUndo = [239, 235, 163, 151, 145, 137, 113, 85, 75];
const transcriptLines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');

for (const line of transcriptLines) {
  try {
    const step = JSON.parse(line);
    if (stepsToUndo.includes(step.step_index) && step.tool_calls) {
      for (const call of step.tool_calls) {
        if (call.name === 'replace_file_content') {
          const file = call.args.TargetFile || call.args.targetFile;
          if (file && file.includes("OxygenDashboardPage.tsx")) {
            console.log(`Step ${step.step_index}: replace_file_content`);
            console.log(`  TargetContent length: ${call.args.TargetContent?.length}`);
            console.log(`  ReplacementContent length: ${call.args.ReplacementContent?.length}`);
          }
        }
      }
    }
  } catch (e) {}
}
