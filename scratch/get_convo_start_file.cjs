const fs = require('fs');
const path = require('path');

const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\7b07684f-e9d2-44f5-b528-43a8f84984e4\\.system_generated\\logs\\transcript_full.jsonl";

if (!fs.existsSync(transcriptPath)) {
  console.log("No transcript found for 7b07684f-e9d2-44f5-b528-43a8f84984e4");
  process.exit(0);
}

const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
for (const line of lines) {
  try {
    const step = JSON.parse(line);
    if (step.tool_calls) {
      for (const call of step.tool_calls) {
        if (JSON.stringify(call).includes("OxygenDashboardPage.tsx")) {
          console.log(`Step ${step.step_index}: name=${call.name}`);
          if (call.name === 'view_file') {
            console.log(`  args:`, call.args);
          }
        }
      }
    }
    if (step.content && step.content.includes("OxygenDashboardPage.tsx") && step.step_index < 95) {
      console.log(`Step ${step.step_index} content length:`, step.content.length);
      // If it contains "Showing lines" or something, let's log it
      if (step.content.includes("Showing lines")) {
        console.log(`  Preview:`, step.content.substring(0, 200));
      }
    }
  } catch (e) {}
}
