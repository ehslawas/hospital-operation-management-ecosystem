const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = "C:\\Users\\60113\\.gemini\\antigravity\\brain";
const cutoffTime = new Date("2026-06-13T20:16:00+08:00"); // 13/6/2026 - 8:16 PM local time

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
              if (file && file.includes('hospital-operation-management-ecosystem') && !file.includes('scratch')) {
                edits.push({
                  file: path.normalize(file).toLowerCase(),
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

  const preCutoffEdits = edits.filter(e => e.time <= cutoffTime);

  console.log(`Found ${preCutoffEdits.length} pre-cutoff edits to project files:`);
  
  const fileEditsMap = {};
  for (const e of preCutoffEdits) {
    if (!fileEditsMap[e.file]) {
      fileEditsMap[e.file] = [];
    }
    fileEditsMap[e.file].push(e);
  }

  for (const file in fileEditsMap) {
    console.log(`\nFile: ${file} (${fileEditsMap[file].length} edits):`);
    for (const e of fileEditsMap[file]) {
      console.log(`  - [${e.time.toISOString()}] Convo: ${e.convoId}, Step: ${e.stepIndex}, Tool: ${e.tool}`);
    }
  }
}

main().catch(console.error);
