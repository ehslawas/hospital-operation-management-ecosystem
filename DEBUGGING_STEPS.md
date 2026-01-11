# Debugging Steps - Google Sheets Data Mapping Issue

## Problem
The ITEM column shows: `,,31.1,23.75,22-May-2028` instead of the actual product name like "Abacavir Sulphate 600mg + Lamivudine 300mg Tablet/Kapsul"

## Root Cause Analysis

Based on the data showing `,,31.1,23.75,22-May-2028`, this indicates:
1. Multiple commas suggest empty columns or malformed CSV parsing
2. The row data might be getting corrupted during CSV parsing
3. OR the column mapping is pointing to the wrong column index

## Immediate Action Required

### Step 1: Check Your Google Sheet Structure
Please answer these questions about your Google Sheet:

1. **What is Row 1 in your sheet?** (The very first row)
   - Is it headers like: "No", "Item", "No Kontrak", "Pembekal", etc.?
   - Or is it data?
   - Or is it empty/title row?

2. **What column contains the Item/Product names?**
   - What letter is it? (A, B, C, D, etc.)
   - What is the EXACT header name for that column?

3. **What does a sample data row look like?**
   - Can you copy the first data row values here?

### Step 2: Open Browser Console
1. Open the Contract Catalog page
2. Press F12 to open Developer Tools
3. Go to the "Console" tab
4. Click "Sync Now"
5. **Copy ALL the console log output** and share it

You should see logs like:
```
🔍 DEBUG: Raw data received from Google Sheets
Total rows: XX
Row 0: [...]
Row 1: [...]

📋 Header Detection Results:
Headers found: [...]
Column Mappings:
  Contract Name: Column X ("...")
```

### Step 3: Quick Fix to Test
If you want to test immediately, try this:

1. Make sure Row 1 of your Google Sheet has CLEAR headers
2. Make sure one column header is EXACTLY "Item" (case doesn't matter)
3. Make sure the sheet is publicly viewable ("Anyone with the link" → Viewer)
4. Try sync again

### Step 4: Share Your Sheet (Optional)
If you can share the Google Sheet URL (make it viewable), I can directly see the structure and fix the mapping immediately.

## What I'll Do Next

Once you provide:
1. The console logs
2. OR the Google Sheet structure/URL

I will:
1. Identify the exact column index for Item
2. Fix the header detection if it's selecting the wrong row
3. Fix the CSV parsing if it's corrupting data
4. Deploy the fix
5. Verify it works with your actual data

## Current Status

✅ Edge Function deployed (version 11, verify_jwt: false)
⏳ Waiting for diagnostic information to fix data mapping
⏳ Need to see console logs or sheet structure

---

**Please provide the information from Steps 1 and/or 2 above, and I'll fix this immediately.**
