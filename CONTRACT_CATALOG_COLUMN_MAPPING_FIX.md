# Contract Catalog - Column Mapping Fix Summary

## Problem

Data in Contract Catalog is showing incorrectly - columns are misaligned, dates in wrong places, codes mixed up. This is caused by incorrect Excel column mapping during import.

## Root Cause

Previous Excel imports had incorrect column mapping because:
1. Missing contract-specific pattern matching for Malay headers
2. Generic column matching that didn't recognize "No Kontrak", "Kontrak Mula", "Kontrak Tamat", etc.
3. Data was stored in wrong database fields

## Solution Applied ✅

### 1. Enhanced Column Mapping (ExcelImport.tsx)
- ✅ Added contract-specific patterns for Malay headers:
  - `Item` → `item_name`
  - `No Kontrak` → `contract_number`
  - `Kontrak Mula` → `start_date`
  - `Kontrak Tamat` → `end_date`
  - `Pembekal` → `supplier_name`
  - `Unit` → `unit`
  - `Harga (RM)` → `unit_price`
  - `Tempoh Serahan` → `delivery_period`
  - `SST` → `sst_rate`

- ✅ Flexible matching handles:
  - Case variations (e.g., "NO KONTRAK" vs "No Kontrak")
  - Spacing variations (e.g., "No Kontrak" vs "No. Kontrak")
  - Format variations (e.g., "Harga (RM)" vs "Harga RM")

### 2. Improved Date Parsing (contractCatalogService.ts)
- ✅ Handles "DD-Mon-YYYY" format (e.g., "2-Sep-2025", "24-Oct-2025")
- ✅ Handles Excel date numbers
- ✅ Supports multiple date formats (DD/MM/YYYY, YYYY-MM-DD, etc.)
- ✅ Better error handling for invalid dates

### 3. Enhanced Price Parsing
- ✅ Removes "RM" prefix automatically (e.g., "RM 107.40" → 107.40)
- ✅ Removes commas (e.g., "1,107.40" → 1107.40)
- ✅ Proper number conversion with validation

### 4. Contract-Specific Validation
- ✅ Validates `contract_number` + `item_name` (not drug_code/drug_name)
- ✅ Different validation rules than drug/non-drug catalogs
- ✅ Proper filtering of invalid data

### 5. Fixed Column Alignment
- ✅ Preserves column positions in Excel
- ✅ Handles empty columns correctly
- ✅ Maintains data alignment during import

---

## Required Action: Clear and Re-import

### Step 1: Clear Existing Incorrect Data

**Option A: Clear ALL contracts (Recommended)**
```sql
-- In Supabase SQL Editor
DELETE FROM contracts 
WHERE hospital_id = 'YOUR_HOSPITAL_ID';
```

**Option B: Clear only clearly wrong contracts**
```sql
-- This deletes contracts with missing or malformed data
DELETE FROM contracts 
WHERE hospital_id = 'YOUR_HOSPITAL_ID'
  AND (
    item_name IS NULL 
    OR item_name = '' 
    OR contract_number IS NULL 
    OR contract_number = ''
    OR item_name LIKE '%,,%'  -- Likely misaligned
    OR contract_number LIKE '%,,%'  -- Likely misaligned
  );
```

**Option C: Review first, then delete**
```sql
-- See what needs to be fixed
SELECT 
  id,
  item_name,
  contract_number,
  start_date,
  end_date,
  supplier_name,
  unit,
  unit_price,
  created_at
FROM contracts
WHERE hospital_id = 'YOUR_HOSPITAL_ID'
ORDER BY created_at DESC
LIMIT 50;
```

### Step 2: Prepare Your Excel File

Your Excel file should have these **exact headers** (in any order):

| Column Header | Required | Example Value |
|--------------|----------|---------------|
| **Item** | ✅ Yes | "Abacavir Sulphate 600mg + Lamivudine 300mg Tablet/Kapsul" |
| **No Kontrak** | ✅ Yes | "KKM-178/2025/F(U)" |
| **Kontrak Mula** | No | "2-Sep-2025" or "02/09/2025" |
| **Kontrak Tamat** | No | "1-Sep-2028" or "01/09/2028" |
| **Pembekal** | No | "M. S. Ally Pharma Sdn Bhd" |
| **Unit** | No | "Box of 30's" |
| **Harga (RM)** | No | "107.40" or "RM 107.40" |
| **Tempoh Serahan** | No | "Tidak melebihi 30 hari..." |
| **SST** | No | "SST ACETYLCYSTEINE.pdf" |

### Step 3: Re-import

1. Go to **Contract Catalog** page
2. Click **"Upload Excel"** button
3. Select your properly formatted Excel file
4. Review the column mappings - they should auto-detect correctly now
5. If mappings look wrong, manually adjust them
6. Click **"Import"** and wait for progress
7. Check the import results
8. Verify data in the table matches screenshot 7 format

---

## Expected Result

After re-import, your Contract Catalog should display:

✅ **Item** column: Full product names (e.g., "Abacavir Sulphate 600mg + Lamivudine 300mg Tablet/Kapsul")  
✅ **No Kontrak** column: Contract numbers (e.g., "KKM-178/2025/F(U)")  
✅ **Kontrak Mula** column: Start dates (e.g., "2 Sep 2025")  
✅ **Kontrak Tamat** column: End dates (e.g., "1 Sep 2028")  
✅ **Pembekal** column: Supplier names (e.g., "M. S. Ally Pharma Sdn Bhd")  
✅ **Unit** column: Unit descriptions (e.g., "Box of 30's")  
✅ **Harga (RM)** column: Prices (e.g., "RM 107.40")  
✅ **Tempoh Serahan** column: Delivery terms  
✅ **SST** column: PDF file names or references  
✅ **Status** column: Color-coded badges (Active, Expiring, Expired)

---

## Technical Details

### Files Modified
- ✅ `src/components/pharmacy/ExcelImport.tsx` - Enhanced column mapping for contracts
- ✅ `src/services/pharmacy/contractCatalogService.ts` - Better date/price parsing, contract validation
- ✅ `src/pages/pharmacy/catalog/ContractCatalogPage.tsx` - Default A-Z sorting

### Database
- ✅ Migration 039 - Contract catalog redesign (applied)
- ✅ Migration 041 - Cleanup utilities (optional, manual run)

---

## Verification Checklist

After re-import, verify:

- [ ] Item column shows full product names (not dates or codes)
- [ ] No Kontrak column shows contract numbers (not dates or item names)
- [ ] Kontrak Mula shows start dates in correct format
- [ ] Kontrak Tamat shows end dates in correct format
- [ ] Pembekal shows supplier names (not dates or codes)
- [ ] Unit shows unit descriptions
- [ ] Harga (RM) shows prices with "RM" prefix
- [ ] Tempoh Serahan shows delivery terms
- [ ] SST shows PDF file names
- [ ] Status badges are correct
- [ ] Data is sorted A-Z by item name by default
- [ ] Search and filters work correctly

---

## Troubleshooting

### Column Mappings Not Auto-Detecting

**Solution**: Manually adjust mappings in the import modal:
1. Click the dropdown next to each target field
2. Select the correct Excel column
3. Verify the mappings look correct
4. Import

### Some Rows Are Missing After Import

**Solution**: Check the import results:
- Look for validation errors
- Ensure Item and No Kontrak columns are filled
- Check console logs for filtered rows

### Dates Not Parsing Correctly

**Solution**: Use these date formats:
- ✅ `DD-Mon-YYYY` (e.g., "2-Sep-2025") - **RECOMMENDED**
- ✅ `DD/MM/YYYY` (e.g., "02/09/2025")
- ✅ `YYYY-MM-DD` (e.g., "2025-09-02")

Avoid: "30 Jun 2025" (without hyphens) - may not parse correctly

### Prices Showing as 0

**Solution**: 
- Use format: "107.40" or "RM 107.40"
- Remove special characters
- Don't include commas (or system will remove them)

---

**Status**: ✅ **FIXED - Ready for Re-import**  
**Last Updated**: January 10, 2026

