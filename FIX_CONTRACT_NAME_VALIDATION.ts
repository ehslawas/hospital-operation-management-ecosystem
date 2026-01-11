// CRITICAL FIX: Add this code RIGHT AFTER line 600 in googleSheetsService.ts
// Replace lines 600-615 with this:

    if (!row || row.length === 0) continue

    // Extract contract_name FIRST to validate data integrity
    const contractNameRaw = contractNameIdx >= 0 && contractNameIdx < row.length 
      ? String(row[contractNameIdx] || '').trim() 
      : '';

    // CRITICAL: Detect corrupted rows (CSV parsing failure due to unquoted commas)
    // Corrupted patterns: ",,31.1,23.75,22-May-2028" or starts with comma or contains multiple commas + numbers
    const hasMultipleLeadingCommas = contractNameRaw.startsWith(',,') || contractNameRaw.startsWith(',');
    const looksLikeConcatenatedData = contractNameRaw.includes(',') && /[\d.]+/.test(contractNameRaw) && contractNameRaw.match(/,/g)?.length > 1;
    const isOnlyNumbersAndCommas = /^[\d,.\-\s]+$/.test(contractNameRaw) && contractNameRaw.includes(',');

    if (hasMultipleLeadingCommas || looksLikeConcatenatedData || isOnlyNumbersAndCommas) {
      // Log first few corrupted rows for debugging
      if (i <= headerRowIndex + 5) {
        console.error(`❌ Row ${i + 1}: SKIPPING CORRUPTED ROW. CSV parsing failed.`);
        console.error(`   Raw value at contract_name index (${contractNameIdx}):`, JSON.stringify(contractNameRaw));
        console.error(`   Full row (first 10 columns):`, row.slice(0, 10).map((v, idx) => `[${idx}]=${JSON.stringify(String(v).substring(0, 30))}`).join(', '));
        console.error(`   SOLUTION: Use Google Sheets API key instead of CSV export to avoid this issue.`);
      }
      continue; // Skip this corrupted row
    }

    const contract: ContractRow = {
      contract_name: contractNameRaw || ``,
    }

    // Default name if missing or empty (but not corrupted - we already skipped those)
    if (!contract.contract_name || contract.contract_name.length < 2) {
      if (contractNumberIdx >= 0 && contractNumberIdx < row.length && row[contractNumberIdx]) {
        contract.contract_name = String(row[contractNumberIdx]).trim()
      } else {
        // Skip rows that can't even provide a contract number
        if (i <= headerRowIndex + 5) {
          console.warn(`⚠️ Row ${i + 1}: Empty contract name and contract number, skipping row`);
        }
        continue; // Skip completely empty rows
      }
    }
