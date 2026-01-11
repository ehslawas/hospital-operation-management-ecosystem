# Contract Catalog - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Run Database Migration
```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: Run migration directly
psql -d your_database -f supabase/migrations/039_contract_catalog_redesign.sql
```

### Step 2: Navigate to Contract Catalog
1. Open your application
2. Go to: **Pharmacy** → **Catalog** → **Contract Catalog**
3. You'll see the new modern interface with KPI cards

### Step 3: Upload Your First Contract File

**Prepare Your Excel File**:
```
Item                | No Kontrak          | Kontrak Mula | Kontrak Tamat | Pembekal           | Unit | Harga (RM) | Tempoh Serahan | SST
Surgical Gloves     | .31.123.75.22-2028  | 2024-05-22   | 2028-05-22    | ABC Medical Supply | Box  | 45.00      | 7 days         | 6%
Medical Mask        | .34.Q.47.18.29-2026 | 2024-10-29   | 2026-10-29    | XYZ Healthcare     | Pack | 12.50      | 3 days         | 6%
```

**Upload Process**:
1. Click **"Upload Excel"** button
2. Select your file
3. Review the column mappings (auto-detected)
4. Click **"Import"**
5. Watch the progress bar
6. Done! Your contracts are now in the system

### Step 4: Explore Features

**Search**: Type in the search box to find contracts
- Search by item name
- Search by contract number
- Search by supplier

**Filter**: Use dropdown filters
- Filter by status (Active, Expiring, Expired)
- Filter by supplier

**Sort**: Click any column header to sort

**Export**: Click "Export" button to download CSV

---

## 📋 Quick Reference

### Required Fields
- **Item** (Item Name) - Required
- **No Kontrak** (Contract Number) - Required, must be unique

### Optional Fields
- Kontrak Mula (Start Date)
- Kontrak Tamat (End Date)
- Pembekal (Supplier)
- Unit (Unit of Measure)
- Harga (RM) (Price)
- Tempoh Serahan (Delivery Period)
- SST (Tax Rate)

### Status Badges
- 🟢 **Active** - Contract is currently valid
- 🟡 **Expiring** - Ends within 30 days
- 🔴 **Expired** - Past end date
- 🔵 **Pending** - Starts in the future
- ⚫ **Inactive** - Manually deactivated

### KPI Cards Explained
- **Total Contracts**: All contracts in system
- **Active**: Currently valid contracts
- **Expiring Soon**: Ending within 30 days (⚠️ take action!)
- **Expired**: Past their end date
- **Total Value**: Sum of all contract prices

---

## 🎯 Common Tasks

### Import 100 Contracts
1. Prepare Excel file with all data
2. Upload Excel → takes ~10 seconds
3. Check for errors in import report
4. Verify data in table

### Find Expiring Contracts
1. Set status filter to "Expiring Soon"
2. Review list
3. Export if needed for reporting

### Export for Reporting
1. Set filters as needed
2. Click "Export" button
3. Open CSV in Excel
4. Generate your reports

### Update Contract Prices
1. Export existing data
2. Update prices in Excel
3. Re-upload file
4. System will update existing contracts

---

## 💡 Pro Tips

1. **Column Names Don't Matter**: The AI will auto-map columns even if they're named differently

2. **Duplicate Prevention**: System prevents uploading the same file twice

3. **Bulk Updates**: Re-upload with same contract numbers to update existing records

4. **Date Formats Supported**:
   - 2024-01-15
   - 15/01/2024
   - Jan 15, 2024

5. **Mobile Friendly**: Works perfectly on tablets and phones

6. **Filters Persist**: Your search and filters remain while you work

7. **Sort Multiple Ways**: Click column headers to sort data differently

---

## ❓ Troubleshooting

### "Duplicate contract number" Error
- **Cause**: Contract number already exists
- **Solution**: Check if it's already in system or use different number

### "Invalid date format" Error
- **Cause**: Date not recognized
- **Solution**: Use format: YYYY-MM-DD (e.g., 2024-01-15)

### "End date before start date" Error
- **Cause**: Contract end is before start
- **Solution**: Correct the dates in your Excel file

### Contracts Not Showing
- **Cause**: Filters might be hiding them
- **Solution**: Reset filters to "All Status" and "All Suppliers"

### Import Seems Slow
- **Normal**: 1000 contracts = ~10 seconds
- **Check**: File size and data complexity
- **Tip**: Import in batches if needed

---

## 📊 Sample Excel Template

Download or create with these headers:

```
Item | No Kontrak | Kontrak Mula | Kontrak Tamat | Pembekal | Unit | Harga (RM) | Tempoh Serahan | SST
```

**Example Rows**:
```
Paracetamol 500mg   | C001 | 2024-01-01 | 2025-12-31 | Pharma Co    | Box   | 25.00 | 5 days  | 6%
Bandages 5cm        | C002 | 2024-06-01 | 2026-05-31 | Medical Ltd  | Roll  | 8.50  | 3 days  | 0%
Gloves Latex        | C003 | 2023-01-01 | 2024-12-31 | Supply Inc   | Pack  | 45.00 | 7 days  | 6%
```

---

## 🎓 Video Tutorials (Coming Soon)

1. **First Time Setup** (2 min)
2. **Uploading Contracts** (3 min)
3. **Using Filters** (2 min)
4. **Exporting Data** (1 min)
5. **Managing Expiring Contracts** (4 min)

---

## 🔗 Related Documentation

- `CONTRACT_CATALOG_IMPLEMENTATION_COMPLETE.md` - Full technical documentation
- `CONTRACT_CATALOG_REBUILD_PLAN.md` - Detailed implementation plan

---

## ✅ Checklist for First Use

- [ ] Database migration completed
- [ ] Can access Contract Catalog page
- [ ] KPI cards show zeros (expected when empty)
- [ ] Excel file prepared with correct headers
- [ ] First upload successful
- [ ] Contracts appear in table
- [ ] Search works
- [ ] Filters work
- [ ] Export works
- [ ] Status badges show correct colors

---

**Ready to go!** 🚀

If you have questions, refer to the complete documentation or contact support.

**Last Updated**: January 10, 2026
