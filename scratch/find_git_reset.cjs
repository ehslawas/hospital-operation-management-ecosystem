const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = "C:\\Users\\60113\\.gemini\\antigravity\\brain";

async function main() {
  const folders = fs.readdirSync(brainDir);
  const commands = [];

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
        if (step.source === 'MODEL' && step.tool_calls) {
          for (const call of step.tool_calls) {
            if (call.name === 'run_command') {
              const cmd = call.args.CommandLine || call.args.commandLine;
              if (cmd && (cmd.includes('git') || cmd.includes('reset') || cmd.includes('checkout') || cmd.includes('restore'))) {
                commands.push({
                  cmd,
                  time: new Date(step.created_at),
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

  commands.sort((a, b) => a.time - b.time);
  console.log(`Found ${commands.length} git commands in history:`);
  for (const c of commands) {
    console.log(`  - [${c.time.toISOString()}] Convo: ${c.convoId}, Step: ${c.stepIndex}, Cmd: "${c.cmd}"`);
  }
}

main().catch(console.error);
