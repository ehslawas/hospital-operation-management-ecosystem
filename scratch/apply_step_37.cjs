const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";
const targetFilePath = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\src\\pages\\pharmacy\\oxygen\\OxygenDashboardPage.tsx";

async function main() {
  // 1. Read step 37 call args
  const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
  let targetContent = null;
  let replacementContent = null;

  for (const line of lines) {
    try {
      const step = JSON.parse(line);
      if (step.step_index === 37 && step.tool_calls) {
        const call = step.tool_calls[0];
        targetContent = call.args.TargetContent || call.args.targetContent;
        replacementContent = call.args.ReplacementContent || call.args.replacementContent;
        break;
      }
    } catch (e) {}
  }

  if (!targetContent || !replacementContent) {
    console.error("Could not find step 37 TargetContent or ReplacementContent!");
    return;
  }

  console.log("Step 37 data extracted successfully.");

  // 2. Checkout OxygenDashboardPage.tsx from git HEAD
  console.log("Checking out OxygenDashboardPage.tsx from git HEAD...");
  execSync(`git checkout HEAD -- "${targetFilePath}"`);

  // 3. Read HEAD file content
  let headContent = fs.readFileSync(targetFilePath, 'utf8');

  // 4. Do the replacement
  console.log("Applying step 37 replacement...");
  // Let's do some normalization to handle line-ending variations
  const normalizedHead = headContent.replace(/\r\n/g, '\n');
  const normalizedTarget = targetContent.replace(/\r\n/g, '\n');
  const normalizedReplacement = replacementContent.replace(/\r\n/g, '\n');

  const idx = normalizedHead.indexOf(normalizedTarget);
  if (idx === -1) {
    console.error("Could not find TargetContent in git HEAD file!");
    // Let's write them to scratch to investigate
    fs.writeFileSync("scratch/debug_head.txt", normalizedHead, 'utf8');
    fs.writeFileSync("scratch/debug_target.txt", normalizedTarget, 'utf8');
    return;
  }

  const newContent = normalizedHead.substring(0, idx) + normalizedReplacement + normalizedHead.substring(idx + normalizedTarget.length);
  
  // Write back to file on disk (using Windows CRLF line endings)
  const finalContent = newContent.replace(/\n/g, '\r\n');
  fs.writeFileSync(targetFilePath, finalContent, 'utf8');
  console.log("SUCCESS! OxygenDashboardPage.tsx has been restored to pre-cutoff (step 37) state!");
}

main().catch(console.error);
