const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";
const baseFilePath = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\scratch\\02ab1e6_utf8.tsx";
const targetFilePath = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\src\\pages\\pharmacy\\oxygen\\OxygenDashboardPage.tsx";

function cleanLines(str) {
  return str.replace(/\r\n/g, '\n').replace(/\r/g, '').split('\n');
}

function findHunkRange(fileLines, repLines) {
  if (repLines.length === 0) return -1;
  
  for (let i = 0; i <= fileLines.length - repLines.length; i++) {
    let match = true;
    for (let j = 0; j < repLines.length; j++) {
      if (fileLines[i + j].trim() !== repLines[j].trim()) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
}

async function main() {
  const transcriptLines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
  let step37 = null;

  for (const line of transcriptLines) {
    try {
      const step = JSON.parse(line);
      if (step.step_index === 37) {
        const call = step.tool_calls[0];
        step37 = {
          target: cleanLines(call.args.TargetContent || call.args.targetContent || ''),
          replacement: cleanLines(call.args.ReplacementContent || call.args.replacementContent || '')
        };
        break;
      }
    } catch (e) {}
  }

  if (!step37) {
    console.error("ERROR: Could not find Step 37 in transcripts!");
    return;
  }

  const baseContent = fs.readFileSync(baseFilePath, 'utf8');
  let baseLines = baseContent.replace(/\r/g, '').split('\n');

  console.log("Searching for Step 37 target content in base file (lines count:", baseLines.length, ")...");
  const startIdx = findHunkRange(baseLines, step37.target);
  if (startIdx === -1) {
    console.error("ERROR: Could not find Step 37 target hunk loosely!");
    return;
  }

  console.log(`Found Step 37 target hunk at line ${startIdx + 1}. Replacing...`);
  baseLines.splice(startIdx, step37.target.length, ...step37.replacement);

  // Write to target file with CRLF
  fs.writeFileSync(targetFilePath, baseLines.join('\r\n'), 'utf8');
  console.log("SUCCESS! OxygenDashboardPage.tsx successfully restored to Step 37 state!");
}

main().catch(console.error);
