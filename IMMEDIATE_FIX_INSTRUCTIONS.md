# 🚨 IMMEDIATE FIX - Data Mapping Issue

## Problem
Your data shows `,,31.1,23.75,22-May-2028` instead of product names because CSV parsing fails when the "Tempoh Serahan" column contains commas.

## **BEST SOLUTION: Use Google Sheets API Key** ⭐

This completely avoids CSV parsing issues:

1. **Get Google Sheets API Key:**
   - Go to: https://console.cloud.google.com/
   - Create/Select a project
   - Enable "Google Sheets API"
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Copy the key

2. **Add API Key to Your Config:**
   - In Contract Catalog → Click **"Configure Sync"**
   - Paste the API key in the **"API Key"** field
   - Click **"Save"**
   - Click **"Sync Now"**

**This will use Google Sheets API v4 which returns proper JSON - NO CSV parsing issues!**

---

## Alternative: Code Fix (Skip Corrupted Rows)

If you can't use an API key, apply this fix:

### File: `src/services/pharmacy/googleSheetsService.ts`
### Line: ~600 (after `if (!row || row.length === 0) continue`)

**REPLACE THIS:**
```typescript
    const contract: ContractRow = {
      contract_name: contractNameIdx >= 0 && row[contractNameIdx]
        ? String(row[contractNameIdx]).trim()
        : ``,
    }

    // Default name if missing or empty
    if (!contract.contract_name || contract.contract_name.length < 2) {
```

**WITH THIS:**
```typescript
    // Extract contract_name FIRST to validate data integrity
    const contractNameRaw = contractNameIdx >= 0 && contractNameIdx < row.length 
      ? String(row[contractNameIdx] || '').trim() 
      : '';

    // CRITICAL FIX: Detect corrupted rows (CSV parsing failure)
    const hasMultipleLeadingCommas = contractNameRaw.startsWith(',,') || contractNameRaw.startsWith(',');
    const looksLikeConcatenatedData = contractNameRaw.includes(',') && /[\d.]+/.test(contractNameRaw) && (contractNameRaw.match(/,/g) || []).length > 1;
    const isOnlyNumbersAndCommas = /^[\d,.\-\s]+$/.test(contractNameRaw) && contractNameRaw.includes(',');

    if (hasMultipleLeadingCommas || looksLikeConcatenatedData || isOnlyNumbersAndCommas) {
      if (i <= headerRowIndex + 5) {
        console.error(`❌ Row ${i + 1}: SKIPPING CORRUPTED ROW. CSV parsing failed.`);
        console.error(`   Value: ${JSON.stringify(contractNameRaw)}`);
        console.error(`   SOLUTION: Use Google Sheets API key to avoid CSV parsing issues.`);
      }
      continue; // Skip corrupted row
    }

    const contract: ContractRow = {
      contract_name: contractNameRaw || ``,
    }

    // Default name if missing or empty
    if (!contract.contract_name || contract.contract_name.length < 2) {
```

---

## What This Does

1. ✅ Detects corrupted rows (values like `,,31.1,23.75,22-May-2028`)
2. ✅ Skips corrupted rows instead of showing wrong data
3. ✅ Logs warnings so you can see what's being skipped
4. ✅ Processes only valid rows

## After Applying Fix

- Corrupted rows will be skipped (you'll see warnings in console)
- Valid rows with proper product names will display correctly
- You'll lose some data rows until you use API key

**RECOMMENDATION: Get the API key - it's the proper solution that fixes everything!**
