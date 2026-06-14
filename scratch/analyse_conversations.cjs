const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = "C:\\Users\\60113\\.gemini\\antigravity\\brain";
const cutoffTime = new Date("2026-06-13T20:16:00+08:00"); // 13/6/2026 - 8:16 PM local time

async function main() {
  const folders = fs.readdirSync(brainDir);
  const targetConversations = [];

  for (const folder of folders) {
    const folderPath = path.join(brainDir, folder);
    const stats = fs.statSync(folderPath);
    if (stats.isDirectory() && stats.mtime > cutoffTime) {
      targetConversations.push({
        id: folder,
        mtime: stats.mtime
      });
    }
  }

  console.log(`Found ${targetConversations.length} conversations modified after cutoff time:`);
  for (const convo of targetConversations) {
    console.log(`- ${convo.id} (last modified: ${convo.mtime.toLocaleString()})`);
  }

  // Trace file modifications
  const fileModifications = {};

  for (const convo of targetConversations) {
    const transcriptPath = path.join(brainDir, convo.id, '.system_generated', 'logs', 'transcript_full.jsonl');
    if (!fs.existsSync(transcriptPath)) continue;

    const fileStream = fs.createReadStream(transcriptPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      try {
        const step = JSON.parse(line);
        if (step.source === 'MODEL' && step.tool_calls) {
          for (const call of step.tool_calls) {
            const name = call.name;
            const args = call.args;
            if (name === 'write_to_file' || name === 'replace_file_content' || name === 'multi_replace_file_content') {
              const file = args.TargetFile || args.targetFile;
              if (file) {
                const normalized = path.normalize(file).toLowerCase();
                if (!fileModifications[normalized]) {
                  fileModifications[normalized] = [];
                }
                fileModifications[normalized].push({
                  convoId: convo.id,
                  stepIndex: step.step_index,
                  tool: name,
                  args: args,
                  time: step.created_at
                });
              }
            }
          }
        }
      } catch (e) {
        // Parse error
      }
    }
  }

  console.log("\nModified Files List:");
  for (const file in fileModifications) {
    console.log(`- ${file} (${fileModifications[file].length} modifications)`);
    for (const mod of fileModifications[file]) {
      console.log(`  * Convo: ${mod.convoId}, Step: ${mod.stepIndex}, Tool: ${mod.tool}, Time: ${mod.time}`);
    }
  }
}

main().catch(console.error);
