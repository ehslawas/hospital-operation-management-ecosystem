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
              if (file) {
                const matched = targetFiles.find(tf => path.normalize(file).toLowerCase().endsWith(path.normalize(tf).toLowerCase()));
                if (matched) {
                  edits.push({
                    file: matched,
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
        }
      } catch (e) {}
    }
  }

  // Sort chronologically
  edits.sort((a, b) => a.time - b.time);

  // Group by file
  for (const tf of targetFiles) {
    console.log(`\n=========================================`);
    console.log(`Edits history for: ${tf}`);
    const fileEdits = edits.filter(e => e.file === tf);
    const pre = fileEdits.filter(e => e.time <= cutoffTime);
    const post = fileEdits.filter(e => e.time > cutoffTime);

    console.log(`Pre-cutoff edits count: ${pre.length}`);
    for (const e of pre) {
      console.log(`  [${e.time.toISOString()}] Convo: ${e.convoId}, Step: ${e.stepIndex}, Tool: ${e.tool}`);
    }
    console.log(`Post-cutoff edits count: ${post.length}`);
    for (const e of post) {
      console.log(`  [${e.time.toISOString()}] Convo: ${e.convoId}, Step: ${e.stepIndex}, Tool: ${e.tool}`);
    }
  }
}

main().catch(console.error);
