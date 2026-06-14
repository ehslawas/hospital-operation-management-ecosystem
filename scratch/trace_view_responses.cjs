const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = "C:\\Users\\60113\\.gemini\\antigravity\\brain";
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
  const records = [];

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

        // Check model tool call
        if (step.source === 'MODEL' && step.tool_calls) {
          for (const call of step.tool_calls) {
            const file = call.args.TargetFile || call.args.targetFile || call.args.AbsolutePath || call.args.absolutePath;
            if (file) {
              const matched = targetFiles.find(tf => path.normalize(file).toLowerCase().endsWith(path.normalize(tf).toLowerCase()));
              if (matched) {
                records.push({
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

        // Check if this step is a tool response (content containing file data)
        // Usually, the step following the MODEL call is the response.
        // Let's also search for typical view_file outputs in the content field.
        if (step.content && step.content.includes("File Path:")) {
          for (const tf of targetFiles) {
            const testStr = tf.replace(/\//g, '\\\\');
            const testStr2 = tf.replace(/\//g, '/');
            if (step.content.toLowerCase().includes(testStr.toLowerCase()) || step.content.toLowerCase().includes(testStr2.toLowerCase())) {
              records.push({
                convoId: folder,
                stepIndex: step.step_index,
                time: time,
                type: 'VIEW_CONTENT',
                file: tf,
                length: step.content.length,
                snippet: step.content.substring(0, 150).replace(/\n/g, ' ')
              });
            }
          }
        }
      } catch (e) {}
    }
  }

  // Sort chronologically
  records.sort((a, b) => a.time - b.time);

  console.log(`Found ${records.length} records in transcripts.`);
  // Write records to a file for easier inspection
  const outPath = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\scratch\\target_records.txt";
  let outStr = "";
  for (const r of records) {
    outStr += `[${r.time.toISOString()}] Convo: ${r.convoId}, Step: ${r.stepIndex}, File: ${r.file}, Type: ${r.type}\n`;
    if (r.type === 'CALL') {
      outStr += `  Tool: ${r.tool}, Args: ${JSON.stringify(r.args)}\n`;
    } else {
      outStr += `  Len: ${r.length}, Snippet: ${r.snippet}\n`;
    }
  }
  fs.writeFileSync(outPath, outStr, 'utf8');
  console.log(`Saved records to ${outPath}`);
}

main().catch(console.error);
