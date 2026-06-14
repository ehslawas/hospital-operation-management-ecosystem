const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = "C:\\Users\\60113\\.gemini\\antigravity\\brain";
const targetConvs = [
  '77b5407c-6b7a-4a91-a9cb-55a84fa47bd0',
  '84800c77-fddb-456d-a6f9-2e9e4331922d',
  'd6d6af42-1351-428d-bb3d-3aef932cdc4d',
  'dfc11716-e145-44ae-b815-ed363b98c3e4'
];
const cutoffTime = new Date("2026-06-13T20:16:00+08:00");

async function main() {
  for (const convoId of targetConvs) {
    const transcriptPath = path.join(brainDir, convoId, '.system_generated', 'logs', 'transcript_full.jsonl');
    if (!fs.existsSync(transcriptPath)) {
      console.log(`Convo ${convoId} has no transcript_full.jsonl`);
      continue;
    }
    const fileStream = fs.createReadStream(transcriptPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    console.log(`\nTools called in convo ${convoId} after cutoff:`);
    for await (const line of rl) {
      try {
        const step = JSON.parse(line);
        const stepTime = new Date(step.created_at);
        if (stepTime <= cutoffTime) continue;

        if (step.source === 'MODEL' && step.tool_calls) {
          for (const call of step.tool_calls) {
            console.log(`  * Step ${step.step_index} (${step.created_at}): ${call.name} with args:`, JSON.stringify(call.args));
          }
        }
      } catch (e) {}
    }
  }
}

main().catch(console.error);
