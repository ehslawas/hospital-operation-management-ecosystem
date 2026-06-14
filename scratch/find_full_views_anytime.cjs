const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = "C:\\Users\\60113\\.gemini\\antigravity\\brain";
const outFile = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\scratch\\views_anytime.txt";

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
              const linesMatch = step.content.match(/Total Lines:\s*(\d+)/);
              const showingMatch = step.content.match(/Showing lines\s*(\d+)\s*to\s*(\d+)/);
              
              views.push({
                convoId: folder,
                stepIndex: step.step_index,
                time: time,
                file: tf,
                totalLines: linesMatch ? parseInt(linesMatch[1]) : null,
                startLine: showingMatch ? parseInt(showingMatch[1]) : null,
                endLine: showingMatch ? parseInt(showingMatch[2]) : null,
                contentLength: step.content.length
              });
            }
          }
        }
      } catch (e) {}
    }
  }

  views.sort((a, b) => a.time - b.time);

  let output = "";
  for (const tf of targetFiles) {
    output += `\n=========================================\n`;
    output += `Views for: ${tf}\n`;
    const fileViews = views.filter(v => v.file === tf);
    output += `Total views found: ${fileViews.length}\n`;
    for (const v of fileViews) {
      const isFull = v.startLine === 1 && v.endLine === v.totalLines;
      output += `  [${v.time.toISOString()}] Convo: ${v.convoId}, Step: ${v.stepIndex}, Range: ${v.startLine}-${v.endLine} / ${v.totalLines} (Full: ${isFull})\n`;
    }
  }

  fs.writeFileSync(outFile, output, 'utf8');
  console.log(`Saved output to ${outFile}`);
}

main().catch(console.error);
