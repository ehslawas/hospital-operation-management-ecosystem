const fs = require('fs');
const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";
const baseFilePath = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\scratch\\02ab1e6_utf8.tsx";

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

  const baseContent = cleanLF(fs.readFileSync(baseFilePath, 'utf8'));
  
  const baseLines = baseContent.split('\n');
  const targetLines = step37.target.split('\n');

  console.log("baseLines count:", baseLines.length);
  console.log("targetLines count:", targetLines.length);

  let foundIndices = [];
  const firstLine = targetLines[0].trim();
  for (let i = 0; i < baseLines.length; i++) {
    if (baseLines[i].trim() === firstLine) {
      foundIndices.push(i);
    }
  }

  console.log("Indices matching first line of Step 37 target:", foundIndices);

  for (const idx of foundIndices) {
    console.log(`Checking match starting at index ${idx}:`);
    let match = true;
    for (let j = 0; j < targetLines.length; j++) {
      if (idx + j >= baseLines.length) {
        console.log(`  EOF reached at j=${j}`);
        match = false;
        break;
      }
      const bl = baseLines[idx + j].trim();
      const tl = targetLines[j].trim();
      if (bl !== tl) {
        console.log(`  Mismatch at line relative ${j} (absolute base line ${idx + j + 1}):`);
        console.log(`    Base line  : [${baseLines[idx + j]}]`);
        console.log(`    Target line: [${targetLines[j]}]`);
        match = false;
        break;
      }
    }
    if (match) {
      console.log(`  Full match found at index ${idx}!`);
    }
  }
}

main().catch(console.error);
