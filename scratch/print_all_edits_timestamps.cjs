const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";

const transcriptLines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
const edits = [];

for (const line of transcriptLines) {
  try {
    const step = JSON.parse(line);
    if (step.tool_calls) {
      for (const call of step.tool_calls) {
        if (call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') {
          const file = call.args.TargetFile || call.args.targetFile;
          if (file && file.includes("OxygenDashboardPage.tsx")) {
            edits.push({
              step_index: step.step_index,
              name: call.name,
              timestamp: step.created_at || step.timestamp || 'N/A',
              desc: call.args.Instruction || call.args.instruction
            });
          }
        }
      }
    }
  } catch (e) {}
}

edits.sort((a, b) => a.step_index - b.step_index);
for (const e of edits) {
  console.log(`Step ${e.step_index}: time=${e.timestamp} tool=${e.name} desc="${e.desc}"`);
}
