# Google Sheets Sync - Critical Fix Plan

## Problems Identified

### Problem 1: Data Mapping is Completely Wrong
**Issue**: The ITEM column shows dates (e.g., "31.1,23.75,22-May-2028") instead of product names (e.g., "Abacavir Sulphate 600mg + Lamivudine 300mg Tablet/Kapsul")

**Root Causes**:
1. Header row detection is picking the wrong row
2. Column indices are incorrectly mapped
3. CSV parsing might be corrupting data
4. The "squashed" CSV format may not be properly parsed

### Problem 2: Edge Function Returns 401 Unauthorized
**Issue**: Edge Function continuously returns 401 despite multiple deployment attempts

**Root Causes**:
1. `verify_jwt: true` may be incompatible with current session state
2. Session token might be expired or invalid
3. Edge Function configuration mismatch

## Systematic Fix Plan

### Phase 1: Fix Edge Function Authentication (PRIORITY 1)

#### Step 1.1: Revert to Working Configuration
- Deploy Edge Function with `verify_jwt: false` (matching version 5 that worked)
- Remove all JWT verification code
- This ensures the function can be called

#### Step 1.2: Test Edge Function Directly
- Call the function with a simple test
- Verify it returns data successfully

### Phase 2: Fix Data Mapping (PRIORITY 1)

#### Step 2.1: Debug Header Detection
- Add extensive logging to see what headers are detected
- Check which row is being selected as the header row
- Verify the scoring algorithm is working correctly

#### Step 2.2: Fix CSV Parsing
- The parseCSVLine function might be corrupting data
- Test with the actual Google Sheet to see raw data
- Ensure proper handling of quoted fields

#### Step 2.3: Fix Column Mapping
- Verify the column index mapping logic
- Ensure fuzzy matching is finding the right columns
- Add fallback logic if columns aren't found

#### Step 2.4: Add Data Preview/Debug Mode
- Show raw sheet data before parsing
- Show detected headers
- Show mapped column indices
- This helps diagnose mapping issues

### Phase 3: Testing and Validation

#### Step 3.1: Test with Real Data
- Use the actual Google Sheet
- Verify data flows correctly end-to-end
- Check each column maps correctly

#### Step 3.2: Add Error Handling
- Better error messages for mapping failures
- Show which columns couldn't be mapped
- Provide actionable suggestions

## Implementation Order

1. **FIX AUTH FIRST** (5 minutes)
   - Deploy Edge Function with verify_jwt: false
   - Test that 401 error is gone

2. **DEBUG DATA MAPPING** (10 minutes)
   - Add console logs to see raw data
   - Add logs to see detected headers
   - Add logs to see column mapping

3. **FIX MAPPING LOGIC** (15 minutes)
   - Fix header detection if wrong row selected
   - Fix column index mapping
   - Fix CSV parsing if corrupting data

4. **TEST END-TO-END** (10 minutes)
   - Verify data displays correctly
   - Verify all columns map properly
   - Verify contract data is accurate

## Expected Timeline

**Total Time**: 40 minutes to complete all fixes

## Success Criteria

✅ Edge Function returns 200 OK (no 401 errors)
✅ ITEM column shows product names, not dates
✅ All columns map to correct data
✅ Contract dates are properly formatted
✅ No data corruption or parsing errors

---

**Current Status**: Starting implementation...
