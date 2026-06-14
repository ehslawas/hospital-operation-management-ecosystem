const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";

const transcriptLines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');

for (const line of transcriptLines) {
  try {
    const step = JSON.parse(line);
    if (step.tool_calls) {
      for (const call of step.tool_calls) {
        if (call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') {
          const text = JSON.stringify(call);
          if (text.includes("currentPath === '/pharmacy/oxygen/qr'")) {
            console.log(`Step ${step.step_index}: introduced path check. Desc: ${call.args.Instruction}`);
          }
        }
      }
    }
  } catch (e) {}
}
