const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\7b07684f-e9d2-44f5-b528-43a8f84984e4\\.system_generated\\logs\\transcript_full.jsonl";

const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
for (const line of lines) {
  try {
    const step = JSON.parse(line);
    if ((step.step_index === 198 || step.step_index === 202) && step.tool_calls) {
      for (const call of step.tool_calls) {
        if (call.name === 'write_to_file') {
          console.log(`Step ${step.step_index}: write_to_file`);
          console.log(`  TargetFile:`, call.args.TargetFile || call.args.targetFile);
          console.log(`  Overwrite:`, call.args.Overwrite);
          console.log(`  CodeContent length:`, call.args.CodeContent?.length);
        }
      }
    }
  } catch (e) {}
}
