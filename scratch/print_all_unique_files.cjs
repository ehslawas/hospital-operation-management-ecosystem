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
        if (step.source === 'MODEL' && step.tool_calls) {
          for (const call of step.tool_calls) {
            const name = call.name;
            const args = call.args;
            if (name === 'replace_file_content' || name === 'multi_replace_file_content' || name === 'write_to_file') {
              const file = args.TargetFile || args.targetFile;
              if (file && file.includes('hospital-operation-management-ecosystem') && !file.includes('scratch')) {
                edits.push(path.normalize(file).toLowerCase());
              }
            }
          }
        }
      } catch (e) {}
    }
  }

  const uniqueFiles = Array.from(new Set(edits));
  console.log(`Found ${uniqueFiles.length} unique project files edited in all conversations:`);
  for (const f of uniqueFiles) {
    console.log(`  - ${f}`);
  }
}

main().catch(console.error);
