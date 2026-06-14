const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";
const baseFilePath = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\scratch\\02ab1e6_utf8.tsx";
const targetFilePath = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\src\\pages\\pharmacy\\oxygen\\OxygenDashboardPage.tsx";

function cleanLF(str) {
  return str.replace(/\r\n/g, '\n').replace(/\r/g, '');
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
          target: cleanLF(call.args.TargetContent || call.args.targetContent || ''),
          replacement: cleanLF(call.args.ReplacementContent || call.args.replacementContent || '')
        };
        break;
      }
    } catch (e) {}
  }

  if (!step37) {
    console.error("ERROR: Could not find step 37 in transcripts!");
    return;
  }

  const baseContent = cleanLF(fs.readFileSync(baseFilePath, 'utf8'));
  
  // Find step37.target in baseContent
  const idx = baseContent.indexOf(step37.target);
  if (idx === -1) {
    console.error("ERROR: Could not find Step 37 target content in base file!");
    // Let's do a loose matching search or find mismatch
    console.log("Base content length:", baseContent.length);
    console.log("Step 37 target length:", step37.target.length);
    return;
  }

  console.log("Found Step 37 target content at index", idx);
  const newContent = baseContent.substring(0, idx) + step37.replacement + baseContent.substring(idx + step37.target.length);
  
  // Write target file (converting to CRLF as preferred by Windows/project settings)
  fs.writeFileSync(targetFilePath, newContent.replace(/\n/g, '\r\n'), 'utf8');
  console.log("SUCCESS! Created pre-cutoff state of OxygenDashboardPage.tsx by applying Step 37 to the base file.");
}

main().catch(console.error);
