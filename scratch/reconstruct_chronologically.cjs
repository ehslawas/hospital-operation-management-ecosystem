const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const brainDir = "C:\\Users\\60113\\.gemini\\antigravity\\brain";
const cutoffTime = new Date("2026-06-13T20:16:00+08:00"); // 13/6/2026 - 8:16 PM local time
const targetFilePath = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\src\\pages\\pharmacy\\oxygen\\OxygenDashboardPage.tsx";

async function main() {
  const folders = fs.readdirSync(brainDir);
  const edits = [];

  for (const folder of folders) {
    const folderPath = path.join(brainDir, folder);
    const stats = fs.statSync(folderPath);
    if (!stats.isDirectory()) continue;
    
    const transcriptPath = path.join(folderPath, '.system_generated', 'logs', 'transcript_full.jsonl');
    if (!fs.existsSync(transcriptPath)) continue;

    const fileStream = fs.createReadStream(transcriptPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      try {
        const step = JSON.parse(line);
        if (step.source === 'MODEL' && step.tool_calls && step.created_at) {
          const time = new Date(step.created_at);
          for (const call of step.tool_calls) {
            const name = call.name;
            const args = call.args;
            if (name === 'replace_file_content' || name === 'multi_replace_file_content') {
              const file = args.TargetFile || args.targetFile;
              if (file && path.normalize(file).toLowerCase().endsWith('oxygendashboardpage.tsx')) {
                edits.push({
                  tool: name,
                  args: args,
                  time: time,
                  convoId: folder,
                  stepIndex: step.step_index
                });
              }
            }
          }
        }
      } catch (e) {}
    }
  }

  // Sort chronologically
  edits.sort((a, b) => a.time - b.time);

  // Filter pre-cutoff only
  const preCutoffEdits = edits.filter(e => e.time <= cutoffTime);

  console.log(`Found ${preCutoffEdits.length} pre-cutoff edits to apply chronologically.`);

  // Restore HEAD
  console.log("Restoring git HEAD version of OxygenDashboardPage.tsx...");
  execSync(`git checkout HEAD -- "${targetFilePath}"`);

  let currentContent = fs.readFileSync(targetFilePath, 'utf8');

  for (let i = 0; i < preCutoffEdits.length; i++) {
    const edit = preCutoffEdits[i];
    console.log(`[${i+1}/${preCutoffEdits.length}] Applying [${edit.time.toISOString()}] Convo: ${edit.convoId}, Step: ${edit.stepIndex}, Tool: ${edit.tool}`);

    if (edit.tool === 'replace_file_content') {
      const target = edit.args.TargetContent || edit.args.targetContent;
      const replacement = edit.args.ReplacementContent || edit.args.replacementContent;

      // Normalize line endings
      const normalizedContent = currentContent.replace(/\r\n/g, '\n');
      const normalizedTarget = target.replace(/\r\n/g, '\n');
      const normalizedReplacement = replacement.replace(/\r\n/g, '\n');

      const idx = normalizedContent.indexOf(normalizedTarget);
      if (idx === -1) {
        console.error(`  ERROR: Could not find TargetContent in current content state!`);
        // Save intermediate state for debugging
        fs.writeFileSync(`scratch/failed_step_${i}.txt`, currentContent, 'utf8');
        fs.writeFileSync(`scratch/failed_target_${i}.txt`, target, 'utf8');
        return;
      }

      currentContent = normalizedContent.substring(0, idx) + normalizedReplacement + normalizedContent.substring(idx + normalizedTarget.length);
    } else if (edit.tool === 'multi_replace_file_content') {
      const chunks = edit.args.ReplacementChunks || edit.args.replacementChunks;
      for (const chunk of chunks) {
        const target = chunk.TargetContent || chunk.targetContent;
        const replacement = chunk.ReplacementContent || chunk.replacementContent;

        const normalizedContent = currentContent.replace(/\r\n/g, '\n');
        const normalizedTarget = target.replace(/\r\n/g, '\n');
        const normalizedReplacement = replacement.replace(/\r\n/g, '\n');

        const idx = normalizedContent.indexOf(normalizedTarget);
        if (idx === -1) {
          console.error(`  ERROR in multi_replace: Could not find TargetContent!`);
          return;
        }

        currentContent = normalizedContent.substring(0, idx) + normalizedReplacement + normalizedContent.substring(idx + normalizedTarget.length);
      }
    }
  }

  // Save the reconstructed file
  fs.writeFileSync(targetFilePath, currentContent.replace(/\n/g, '\r\n'), 'utf8');
  console.log("SUCCESS! Chronologically reconstructed OxygenDashboardPage.tsx successfully!");
}

main().catch(console.error);
