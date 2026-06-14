const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = "C:\\Users\\60113\\.gemini\\antigravity\\brain";

async function main() {
  const folders = fs.readdirSync(brainDir);
  const matches = [];

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
        if (line.includes('getOxygenPricingConfig')) {
          matches.push({
            convoId: folder,
            stepIndex: step.step_index,
            created_at: step.created_at,
            type: step.type,
            source: step.source
          });
        }
      } catch (e) {}
    }
  }

  console.log(`Found ${matches.length} references to getOxygenPricingConfig in transcripts:`);
  for (const m of matches) {
    console.log(`  - Convo: ${m.convoId}, Step: ${m.stepIndex}, Time: ${m.created_at}, Source: ${m.source}, Type: ${m.type}`);
  }
}

main().catch(console.error);
