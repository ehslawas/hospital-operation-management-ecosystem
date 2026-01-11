// ==========================================================
// DEBUG PATCH FOR googleSheetsService.ts
// ==========================================================
// Add these console.log statements to diagnose the data mapping issue

// 1. ADD THIS RIGHT AFTER LINE 387 (after "if (!rows || rows.length === 0)")
console.log('🔍 ========= RAW DATA DEBUG =========')
console.log('Total rows received:', rows.length)
console.log('First 3 rows (raw):')
rows.slice(0, 3).forEach((row, idx) => {
  console.log(`Row ${idx}: [${row.length} columns]`, JSON.stringify(row))
})

// 2. ADD THIS RIGHT AFTER LINE 442 (after "const headers = rows[headerRowIndex]...")
console.log('📋 ========= HEADER DETECTION DEBUG =========')
console.log('Header row index:', headerRowIndex)
console.log('Headers detected:', headers)
console.log('Header row raw:', rows[headerRowIndex])

// 3. ADD THIS RIGHT AFTER LINE 596 (after "console.log('  SST:', sstIdx >= 0 ? `Column ${sstIdx}...`)")
console.log('\n📊 ========= FIRST DATA ROW DEBUG =========')
const firstDataRow = rows[headerRowIndex + 1]
if (firstDataRow) {
  console.log('First data row (raw):', firstDataRow)
  console.log('First data row length:', firstDataRow.length)
  console.log('contract_name will use index', contractNameIdx, 'which has value:', firstDataRow[contractNameIdx])
  console.log('Full row values:')
  firstDataRow.forEach((val, idx) => {
    console.log(`  [${idx}] ${headers[idx] || '(no header)'} = ${JSON.stringify(val)}`)
  })
}

// 4. ADD THIS IN THE ROW PROCESSING LOOP (after line 602, before "const contract: ContractRow = {")
if (i === headerRowIndex + 1) { // Only for first data row
  console.log('\n🔍 Processing first data row:', row)
  console.log('Extracting contract_name from index', contractNameIdx)
  console.log('Value at that index:', row[contractNameIdx])
}

//