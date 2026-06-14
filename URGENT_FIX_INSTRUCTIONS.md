# ⚠️ URGENT: Google Sheet Access Issue

## The Problem
Your Google Sheet is **not publicly accessible**, causing a **403 Forbidden error**.

## The Solution (Choose ONE option)

### Option 1: Make Sheet Publicly Viewable (RECOMMENDED - Easiest)

1. Open your Google Sheet
2. Click **"Share"** button (top right)
3. Click **"Change to anyone with the link"**
4. Make sure it's set to **"Viewer"** (not Editor)
5. Click **"Done"**
6. Go back to the Contract Catalog page
7. Click **"Sync Now"** again

**This is the fastest solution and will work immediately.**

---

### Option 2: Use Google Sheets API Key (More Secure)

If you cannot make the sheet public, you need a Google Sheets API key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable "Google Sheets API"
4. Create an API Key (Credentials → Create Credentials → API Key)
5. Copy the API key
6. In Contract Catalog, click **"Configure Sync"**
7. Paste the API key in the **"API Key"** field
8. Click **"Save"**
9. Click **"Sync Now"**

---

## What Will Happen After the Fix

Once the sheet is accessible:
1. ✅ The 403 error will be resolved
2. ✅ Data will be fetched successfully
3. ✅ The system will automatically map:
   - **Column A (Item)** → Contract Name
   - **Column B (No Kontrak)** → Contract Number
   - **Column C (Kontrak Mula)** → Start Date
   - **Column D (Kontrak Tamat)** → End Date
   - **Column E (Pembekal)** → Supplier
   - **Column G (Harga RM)** → Price
   - **Column H (Tempoh Serahan)** → Delivery Period
   - **Column I (SST)** → SST Document

4. ✅ You will see proper data like:
   - Item: "Cefepime 1g Injection"
   - Item: "Cefazolin 2g & Ampicillin 0.5g Injection"
   - Item: "Ceftazidime 5mg/ml Solution For Infusion"
   - etc.

---

## Current Error Explanation

The error `403 Forbidden` means:
- Google Sheets is blocking access because the sheet is private
- The CSV export URL (`https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:csv`) only works for public sheets
- Without public access or an API key, we cannot read the data

---

## Try Option 1 First
**Making the sheet publicly viewable (Option 1) is the fastest and easiest solution. It takes 30 seconds.**

After you do this, the sync will work perfectly and your data will display correctly.
