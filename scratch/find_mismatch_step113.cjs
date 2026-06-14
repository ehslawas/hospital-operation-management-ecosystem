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

  const baseFilePath = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\scratch\\02ab1e6_utf8.tsx";
  const diffLfPath = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\scratch\\diff_utf8_lf.txt";
  
  const baseContent = fs.readFileSync(baseFilePath, 'utf8');
  fs.writeFileSync(targetFilePath, cleanContent(baseContent), 'utf8');
  const { execSync } = require('child_process');
  execSync(`git apply --ignore-whitespace --whitespace=nowarn "${diffLfPath}"`, { stdio: 'inherit' });

  let fileContent = fs.readFileSync(targetFilePath, 'utf8').replace(/┬│/g, '³');
  let fileLines = fileContent.replace(/\r/g, '').split('\n');

  // Revert steps one by one
  for (const idx of stepsToUndo) {
    const { target, replacement } = stepMap[idx];
    if (idx === 235) {
      if (replacement[replacement.length - 1].trim() === ')') {
        replacement[replacement.length - 1] = replacement[replacement.length - 1] + '>';
      }
    }

    const startIdx = findHunkRange(fileLines, replacement);
    if (startIdx === -1) {
      console.log(`Failed at step ${idx}!`);
      // Let's debug mismatch for step 113
      if (idx === 113) {
        console.log("Replacement first line:", replacement[0]);
        let matches = [];
        for (let i = 0; i < fileLines.length; i++) {
          if (fileLines[i].trim() === replacement[0].trim()) {
            matches.push(i);
          }
        }
        console.log("Matches for first line of Step 113:", matches);
        for (const m of matches) {
          console.log(`Checking match at line ${m + 1}`);
          for (let j = 0; j < replacement.length; j++) {
            if (m + j >= fileLines.length) {
              console.log(`  EOF reached at j=${j}`);
              break;
            }
            const fl = fileLines[m + j].trim();
            const rl = replacement[j].trim();
            if (fl !== rl) {
              console.log(`  Mismatch at relative line ${j} (absolute file line ${m + j + 1}):`);
              console.log(`    File: [${fileLines[m + j]}]`);
              console.log(`    Rep : [${replacement[j]}]`);
              break;
            }
          }
        }
      }
      return;
    }

    fileLines.splice(startIdx, replacement.length, ...target);
    console.log(`Successfully reverted step ${idx}`);
  }
}

main().catch(console.error);
