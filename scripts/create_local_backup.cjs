const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

// Create backup destination directory outside and inside workspace
const outsideBackupDir = path.resolve(rootDir, '../hospital_ecosystem_local_backups');
if (!fs.existsSync(outsideBackupDir)) {
  fs.mkdirSync(outsideBackupDir, { recursive: true });
}

console.log(`Creating Local Full Backup...`);
console.log(`Backup Destination: ${outsideBackupDir}`);

// 1. Create Git Bundle (Contains 100% of commits, branches, tags, git objects)
const bundlePath = path.join(outsideBackupDir, `git_bundle_${timestamp}.bundle`);
console.log(`Generating Git Bundle to: ${bundlePath}`);
try {
  execSync(`git bundle create "${bundlePath}" --all`, { cwd: rootDir, stdio: 'inherit' });
  execSync(`git bundle verify "${bundlePath}"`, { cwd: rootDir, stdio: 'inherit' });
  console.log(`Git Bundle successfully verified!`);
} catch (err) {
  console.error(`Git bundle error:`, err.message);
}

// 2. Create ZIP Archive of workspace source code
const zipPath = path.join(outsideBackupDir, `source_backup_${timestamp}.zip`);
console.log(`Creating ZIP Archive of source files to: ${zipPath}`);
try {
  // Use PowerShell with safe single-quoted or properly escaped arguments
  const items = ['src', 'public', 'supabase', 'scripts', 'backups', 'package.json', 'tsconfig.json', 'vite.config.ts', 'tailwind.config.js', 'index.html', '.env.example'];
  const itemsExisting = items.filter(item => fs.existsSync(path.join(rootDir, item)));
  const pathArgs = itemsExisting.map(i => `'${path.join(rootDir, i)}'`).join(',');
  const destArg = `'${zipPath}'`;
  
  const powershellCmd = `Compress-Archive -Path ${pathArgs} -DestinationPath ${destArg} -Force`;
  execSync(`powershell -NoProfile -Command "${powershellCmd}"`, { cwd: rootDir, stdio: 'inherit' });
  
  if (fs.existsSync(zipPath)) {
    const stats = fs.statSync(zipPath);
    console.log(`ZIP Archive created successfully! Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
  }
} catch (err) {
  console.error(`ZIP Archive error:`, err.message);
}

console.log(`\n========================================`);
console.log(`LOCAL BACKUP COMPLETED!`);
console.log(`Files created in ${outsideBackupDir}:`);
const backupFiles = fs.readdirSync(outsideBackupDir);
backupFiles.forEach(f => {
  const stat = fs.statSync(path.join(outsideBackupDir, f));
  console.log(` - ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
});
console.log(`========================================\n`);
