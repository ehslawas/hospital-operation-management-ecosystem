const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = "C:\\Users\\60113\\.gemini\\antigravity\\brain";

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
            if (name === 'replace_file_content' || name === 'multi_replace_file_content' || name === 'write_to_file') {
              const file = args.TargetFile || args.targetFile;
              if (file && path.normalize(file).toLowerCase().endsWith('oxygenservice.ts')) {
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

  console.log(`Found ${edits.length} edits to oxygenService.ts:`);
  for (let i = 0; i < edits.length; i++) {
    const e = edits[i];
    console.log(`[${i+1}] ${e.time.toISOString()} Convo: ${e.convoId}, Step: ${e.stepIndex}, Tool: ${e.tool}`);
  }
}

main().catch(console.error);
