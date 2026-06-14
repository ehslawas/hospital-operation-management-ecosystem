const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = "C:\\Users\\60113\\.gemini\\antigravity\\brain";
const outputDir = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\scratch\\pre_cutoff_versions";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

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

function cleanCode(viewContent) {
  const lines = viewContent.split('\n');
  const codeLines = [];
  let startSaving = false;

  for (const line of lines) {
    if (line.startsWith("Showing lines ")) {
      startSaving = true;
      continue;
    }
    if (startSaving) {
      const match = line.match(/^(\d+):\s(.*)$/);
      if (match) {
        codeLines.push(match[2]);
      } else if (line.match(/^(\d+):$/)) {
        codeLines.push("");
      } else {
        if (line.includes("The above content shows the entire") || line.includes("The above content shows lines")) {
          break;
        }
      }
    }
  }
  return codeLines.join('\n');
}

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
              const linesMatch = step.content.match(/Total Lines:\s*(\d+)/);
              const showingMatch = step.content.match(/Showing lines\s*(\d+)\s*to\s*(\d+)/);
              
              allEvents.push({
                convoId: folder,
                stepIndex: step.step_index,
                time: time,
                type: 'VIEW_CONTENT',
                file: tf,
                content: step.content,
                totalLines: linesMatch ? parseInt(linesMatch[1]) : null,
                startLine: showingMatch ? parseInt(showingMatch[1]) : null,
                endLine: showingMatch ? parseInt(showingMatch[2]) : null
              });
            }
          }
        }
      } catch (e) {}
    }
  }

  // Sort events chronologically
  allEvents.sort((a, b) => a.time - b.time);

  for (const tf of targetFiles) {
    console.log(`\n=========================================`);
    console.log(`Analyzing: ${tf}`);
    
    const fileEvents = allEvents.filter(e => e.file === tf);
    if (fileEvents.length === 0) {
      console.log(`  No events found for this file.`);
      continue;
    }

    // Find the very first view_file response
    const firstView = fileEvents.find(e => e.type === 'VIEW_CONTENT');
    if (firstView) {
      console.log(`  First view at ${firstView.time.toISOString()} (Convo: ${firstView.convoId}, Step: ${firstView.stepIndex})`);
      console.log(`    Range: ${firstView.startLine}-${firstView.endLine} of ${firstView.totalLines}`);
      
      if (firstView.startLine === 1 && firstView.endLine === firstView.totalLines) {
        const code = cleanCode(firstView.content);
        const outPath = path.join(outputDir, path.basename(tf));
        fs.writeFileSync(outPath, code, 'utf8');
        console.log(`    SUCCESS: Wrote full first view to ${outPath}`);
      } else {
        console.log(`    First view is partial.`);
      }
    } else {
      console.log(`  No views found for this file.`);
    }

    // List all views for this file to see if we can piece them together or find a full one later
    const views = fileEvents.filter(e => e.type === 'VIEW_CONTENT');
    console.log(`  Total views: ${views.length}`);
    for (const v of views) {
      console.log(`    - Convo: ${v.convoId}, Step: ${v.stepIndex}, Range: ${v.startLine}-${v.endLine} of ${v.totalLines}, Time: ${v.time.toISOString()}`);
    }
  }
}

main().catch(console.error);
