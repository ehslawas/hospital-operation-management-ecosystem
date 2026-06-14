const fs = require('fs');

const transcriptPath1 = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\87a76fa1-7722-4717-a027-c3fdb781c87a\\.system_generated\\logs\\transcript_full.jsonl";

async function main() {
  const lines = fs.readFileSync(transcriptPath1, 'utf8').trim().split('\n');
  for (const line of lines) {
    try {
      const step = JSON.parse(line);
      if (step.step_index === 271 && step.tool_calls) {
        const call = step.tool_calls[0];
        console.log("REPLACEMENT CONTENT OF STEP 271:");
        console.log(call.args.ReplacementContent || call.args.replacementContent);
        break;
      }
    } catch (e) {}
  }
}

main().catch(console.error);
