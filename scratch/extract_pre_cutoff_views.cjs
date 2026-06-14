const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = "C:\\Users\\60113\\.gemini\\antigravity\\brain";
const cutoffTime = new Date("2026-06-13T20:16:00+08:00"); // 13/6/2026 - 8:16 PM local time
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
  // Extract lines from viewContent
  const lines = viewContent.split('\n');
  const codeLines = [];
  let startSaving = false;

  for (const line of lines) {
    if (line.startsWith("Showing lines ")) {
      startSaving = true;
      continue;
    }
    if (startSaving) {
      // Each line is in format "1: code" or "12: code"
      // Match the line number prefix
      const match = line.match(/^(\d+):\s(.*)$/);
      if (match) {
        codeLines.push(match[2]);
      } else if (line.match(/^(\d+):$/)) {
        codeLines.push("");
      } else {
        // If it doesn't match, it might be the end of the file view or something else.
        // But let's check if we hit the end
        if (line.includes("The above content shows the entire") || line.includes("The above content shows lines")) {
          break;
        }
        // If it's just a line without prefix (empty line or continuation), keep it or skip?
        // Usually view_file lines always have the prefix.
      }
    }
  }
  return codeLines.join('\n');
}

async function main() {
  const folders = fs.readdirSync(brainDir);
  const views = [];

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
        if (!step.created_at || !step.content) continue;
        const time = new Date(step.created_at);

        if (step.content.includes("File Path:")) {
          for (const tf of targetFiles) {
            const testStr = tf.replace(/\//g, '\\\\');
            const testStr2 = tf.replace(/\//g, '/');
            if (step.content.toLowerCase().includes(testStr.toLowerCase()) || step.content.toLowerCase().includes(testStr2.toLowerCase())) {
              // Extract line count and range
              const linesMatch = step.content.match(/Total Lines:\s*(\d+)/);
              const showingMatch = step.content.match(/Showing lines\s*(\d+)\s*to\s*(\d+)/);
              
              views.push({
                convoId: folder,
                stepIndex: step.step_index,
                time: time,
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

  // Sort views chronologically
  views.sort((a, b) => a.time - b.time);

  // Reconstruct target files
  for (const tf of targetFiles) {
    const fileViews = views.filter(v => v.file === tf);
    const preCutoffViews = fileViews.filter(v => v.time <= cutoffTime);

    console.log(`\nFile: ${tf}`);
    console.log(`Pre-cutoff views: ${preCutoffViews.length}`);

    // Look for a view that covers the whole file (startLine === 1 and endLine === totalLines)
    const fullView = [...preCutoffViews].reverse().find(v => v.startLine === 1 && v.endLine === v.totalLines);
    
    if (fullView) {
      const code = cleanCode(fullView.content);
      const outPath = path.join(outputDir, path.basename(tf));
      fs.writeFileSync(outPath, code, 'utf8');
      console.log(`  SUCCESS: Wrote full file view from convo ${fullView.convoId} step ${fullView.stepIndex} (${fullView.time.toISOString()}) to ${outPath}`);
    } else {
      console.log(`  No single full view found pre-cutoff.`);
      // Let's print the available pre-cutoff views and their ranges
      for (const v of preCutoffViews) {
        console.log(`    - Convo: ${v.convoId}, Step: ${v.stepIndex}, Time: ${v.time.toISOString()}, Range: ${v.startLine}-${v.endLine} / ${v.totalLines}`);
      }
    }
  }
}

main().catch(console.error);
