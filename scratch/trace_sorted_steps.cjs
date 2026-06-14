const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";

const transcriptLines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
const steps = [];
for (const line of transcriptLines) {
  try {
    const step = JSON.parse(line);
    if (step.tool_calls) {
      for (const call of step.tool_calls) {
        const file = call.args.TargetFile || call.args.targetFile;
        if (file && file.includes("OxygenDashboardPage.tsx")) {
          steps.push({
            step_index: step.step_index,
            name: call.name,
            startLine: call.args.StartLine,
            endLine: call.args.EndLine,
            instruction: call.args.Instruction || call.args.instruction
          });
        }
      }
    }
  } catch (e) {}
}

steps.sort((a, b) => a.step_index - b.step_index);
for (const s of steps) {
  console.log(`Step ${s.step_index}: name=${s.name} start=${s.startLine} end=${s.endLine} desc="${s.instruction}"`);
}
