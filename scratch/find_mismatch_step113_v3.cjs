const fs = require('fs');

const transcriptPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\logs\\transcript_full.jsonl";
const targetFilePath = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\src\\pages\\pharmacy\\oxygen\\OxygenDashboardPage.tsx";

const stepsToUndo = [239, 235, 163, 151, 145, 137, 113, 85, 75];

function cleanLines(str) {
  return str.replace(/\r\n/g, '\n').replace(/\r/g, '').split('\n');
}

function cleanContent(content) {
  let cleaned = content;
  if (cleaned.charCodeAt(0) === 0xFEFF) {
    cleaned = cleaned.substring(1);
  }
  return cleaned.replace(/\r/g, '');
}

function findHunkRange(fileLines, repLines) {
  if (repLines.length === 0) return -1;
  
  for (let i = 0; i <= fileLines.length - repLines.length; i++) {
    let match = true;
    for (let j = 0; j < repLines.length; j++) {
      if (fileLines[i + j].trim() !== repLines[j].trim()) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
}

async function main() {
  const transcriptLines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
  const stepMap = {};

  for (const line of transcriptLines) {
    try {
      const step = JSON.parse(line);
      if (stepsToUndo.includes(step.step_index) && step.tool_calls) {
        for (const call of step.tool_calls) {
          if (call.name === 'replace_file_content') {
            const file = call.args.TargetFile || call.args.targetFile;
            if (file && file.includes("OxygenDashboardPage.tsx")) {
              stepMap[step.step_index] = {
                target: cleanLines(call.args.TargetContent || call.args.targetContent || ''),
                replacement: cleanLines(call.args.ReplacementContent || call.args.replacementContent || '')
              };
            }
          }
        }
      }
    } catch (e) {}
  }

  const baseFilePath = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\scratch\\02ab1e6_utf8.tsx";
  const diffLfPath = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\scratch\\diff_utf8_lf.txt";
  
  const baseContent = fs.readFileSync(baseFilePath, 'utf8');
  fs.writeFileSync(targetFilePath, cleanContent(baseContent), 'utf8');
  const { execSync } = require('child_process');
  execSync(`git apply --ignore-whitespace --whitespace=nowarn "${diffLfPath}"`, { stdio: 'inherit' });

  let fileContent = fs.readFileSync(targetFilePath, 'utf8').replace(/┬│/g, '³');
  let fileLines = fileContent.replace(/\r/g, '').split('\n');

  for (const idx of stepsToUndo) {
    let { target, replacement } = stepMap[idx];
    if (idx === 235) {
      if (replacement[replacement.length - 1].trim() === ')') {
        replacement[replacement.length - 1] = replacement[replacement.length - 1] + '>';
      }
    }

    if (idx === 145) {
      for (let j = 0; j < replacement.length; j++) {
        if (replacement[j].trim() === '</div>' && j === 221) {
          replacement[j] = "                  </div>          </div>";
        }
      }
    }

    if (idx === 113) {
      replacement = [
        "                  )}",
        "                </>",
        "              );",
        "            })()}",
        "          </div>",
        "        </div>",
        "      )",
        "        </div>",
        "      </div>",
        "      )",
        "    }"
      ];
    }

    const startIdx = findHunkRange(fileLines, replacement);
    if (startIdx === -1) {
      console.log(`Failed at step ${idx}!`);
      return;
    }

    fileLines.splice(startIdx, replacement.length, ...target);
    console.log(`Successfully reverted step ${idx}`);
  }

  console.log("Success in memory up to step 113!");
}

main().catch(console.error);
