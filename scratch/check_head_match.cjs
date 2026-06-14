const fs = require('fs');
const { execSync } = require('child_process');

const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\7b07684f-e9d2-44f5-b528-43a8f84984e4\\.system_generated\\logs\\transcript_full.jsonl";

function cleanLF(str) {
  return str.replace(/\r\n/g, '\n').replace(/\r/g, '');
}

async function main() {
  const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
  let firstEdit = null;

  for (const line of lines) {
    try {
      const step = JSON.parse(line);
      if (step.step_index === 95 && step.tool_calls) {
        const call = step.tool_calls[0];
        firstEdit = {
          target: cleanLF(call.args.TargetContent || call.args.targetContent || ''),
          replacement: cleanLF(call.args.ReplacementContent || call.args.replacementContent || '')
        };
        break;
      }
    } catch (e) {}
  }

  if (!firstEdit) {
    console.log("Could not find step 95 edit in transcript");
    return;
  }

  const headContent = cleanLF(execSync("git show HEAD:src/pages/pharmacy/oxygen/OxygenDashboardPage.tsx", { encoding: 'utf8' }));
  
  console.log("Head content length:", headContent.length);
  console.log("First edit target length:", firstEdit.target.length);
  console.log("Target in Head content index:", headContent.indexOf(firstEdit.target));
  
  const baseContent = cleanLF(fs.readFileSync("scratch/failed_target_0.txt", 'utf8'));
  console.log("Base content length:", baseContent.length);
  console.log("Target in Base content index:", baseContent.indexOf(firstEdit.target));
}

main().catch(console.error);
