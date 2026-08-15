const fs = require('fs');
const path = require('path');

const backupsBase = path.resolve(__dirname, '../backups/supabase');
const backupDirs = fs.readdirSync(backupsBase).filter(d => d.startsWith('backup_')).sort();
const latestBackupDir = path.join(backupsBase, backupDirs[backupDirs.length - 1]);
const jsonDir = path.join(latestBackupDir, 'json');

console.log(`Processing backup directory: ${latestBackupDir}`);

// 1. Consolidate all migrations
const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

let consolidatedSql = `-- =========================================================\n`;
consolidatedSql += `-- CONSOLIDATED SUPABASE SCHEMA MIGRATIONS (001 - ${migrationFiles[migrationFiles.length - 1]})\n`;
consolidatedSql += `-- Generated at: ${new Date().toISOString()}\n`;
consolidatedSql += `-- =========================================================\n\n`;

for (const file of migrationFiles) {
  const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
  consolidatedSql += `\n-- >>>>>>>>>>>>>>> FILE: ${file} <<<<<<<<<<<<<<<\n`;
  consolidatedSql += content;
  consolidatedSql += `\n\n`;
}

fs.writeFileSync(path.join(latestBackupDir, 'schema_consolidated_001_to_latest.sql'), consolidatedSql, 'utf-8');
console.log(`Saved consolidated schema SQL (${migrationFiles.length} migration files, ${(consolidatedSql.length / 1024).toFixed(1)} KB)`);

// 2. Generate SQL Data Inserts for Populated Tables
const jsonFiles = fs.readdirSync(jsonDir).filter(f => f.endsWith('.json'));
let totalRowsExported = 0;
let totalPopulatedTables = 0;

const sqlDumpPath = path.join(latestBackupDir, 'data_dump_inserts.sql');
const writeStream = fs.createWriteStream(sqlDumpPath, { encoding: 'utf-8' });

writeStream.write(`-- =========================================================\n`);
writeStream.write(`-- SUPABASE DATA DUMP (SQL INSERTS)\n`);
writeStream.write(`-- Generated at: ${new Date().toISOString()}\n`);
writeStream.write(`-- =========================================================\n\n`);

function escapeSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return Number.isFinite(val) ? val.toString() : 'NULL';
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

for (const file of jsonFiles) {
  const tableName = file.replace('.json', '');
  const data = JSON.parse(fs.readFileSync(path.join(jsonDir, file), 'utf-8'));
  
  if (Array.isArray(data) && data.length > 0) {
    totalPopulatedTables++;
    totalRowsExported += data.length;
    
    writeStream.write(`\n-- Table: public.${tableName} (${data.length} rows)\n`);
    
    // Chunk inserts into batches of 50
    const chunkSize = 50;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const cols = Object.keys(chunk[0]);
      
      const colList = cols.map(c => `"${c}"`).join(', ');
      writeStream.write(`INSERT INTO public."${tableName}" (${colList}) VALUES\n`);
      
      const valuesList = chunk.map(row => {
        const vals = cols.map(c => escapeSqlValue(row[c])).join(', ');
        return `  (${vals})`;
      }).join(',\n');
      
      writeStream.write(`${valuesList}\nON CONFLICT DO NOTHING;\n`);
    }
  }
}

writeStream.end(() => {
  console.log(`Saved SQL Inserts dump to: ${sqlDumpPath}`);
  console.log(`Populated Tables: ${totalPopulatedTables}, Total Rows: ${totalRowsExported.toLocaleString()}`);
});
