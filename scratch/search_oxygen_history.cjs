const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainDir = "C:\\Users\\60113\\.gemini\\antigravity\\brain";
const outFile = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\scratch\\oxygen_history.txt";

async function main() {
  const folders = fs.readdirSync(brainDir);
  const events = [];

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
            const args = call.args;
            const file = args.TargetFile || args.targetFile || args.AbsolutePath || args.absolutePath;
            if (file && file.toLowerCase().includes('oxygendashboardpage.tsx')) {
              events.push({
                convoId: folder,
                stepIndex: step.step_index,
                time: time,
                type: 'CALL',
                tool: call.name,
                args: args
              });
            }
          }
        }

        if (step.content && step.content.includes("File Path:") && step.content.toLowerCase().includes('oxygendashboardpage.tsx')) {
          const showingMatch = step.content.match(/Showing lines\s*(\d+)\s*to\s*(\d+)/);
          events.push({
            convoId: folder,
            stepIndex: step.step_index,
            time: time,
            type: 'VIEW',
            startLine: showingMatch ? parseInt(showingMatch[1]) : null,
            endLine: showingMatch ? parseInt(showingMatch[2]) : null,
            content: step.content
          });
        }
      } catch (e) {}
    }
  }

  // Sort events chronologically
  events.sort((a, b) => a.time - b.time);

  let output = `Found ${events.length} total events for OxygenDashboardPage.tsx across all sessions.\n\n`;

  for (const e of events) {
    if (e.type === 'CALL') {
      output += `[${e.time.toISOString()}] Convo: ${e.convoId}, Step: ${e.stepIndex}, Tool: ${e.tool}\n`;
      if (e.tool === 'replace_file_content') {
        output += `  - replace_file_content: "${e.args.TargetContent.substring(0, 100).replace(/\n/g, ' ')}..." -> "${e.args.ReplacementContent.substring(0, 100).replace(/\n/g, ' ')}..."\n`;
      } else if (e.tool === 'multi_replace_file_content') {
        output += `  - multi_replace_file_content: ${e.args.ReplacementChunks ? e.args.ReplacementChunks.length : 0} chunks\n`;
      }
    } else {
      output += `[${e.time.toISOString()}] Convo: ${e.convoId}, Step: ${e.stepIndex}, VIEW: lines ${e.startLine}-${e.endLine}\n`;
    }
  }

  fs.writeFileSync(outFile, output, 'utf8');
  console.log(`Saved output to ${outFile}`);
}

main().catch(console.error);
