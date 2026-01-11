# Contract Catalog Data Fix Guide

## Problem Identified

The Contract Catalog is showing incorrect data with columns misaligned. This is caused by:
1. **Column Mapping Issues**: Excel column headers not matching correctly
2. **Existing Incorrect Data**: Previous imports had wrong column mappings
3. **Data Transformation Errors**: Values being placed in wrong fields

## Solution Applied

### 1. Enhanced Column Mapping ✅
- Added contract-specific pattern matching for Malay headers
- Flexible matching for: Item, No Kontrak, Kontrak Mula, Kontrak Tamat, Pembekal, Unit, Harga (RM), Tempoh Serahan, SST
- Handles variations in spacing, capitalization, and format

### 2. Improved Date Parsing ✅
- Enhanced date parsing for "DD-Mon-YYYY" format (e.g., "2-Sep-2025")
- Handles Excel date numbers
- Supports multiple date formats

### 3. Better Price Parsing ✅
- Handles "RM" prefix (e.g., "RM 107.40")
- Removes commas (e.g., "1,107.40")
- Proper number conversion

### 4. Fixed Validation Logic ✅
- Contract-specific validation (contract_number + item_name)
- Different validation rules than drug/non-drug catalogs
- Proper filtering of invalid data

### 5. Fixed Column Alignment ✅
- Preserves column positions in Excel
- Handles empty columns correctly
- Maintains data alignment

---

## Steps to Fix Existing Data

### Option 1: Clear and Re-import (Recommended)

1. **Clear existing incorrect contracts**:
   - In Supabase SQL Editor, run:
   ```sql
   -- WARNING: This will delete ALL contracts for your hospital
   -- Replace 'YOUR_HOSPITAL_ID' with your actual hospital ID
   DELETE FROM contracts 
   WHERE hospital_id = 'YOUR_HOSPITAL_ID';
   ```

2. **Re-upload your Excel file**:
   - Go to Contract Catalog page
   - Click "Upload Excel"
   - Select your properly formatted Excel file
   - Review the column mappings (should now auto-detect correctly)
   - Confirm and import

### Option 2: Manual Fix via SQL

If you want to keep some contracts, you can manually fix them:

```sql
-- Example: Fix a specific contract
UPDATE contracts 
SET 
  item_name = 'Correct Item Name',
  contract_number = 'KKM-178/2025/F(U)',
  start_date = '2025-09-02',
  end_date = '2028-09-01',
  supplier_name = 'M. S. Ally Pharma Sdn Bhd',
  unit = 'Box of 30''s',
  unit_price = 107.40,
  delivery_period = 'Tidak melebihi 30 hari...',
  sst_rate = 'SST Adalimumab.pdf'
WHERE id = 'CONTRACT_ID_HERE';
```

---

## Excel File Format (Correct)

Your Excel file should have these **exact column headers**:

| Item | No Kontrak | Kontrak Mula | Kontrak Tamat | Pembekal | Unit | Harga (RM) | Tempoh Serahan | SST |
|------|------------|--------------|---------------|----------|------|------------|----------------|-----|

**Example Data Row:**
```
Abacavir Sulphate 600mg + Lamivudine 300mg Tablet/Kapsul | KKM-178/2025/F(U) | 2-Sep-2025 | 1-Sep-2028 | M. S. Ally Pharma Sdn Bhd | Box of 30's | 107.40 | Tidak melebihi 30 hari... | SST ACETYLCYSTEINE.pdf
```

---

## Column Mapping Rules

The system now automatically maps these columns:

| Excel Column | Mapped To | Examples |
|--------------|-----------|----------|
| **Item** | `item_name` | "Item", "Item Name", "Nama Item" |
| **No Kontrak** | `contract_number` | "No Kontrak", "No. Kontrak", "Contract Number" |
| **Kontrak Mula** | `start_date` | "Kontrak Mula", "Contract Start", "Start Date" |
| **Kontrak Tamat** | `end_date` | "Kontrak Tamat", "Contract End", "End Date" |
| **Pembekal** | `supplier_name` | "Pembekal", "Supplier", "Supplier Name" |
| **Unit** | `unit` | "Unit", "Unit of Measure" |
| **Harga (RM)** | `unit_price` | "Harga (RM)", "Harga RM", "Price (RM)", "Price RM" |
| **Tempoh Serahan** | `delivery_period` | "Tempoh Serahan", "Delivery Period", "Delivery Time" |
| **SST** | `sst_rate` | "SST", "SST Rate", "Tax" |

---

## Verification Steps

After re-importing, verify your data matches the 7th screenshot:

✅ **Item** column shows full product names (e.g., "Abacavir Sulphate 600mg + Lamivudine 300mg Tablet/Kapsul")  
✅ **No Kontrak** shows contract numbers (e.g., "KKM-178/2025/F(U)")  
✅ **Kontrak Mula** shows start dates (e.g., "2-Sep-2025")  
✅ **Kontrak Tamat** shows end dates (e.g., "1-Sep-2028")  
✅ **Pembekal** shows supplier names (e.g., "M. S. Ally Pharma Sdn Bhd")  
✅ **Unit** shows unit descriptions (e.g., "Box of 30's")  
✅ **Harga (RM)** shows prices (e.g., "RM 107.40")  
✅ **Tempoh Serahan** shows delivery terms  
✅ **SST** shows PDF file names or references  

---

## Troubleshooting

### Issue: Columns still not mapping correctly
**Solution**: 
1. Check your Excel headers match exactly (case-insensitive, but spelling must match)
2. Check browser console for mapping logs: `[MAP] Contract match: ...`
3. Manually adjust column mappings in the import modal if needed

### Issue: Dates not parsing correctly
**Solution**: 
- Use format: DD-Mon-YYYY (e.g., "2-Sep-2025")
- Or: DD/MM/YYYY (e.g., "02/09/2025")
- Or: YYYY-MM-DD (e.g., "2025-09-02")

### Issue: Prices showing as 0 or NaN
**Solution**: 
- Remove "RM" prefix before import, or the system will handle it
- Use numbers only or "RM 107.40" format
- Avoid special characters

### Issue: Some rows are missing
**Solution**: 
- Check validation errors in import results
- Ensure Item and No Kontrak columns are filled
- Check console for filtered rows

---

## Next Steps

1. ✅ Clear existing incorrect data (SQL above)
2. ✅ Prepare Excel file with correct headers
3. ✅ Re-upload Excel file
4. ✅ Verify column mappings (should auto-detect correctly now)
5. ✅ Review import results
6. ✅ Verify data in table matches screenshot 7 format

---

**Status**: Ready for Re-import  
**Last Updated**: January 10, 2026

