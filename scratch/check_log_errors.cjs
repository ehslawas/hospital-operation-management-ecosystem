const fs = require('fs');

const logPath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\cea9567b-b854-4b3f-9ea6-ac80bdb5ee1b\\.system_generated\\tasks\\task-1302.log";

async function main() {
  if (!fs.existsSync(logPath)) {
    console.log("Log file not found yet.");
    return;
  }
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  const errors = lines.filter(line => line.includes('OxygenDashboardPage.tsx'));
  
  console.log(`Found ${errors.length} compiler errors in OxygenDashboardPage.tsx:`);
  for (const err of errors) {
    console.log(err);
  }
}

main().catch(console.error);
