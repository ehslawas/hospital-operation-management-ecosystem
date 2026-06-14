const fs = require('fs');
const path = require('path');

const transcriptPath1 = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\87a76fa1-7722-4717-a027-c3fdb781c87a\\.system_generated\\logs\\transcript_full.jsonl";
const transcriptPath2 = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\01373adb-6386-41a7-9bdb-1d8fb0cd72db\\.system_generated\\logs\\transcript_full.jsonl";

function cleanLF(str) {
  return str.replace(/\r\n/g, '\n').replace(/\r/g, '');
}

function printEdit(step, idx) {
  const call = step.tool_calls[0];
  const target = call.args.TargetContent || call.args.targetContent || '';
  const replacement = call.args.ReplacementContent || call.args.replacementContent || '';
  console.log(`\n-----------------------------------------`);
  console.log(`Edit ${idx}: Time=${step.created_at} Convo=${step.convoId} Step=${step.step_index}`);
  console.log(`Target start: ${JSON.stringify(target.substring(0, 150))}`);
  console.log(`Replacement start: ${JSON.stringify(replacement.substring(0, 150))}`);
}

async function main() {
  const edits = [];
  
  // Read first transcript
  if (fs.existsSync(transcriptPath1)) {
    const lines = fs.readFileSync(transcriptPath1, 'utf8').trim().split('\n');
    for (const line of lines) {
      try {
        const step = JSON.parse(line);
        if (step.source === 'MODEL' && step.tool_calls) {
          for (const call of step.tool_calls) {
            const file = call.args.TargetFile || call.args.targetFile;
            if (file && path.normalize(file).toLowerCase().endsWith('oxygenservice.ts')) {
              step.convoId = '87a76fa1-7722-4717-a027-c3fdb781c87a';
              edits.push(step);
            }
          }
        }
      } catch (e) {}
    }
  }

  // Read second transcript
  if (fs.existsSync(transcriptPath2)) {
    const lines = fs.readFileSync(transcriptPath2, 'utf8').trim().split('\n');
    for (const line of lines) {
      try {
        const step = JSON.parse(line);
        if (step.source === 'MODEL' && step.tool_calls) {
          for (const call of step.tool_calls) {
            const file = call.args.TargetFile || call.args.targetFile;
            if (file && path.normalize(file).toLowerCase().endsWith('oxygenservice.ts')) {
              step.convoId = '01373adb-6386-41a7-9bdb-1d8fb0cd72db';
              edits.push(step);
            }
          }
        }
      } catch (e) {}
    }
  }

  console.log(`Found ${edits.length} edits to oxygenService.ts:`);
  for (let i = 0; i < edits.length; i++) {
    printEdit(edits[i], i + 1);
  }
}

main().catch(console.error);
