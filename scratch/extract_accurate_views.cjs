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
  const matchedViews = [];

  for (const folder of folders) {
    const folderPath = path.join(brainDir, folder);
    const stats = fs.statSync(folderPath);
    if (!stats.isDirectory()) continue;
    
    const transcriptPath = path.join(folderPath, '.system_generated', 'logs', 'transcript_full.jsonl');
    if (!fs.existsSync(transcriptPath)) continue;

    const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
    for (let i = 0; i < lines.length; i++) {
      try {
        const step = JSON.parse(lines[i]);
        if (step.source === 'MODEL' && step.tool_calls) {
          for (const call of step.tool_calls) {
            if (call.name === 'view_file') {
              const file = call.args.AbsolutePath || call.args.absolutePath || call.args.TargetFile || call.args.targetFile;
              if (!file) continue;

              const matchedTf = targetFiles.find(tf => path.normalize(file).toLowerCase().endsWith(path.normalize(tf).toLowerCase()));
              if (matchedTf) {
                // Find response in subsequent steps (usually i+1)
                let responseStep = null;
                for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
                  const s = JSON.parse(lines[j]);
                  if (s.step_index === step.step_index + 1 || (s.type === 'VIEW_FILE' || s.content && s.content.includes("File Path:"))) {
                    responseStep = s;
                    break;
                  }
                }

                if (responseStep && responseStep.content) {
                  const time = new Date(step.created_at);
                  const linesMatch = responseStep.content.match(/Total Lines:\s*(\d+)/);
                  const showingMatch = responseStep.content.match(/Showing lines\s*(\d+)\s*to\s*(\d+)/);
                  
                  matchedViews.push({
                    convoId: folder,
                    stepIndex: step.step_index,
                    time: time,
                    file: matchedTf,
                    pathOnDisk: file,
                    totalLines: linesMatch ? parseInt(linesMatch[1]) : null,
                    startLine: showingMatch ? parseInt(showingMatch[1]) : null,
                    endLine: showingMatch ? parseInt(showingMatch[2]) : null,
                    content: responseStep.content
                  });
                }
              }
            }
          }
        }
      } catch (e) {}
    }
  }

  // Sort views chronologically
  matchedViews.sort((a, b) => a.time - b.time);

  // Group by file
  for (const tf of targetFiles) {
    console.log(`\n=========================================`);
    console.log(`File: ${tf}`);
    
    const fileViews = matchedViews.filter(v => v.file === tf);
    const preCutoffViews = fileViews.filter(v => v.time <= cutoffTime);
    
    console.log(`  Total pre-cutoff views: ${preCutoffViews.length}`);

    // Look for a view that covers the whole file
    const fullView = [...preCutoffViews].reverse().find(v => v.startLine === 1 && v.endLine === v.totalLines);
    if (fullView) {
      const code = cleanCode(fullView.content);
      const outPath = path.join(outputDir, path.basename(tf));
      fs.writeFileSync(outPath, code, 'utf8');
      console.log(`  SUCCESS: Wrote full file to ${outPath} from convo ${fullView.convoId} step ${fullView.stepIndex} (${fullView.time.toISOString()})`);
    } else {
      console.log(`  No full pre-cutoff view found.`);
      // List ranges of available views
      for (const v of preCutoffViews) {
        console.log(`    - Convo: ${v.convoId}, Step: ${v.stepIndex}, Range: ${v.startLine}-${v.endLine} / ${v.totalLines}, Path: ${v.pathOnDisk}`);
      }
    }
  }
}

main().catch(console.error);
