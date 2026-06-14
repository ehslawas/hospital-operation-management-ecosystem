const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = "C:\\Users\\60113\\.gemini\\antigravity\\brain";

async function main() {
  const folders = fs.readdirSync(brainDir);
  console.log(`Scanning ${folders.length} folders...`);
  
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
            const args = call.args;
            const file = args.TargetFile || args.targetFile || args.AbsolutePath || args.absolutePath;
            if (file && file.toLowerCase().includes('oxygenservice.ts')) {
              console.log(`Convo: ${folder}, Step: ${step.step_index}, Time: ${step.created_at}, Tool: ${call.name}, Args:`, JSON.stringify(args).substring(0, 150));
            }
          }
        }
      } catch (e) {}
    }
  }
}

main().catch(console.error);
