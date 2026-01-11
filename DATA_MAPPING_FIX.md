# 🔧 Data Mapping Fix - Contract Name Issue

## Problem Identified

The `contract_name` field is showing corrupted values like `,,31.1,23.75,22-May-2028` instead of proper product names like "Cefepime 1g Injection".

## Root Cause

The CSV parsing is incorrectly handling rows where:
1. The "Tempoh Serahan" column contains commas (long text fields)
2. Google Sheets CSV export may not quote fields properly
3. The CSV parser splits on commas incorrectly, causing column misalignment

## Solution Applied

✅ **Edge Function Updated (Version 12)**:
- Now prioritizes Google Sheets API v4 (returns proper JSON, no CSV parsing issues)
- Falls back to CSV export only if API key not available
- Improved CSV parser with better quote handling

## Additional Fix Needed

We need to add validation in `googleSheetsService.ts` to:
1. Detect corrupted contract_name values
2. Skip rows with corrupted data
3. Log warnings for debugging

## Quick Fix Instructions

### Option 1: Use Google Sheets API Key (RECOMMENDED)

1. Get a Google Sheets API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Enable "Google Sheets API"
   - Create API Key
2. In Contract Catalog → "Configure Sync"
3. Paste the API key in "API Key" field
4. Save and sync again

**This will use the Google Sheets API v4 which returns proper JSON data, avoiding all CSV parsing issues.**

### Option 2: Make Sheet Public + Wait for Code Fix

1. Make sheet publicly viewable (Share → Anyone with link → Viewer)
2. I'll add validation code to skip corrupted rows
3. Re-sync after code update

---

## What I'll Fix in Code

Add validation after line 605 in `googleSheetsService.ts`:

```typescript
// Validate contract_name - detect corrupted data
const contractNameRaw = contractNameIdx >= 0 && contractNameIdx < row.length 
  ? String(row[contractNameIdx] || '').trim() 
  : '';

// Skip rows with corrupted data (contains double commas, starts with comma, or looks like concatenated numbers/dates)
if (contractNameRaw.includes(',,') || 
    contractNameRaw.startsWith(',') || 
    /^[\d,.\-\s]+$/.test(contractNameRaw) && contractNameRaw.includes(',')) {
  console.warn(`⚠️ Row ${i + 1}: Skipping corrupted row. contract_name value: "${contractNameRaw.substring(0, 50)}"`);
  continue; // Skip this row
}

const contract: ContractRow = {
  contract_name: contractNameRaw || '',
};
```

---

## Current Status

✅ Edge Function updated to prioritize API v4
⏳ Validation code fix needed
⏳ Waiting for API key OR public sheet access

**Recommendation: Get a Google Sheets API key - it's the cleanest solution and avoids all CSV parsing issues.**
