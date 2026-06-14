const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\7b07684f-e9d2-44f5-b528-43a8f84984e4\\.system_generated\\logs\\transcript_full.jsonl";

const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
for (const line of lines) {
  try {
    const step = JSON.parse(line);
    if (step.step_index === 300 && step.tool_calls) {
      console.log("=== STEP 300 TARGET ===");
      console.log(step.tool_calls[0].args.TargetContent.substring(0, 1000));
    }
  } catch (e) {}
}
