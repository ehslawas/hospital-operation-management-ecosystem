const fs = require('fs');
const path = require('path');

const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\7b07684f-e9d2-44f5-b528-43a8f84984e4\\.system_generated\\logs\\transcript_full.jsonl";
const baseFilePath = "scratch/02ab1e6_utf8.tsx";

function cleanLF(str) {
  return str.replace(/\r\n/g, '\n').replace(/\r/g, '').trim();
}

async function main() {
  const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
  let target = null;

  for (const line of lines) {
    try {
      const step = JSON.parse(line);
      if (step.step_index === 95 && step.tool_calls) {
        const call = step.tool_calls[0];
        target = cleanLF(call.args.TargetContent || call.args.targetContent || '');
        break;
      }
    } catch (e) {}
  }

  const baseContent = cleanLF(fs.readFileSync(baseFilePath, 'utf8'));

  console.log("Target length:", target.length);
  console.log("Base content length:", baseContent.length);

  // Print first 50 chars of target
  const targetPart = target.substring(0, 50);
  console.log(`Index of target start part "${targetPart}" in Base:`, baseContent.indexOf(targetPart));
  
  // Let's print around the index if found
  const idx = baseContent.indexOf(targetPart);
  if (idx !== -1) {
    console.log("Found start part in Base!");
    console.log("Snippet from Base around that area:");
    console.log(JSON.stringify(baseContent.substring(idx, idx + 200)));
  } else {
    // Let's see if we can search for a smaller substring, e.g. "QR CODE LABEL GENERATOR"
    const simpleQuery = "QR CODE LABEL GENERATOR";
    console.log(`Index of "${simpleQuery}" in Base:`, baseContent.indexOf(simpleQuery));
  }
}

main().catch(console.error);
