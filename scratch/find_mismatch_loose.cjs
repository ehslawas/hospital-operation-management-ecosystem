const fs = require('fs');

const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";
const targetFilePath = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\src\\pages\\pharmacy\\oxygen\\OxygenDashboardPage.tsx";

const stepsToUndo = [239, 235, 163, 151, 145, 137, 113, 85, 75];

function cleanLines(str) {
  return str.replace(/\r\n/g, '\n').replace(/\r/g, '').split('\n');
}

function cleanContent(content) {
  let cleaned = content;
  if (cleaned.charCodeAt(0) === 0xFEFF) {
    cleaned = cleaned.substring(1);
  }
  return cleaned.replace(/\r/g, '');
}

async function main() {
  const transcriptLines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
  const stepMap = {};

  for (const line of transcriptLines) {
    try {
      const step = JSON.parse(line);
      if (stepsToUndo.includes(step.step_index) && step.tool_calls) {
        const call = step.tool_calls[0];
        stepMap[step.step_index] = {
          target: cleanLines(call.args.TargetContent || call.args.targetContent || ''),
          replacement: cleanLines(call.args.ReplacementContent || call.args.replacementContent || '')
        };
      }
    } catch (e) {}
  }

  // Read target file at Step 239 (restored)
  // Let's reset the file first
  const baseFilePath = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\scratch\\02ab1e6_utf8.tsx";
  const diffLfPath = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\scratch\\diff_utf8_lf.txt";
  
  console.log("Re-setting target file to Step 239 state...");
  const baseContent = fs.readFileSync(baseFilePath, 'utf8');
  fs.writeFileSync(targetFilePath, cleanContent(baseContent), 'utf8');
  const { execSync } = require('child_process');
  execSync(`git apply --ignore-whitespace --whitespace=nowarn "${diffLfPath}"`, { stdio: 'inherit' });

  let fileContent = fs.readFileSync(targetFilePath, 'utf8').replace(/┬│/g, '³');
  let fileLines = fileContent.replace(/\r/g, '').split('\n');

  // Let's do Step 239 first
  const { target: t239, replacement: r239 } = stepMap[239];
  // Find hunk
  let startIdx = -1;
  for (let i = 0; i <= fileLines.length - r239.length; i++) {
    let match = true;
    for (let j = 0; j < r239.length; j++) {
      if (fileLines[i + j].trim() !== r239[j].trim()) {
        match = false;
        break;
      }
    }
    if (match) { startIdx = i; break; }
  }
  if (startIdx === -1) {
    console.error("Could not find step 239 hunk!");
    return;
  }
  fileLines.splice(startIdx, r239.length, ...t239);
  console.log("Applied step 239 revert in memory.");

  // Now let's trace step 235
  const { target: t235, replacement: r235 } = stepMap[235];
  console.log("Rep 235 first line:", r235[0]);
  let matches = [];
  for (let i = 0; i < fileLines.length; i++) {
    if (fileLines[i].trim() === r235[0].trim()) {
      matches.push(i);
    }
  }
  console.log("Matches for first line of step 235 replacement:", matches);

  for (const idx of matches) {
    console.log(`Checking match starting at line ${idx + 1}`);
    for (let j = 0; j < r235.length; j++) {
      if (idx + j >= fileLines.length) {
        console.log(`  EOF reached at j=${j}`);
        break;
      }
      const fl = fileLines[idx + j].trim();
      const rl = r235[j].trim();
      if (fl !== rl) {
        console.log(`  Mismatch at relative line ${j} (absolute file line ${idx + j + 1}):`);
        console.log(`    File: [${fileLines[idx + j]}]`);
        console.log(`    Rep : [${r235[j]}]`);
        break;
      }
    }
  }
}

main().catch(console.error);
