const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\7b07684f-e9d2-44f5-b528-43a8f84984e4\\.system_generated\\logs\\transcript_full.jsonl";

const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
for (const line of lines) {
  try {
    const step = JSON.parse(line);
    if (step.tool_calls) {
      for (const call of step.tool_calls) {
        if (call.name === 'view_file' && JSON.stringify(call.args).includes("OxygenDashboardPage.tsx")) {
          console.log(`Step ${step.step_index} viewed file. Args:`, call.args);
        }
      }
    }
  } catch (e) {}
}
