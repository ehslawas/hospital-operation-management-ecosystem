const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = "C:\\Users\\60113\\.gemini\\antigravity\\brain";
const cutoffTime = new Date("2026-06-13T20:16:00+08:00"); // 13/6/2026 - 8:16 PM local time

const targetFiles = [
  'src/services/pharmacy/oxygenservice.ts',
  'src/components/layout/index.ts',
  'src/lib/constants.ts',
  'src/routes/routes.tsx',
  'src/components/ui/button.tsx',
  'src/pages/admin/accessrequests/accessrequestdetailpage.tsx',
  'src/components/layout/header.tsx',
  'src/components/layout/sidebar.tsx',
  'src/pages/pharmacy/oxygen/oxygendashboardpage.tsx',
  'src/pages/pharmacy/oxygen/qrgeneratorpage.tsx'
];

async function main() {
  const folders = fs.readdirSync(brainDir);
  const allEdits = [];

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
          const stepTime = new Date(step.created_at);
          if (stepTime > cutoffTime) {
            for (const call of step.tool_calls) {
              const name = call.name;
              const args = call.args;
              if (name === 'replace_file_content' || name === 'multi_replace_file_content' || name === 'write_to_file') {
                const file = args.TargetFile || args.targetFile;
                if (file) {
                  allEdits.push({
                    file: path.normalize(file).toLowerCase(),
                    tool: name,
                    args: args,
                    time: stepTime,
                    convoId: folder,
                    stepIndex: step.step_index
                  });
                }
              }
            }
          }
        }
      } catch (e) {}
    }
  }

  // Sort edits reverse chronologically
  allEdits.sort((a, b) => b.time - a.time);

  // Process each file
  for (const tfRelative of targetFiles) {
    const fullPath = path.resolve("c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem", tfRelative);
    const tfNormalized = fullPath.toLowerCase();

    console.log(`\n=========================================`);
    console.log(`Reconstructing: ${tfRelative}`);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`File does not exist currently: ${fullPath}`);
      continue;
    }

    let currentContent = fs.readFileSync(fullPath, 'utf8');
    const editsForFile = allEdits.filter(e => e.file === tfNormalized);

    console.log(`Found ${editsForFile.length} post-cutoff edit actions to undo.`);

    let success = true;
    for (const edit of editsForFile) {
      console.log(`  Undo [${edit.time.toISOString()}] Convo: ${edit.convoId}, Step: ${edit.stepIndex}, Tool: ${edit.tool}`);
      
      if (edit.tool === 'write_to_file') {
        // If write_to_file happened post-cutoff, then the file might have been created or completely overwritten post-cutoff.
        // We need to check if it existed before.
        console.log(`  WARNING: write_to_file detected. This means the file was fully overwritten or created.`);
        success = false;
        break;
      } else if (edit.tool === 'replace_file_content') {
        const target = edit.args.TargetContent;
        const replacement = edit.args.ReplacementContent;

        if (!replacement) {
          console.log(`  ERROR: ReplacementContent is empty or missing`);
          success = false;
          break;
        }

        // Find and replace ReplacementContent with TargetContent
        const idx = currentContent.indexOf(replacement);
        if (idx === -1) {
          console.log(`  ERROR: Could not find ReplacementContent in current file state.`);
          // Let's try to do a relaxed match or check if it's already reverted
          success = false;
          break;
        } else {
          // Verify uniqueness
          const lastIdx = currentContent.lastIndexOf(replacement);
          if (idx !== lastIdx) {
            console.log(`  WARNING: ReplacementContent is not unique in file. Multiple occurrences found.`);
          }
          currentContent = currentContent.substring(0, idx) + target + currentContent.substring(idx + replacement.length);
          console.log(`  Successfully replaced replacement with target.`);
        }
      } else if (edit.tool === 'multi_replace_file_content') {
        const chunks = edit.args.ReplacementChunks || edit.args.replacementChunks;
        if (!chunks || !Array.isArray(chunks)) {
          console.log(`  ERROR: chunks missing for multi_replace`);
          success = false;
          break;
        }
        
        // Chunks should be undone reverse-chronologically or we need to match them carefully
        // Let's sort chunks by their line numbers or simply reverse them
        const reversedChunks = [...chunks].reverse();
        for (const chunk of reversedChunks) {
          const target = chunk.TargetContent || chunk.targetContent;
          const replacement = chunk.ReplacementContent || chunk.replacementContent;
          const idx = currentContent.indexOf(replacement);
          if (idx === -1) {
            console.log(`  ERROR: Multi-replace chunk could not find replacement in file.`);
            success = false;
            break;
          } else {
            currentContent = currentContent.substring(0, idx) + target + currentContent.substring(idx + replacement.length);
          }
        }
        if (!success) break;
        console.log(`  Successfully undone multi-replace chunks.`);
      }
    }

    if (success) {
      const backupPath = fullPath + ".reconstructed";
      fs.writeFileSync(backupPath, currentContent, 'utf8');
      console.log(`SUCCESS! Reconstructed content written to: ${backupPath}`);
    } else {
      console.log(`FAILED to automatically reconstruct ${tfRelative}.`);
    }
  }
}

main().catch(console.error);
