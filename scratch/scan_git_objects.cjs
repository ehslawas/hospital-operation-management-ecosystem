const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const gitObjDir = ".git/objects";
const cutoffRecent = Date.now() - 7 * 24 * 60 * 60 * 1000; // Last 7 days

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fullPath = path.join(dir, f);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      // Ignore info and pack directories
      const base = path.basename(fullPath);
      if (base === 'info' || base === 'pack') continue;
      walkDir(fullPath, callback);
    } else {
      callback(fullPath, stat);
    }
  }
}

async function main() {
  if (!fs.existsSync(gitObjDir)) {
    console.error("Git objects directory not found.");
    return;
  }

  const recentObjects = [];

  walkDir(gitObjDir, (filePath, stat) => {
    const parts = filePath.split(path.sep);
    const fileName = parts[parts.length - 1];
    const dirName = parts[parts.length - 2];
    if (dirName.length === 2 && fileName.length === 38) {
      const sha1 = dirName + fileName;
      if (stat.mtimeMs > cutoffRecent) {
        recentObjects.push({
          sha1,
          mtime: stat.mtime,
          path: filePath
        });
      }
    }
  });

  console.log(`Found ${recentObjects.length} loose objects created/modified in the last 7 days:`);
  
  for (const obj of recentObjects) {
    try {
      const type = execSync(`git cat-file -t ${obj.sha1}`, { encoding: 'utf8' }).trim();
      if (type === 'blob') {
        const content = execSync(`git cat-file -p ${obj.sha1}`, { encoding: 'utf8' });
        console.log(`  - Blob ${obj.sha1} (mtime: ${obj.mtime.toISOString()}): size=${content.length}`);
        console.log(`    Snippet: ${JSON.stringify(content.substring(0, 150))}`);
        // Save to scratch
        fs.writeFileSync(`scratch/recovered_${obj.sha1}.txt`, content, 'utf8');
      } else {
        console.log(`  - Object ${obj.sha1} is type ${type} (mtime: ${obj.mtime.toISOString()})`);
      }
    } catch (e) {
      console.error(`    Error reading ${obj.sha1}:`, e.message);
    }
  }
}

main().catch(console.error);
