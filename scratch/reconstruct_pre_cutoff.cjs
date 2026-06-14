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
  const allEvents = [];

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
        if (!step.created_at) continue;
        const time = new Date(step.created_at);

        if (step.source === 'MODEL' && step.tool_calls) {
          for (const call of step.tool_calls) {
            const file = call.args.TargetFile || call.args.targetFile || call.args.AbsolutePath || call.args.absolutePath;
            if (file) {
              const matched = targetFiles.find(tf => path.normalize(file).toLowerCase().endsWith(path.normalize(tf).toLowerCase()));
              if (matched) {
                allEvents.push({
                  convoId: folder,
                  stepIndex: step.step_index,
                  time: time,
                  type: 'CALL',
                  tool: call.name,
                  file: matched,
                  args: call.args
                });
              }
            }
          }
        }

        if (step.content && step.content.includes("File Path:")) {
          for (const tf of targetFiles) {
            const testStr = tf.replace(/\//g, '\\\\');
            const testStr2 = tf.replace(/\//g, '/');
            if (step.content.toLowerCase().includes(testStr.toLowerCase()) || step.content.toLowerCase().includes(testStr2.toLowerCase())) {
              allEvents.push({
                convoId: folder,
                stepIndex: step.step_index,
                time: time,
                type: 'VIEW_CONTENT',
                file: tf,
                content: step.content
              });
            }
          }
        }
      } catch (e) {}
    }
  }

  allEvents.sort((a, b) => a.time - b.time);

  // Group events by file
  for (const tf of targetFiles) {
    console.log(`\n=========================================`);
    console.log(`Analyzing history for: ${tf}`);
    const fileEvents = allEvents.filter(e => e.file === tf);
    
    // Split into pre-cutoff and post-cutoff events
    const preCutoff = fileEvents.filter(e => e.time <= cutoffTime);
    const postCutoff = fileEvents.filter(e => e.time > cutoffTime);

    console.log(`Pre-cutoff events: ${preCutoff.length}, Post-cutoff events: ${postCutoff.length}`);

    // Print all pre-cutoff events
    console.log("Pre-cutoff events list:");
    for (const e of preCutoff) {
      if (e.type === 'CALL') {
        console.log(`  [${e.time.toISOString()}] Convo: ${e.convoId}, Step: ${e.stepIndex}, Tool: ${e.tool}`);
      } else {
        console.log(`  [${e.time.toISOString()}] Convo: ${e.convoId}, Step: ${e.stepIndex}, VIEW_CONTENT (length: ${e.content.length})`);
      }
    }

    // Let's check if there is a VIEW_CONTENT that contains the entire file before cutoff, or write_to_file
    const lastWrite = [...preCutoff].reverse().find(e => e.type === 'CALL' && e.tool === 'write_to_file');
    const lastFullView = [...preCutoff].reverse().find(e => e.type === 'VIEW_CONTENT' && !e.content.includes("Showing lines"));

    if (lastWrite) {
      console.log(`Found write_to_file pre-cutoff at ${lastWrite.time.toISOString()} (Convo: ${lastWrite.convoId}, Step: ${lastWrite.stepIndex})`);
    }
    if (lastFullView) {
      console.log(`Found full view_file output pre-cutoff at ${lastFullView.time.toISOString()} (Convo: ${lastFullView.convoId}, Step: ${lastFullView.stepIndex})`);
    }
  }
}

main().catch(console.error);
