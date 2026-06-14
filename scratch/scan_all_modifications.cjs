const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = "C:\\Users\\60113\\.gemini\\antigravity\\brain";
const cutoffTime = new Date("2026-06-13T20:16:00+08:00"); // 13/6/2026 - 8:16 PM local time
const logFile = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\scratch\\all_modifications.txt";

async function main() {
  const folders = fs.readdirSync(brainDir);
  const targetConversations = [];

  for (const folder of folders) {
    const folderPath = path.join(brainDir, folder);
    const stats = fs.statSync(folderPath);
    if (!stats.isDirectory()) continue;
    
    const transcriptPath = path.join(folderPath, '.system_generated', 'logs', 'transcript_full.jsonl');
    if (!fs.existsSync(transcriptPath)) continue;

    // Check if the file has any modifications after cutoff time
    const fileStream = fs.createReadStream(transcriptPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let hasPostCutoff = false;
    for await (const line of rl) {
      try {
        const step = JSON.parse(line);
        if (step.created_at) {
          const t = new Date(step.created_at);
          if (t > cutoffTime) {
            hasPostCutoff = true;
            break;
          }
        }
      } catch (e) {}
    }
    
    if (hasPostCutoff) {
      targetConversations.push(folder);
    }
  }

  let output = `Found ${targetConversations.length} conversations containing logs after cutoff time:\n${targetConversations.join('\n')}\n\n`;

  const fileModifications = {};

  for (const convoId of targetConversations) {
    const transcriptPath = path.join(brainDir, convoId, '.system_generated', 'logs', 'transcript_full.jsonl');
    const fileStream = fs.createReadStream(transcriptPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      try {
        const step = JSON.parse(line);
        const stepTime = new Date(step.created_at);
        if (stepTime <= cutoffTime) continue; // Skip steps before/at cutoff

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
                  convoId: convoId,
                  stepIndex: step.step_index,
                  tool: name,
                  args: args,
                  time: step.created_at
                });
              }
            }
          }
        }
      } catch (e) {}
    }
  }

  output += "Modified Files List after cutoff:\n";
  for (const file in fileModifications) {
    output += `- ${file} (${fileModifications[file].length} modifications)\n`;
    for (const mod of fileModifications[file]) {
      output += `  * Convo: ${mod.convoId}, Step: ${mod.stepIndex}, Tool: ${mod.tool}, Time: ${mod.time}\n`;
    }
  }

  fs.writeFileSync(logFile, output, 'utf8');
  console.log(`Saved output to ${logFile}`);
}

main().catch(console.error);
