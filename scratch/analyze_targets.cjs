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
].map(f => path.normalize(f).toLowerCase());

async function main() {
  const folders = fs.readdirSync(brainDir);
  const allSteps = [];

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
        if (step.created_at) {
          allSteps.push({
            convoId: folder,
            stepIndex: step.step_index,
            type: step.type,
            source: step.source,
            createdAt: new Date(step.created_at),
            toolCalls: step.tool_calls || [],
            toolResponse: step.content || "" // For view_file output, etc.
          });
        }
      } catch (e) {}
    }
  }

  // Sort all steps globally by timestamp
  allSteps.sort((a, b) => a.createdAt - b.createdAt);

  const fileActions = {};
  for (const tf of targetFiles) {
    fileActions[tf] = [];
  }

  for (const step of allSteps) {
    // Check model tool calls
    if (step.source === 'MODEL' && step.toolCalls) {
      for (const call of step.toolCalls) {
        const file = call.args.TargetFile || call.args.targetFile || call.args.AbsolutePath || call.args.absolutePath;
        if (file) {
          const normFile = path.normalize(file).toLowerCase();
          // Check if this normalized path ends with one of our target files
          const matchedTarget = targetFiles.find(tf => normFile.endsWith(tf));
          if (matchedTarget) {
            fileActions[matchedTarget].push({
              time: step.createdAt,
              convoId: step.convoId,
              stepIndex: step.stepIndex,
              type: 'CALL',
              tool: call.name,
              args: call.args
            });
          }
        }
      }
    }
    
    // Check system tool responses (view_file content is returned in subsequent planner response or system/tool step)
    // Wait, in transcript, the tool output is often in step.content when source is SYSTEM or type is TOOL_RESPONSE.
    // Let's look for how tool outputs are structured.
  }

  // Write out actions list
  for (const tf of targetFiles) {
    console.log(`\n=========================================`);
    console.log(`Actions for ${tf}:`);
    for (const act of fileActions[tf]) {
      console.log(`[${act.time.toISOString()}] Convo: ${act.convoId}, Step: ${act.stepIndex}, Tool: ${act.tool}`);
      if (act.tool === 'write_to_file') {
        console.log(`  - write_to_file (size: ${act.args.CodeContent ? act.args.CodeContent.length : 0} chars)`);
      } else if (act.tool === 'replace_file_content') {
        console.log(`  - replace_file_content: "${act.args.TargetContent.substring(0, 40).replace(/\n/g, ' ')}..." -> "${act.args.ReplacementContent.substring(0, 40).replace(/\n/g, ' ')}..."`);
      } else if (act.tool === 'view_file') {
        console.log(`  - view_file: lines ${act.args.StartLine || 'start'} to ${act.args.EndLine || 'end'}`);
      }
    }
  }
}

main().catch(console.error);
