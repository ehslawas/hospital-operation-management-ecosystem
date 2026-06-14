const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Running git fsck to find dangling blobs...");
  let fsckOut = "";
  try {
    fsckOut = execSync("git fsck --lost-found", { encoding: 'utf8' });
  } catch (e) {
    fsckOut = e.stdout + "\n" + e.stderr;
  }
  
  console.log("FSCK Output length:", fsckOut.length);
  const lines = fsckOut.split('\n');
  const blobs = [];
  for (const line of lines) {
    if (line.includes('dangling blob')) {
      const parts = line.trim().split(/\s+/);
      const hash = parts[parts.length - 1];
      blobs.push(hash);
    }
  }

  console.log(`Found ${blobs.length} dangling blobs:`);
  
  // Check lost-found directory
  const lostFoundDir = ".git/lost-found/other";
  if (fs.existsSync(lostFoundDir)) {
    const files = fs.readdirSync(lostFoundDir);
    console.log(`Lost-found dir exists and has ${files.length} files.`);
    for (const f of files) {
      const content = fs.readFileSync(path.join(lostFoundDir, f), 'utf8');
      console.log(`  File: ${f}, Length: ${content.length}, Start: ${JSON.stringify(content.substring(0, 80))}`);
    }
  } else {
    console.log("Lost-found dir does not exist. We will query blobs directly via cat-file.");
    for (const hash of blobs) {
      try {
        const content = execSync(`git cat-file -p ${hash}`, { encoding: 'utf8' });
        console.log(`  Blob ${hash}: Length: ${content.length}, Start: ${JSON.stringify(content.substring(0, 80))}`);
        // Save to scratch
        fs.writeFileSync(`scratch/dangling_${hash}.txt`, content, 'utf8');
      } catch (err) {}
    }
  }
}

main().catch(console.error);
