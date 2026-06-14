const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";

const transcriptLines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
for (const line of transcriptLines) {
  try {
    const step = JSON.parse(line);
    if (step.step_index <= 37) {
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
      // Check if system/model response has file content
      if (step.content && step.content.includes("OxygenDashboardPage.tsx") && step.step_index < 37) {
        console.log(`Step ${step.step_index} content includes filename. Length:`, step.content.length);
      }
    }
  } catch (e) {}
}
