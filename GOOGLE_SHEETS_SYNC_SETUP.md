# Google Sheets Sync System - Setup & Deployment Guide

This guide will help you deploy and test the complete Google Sheets synchronization system.

## Prerequisites

1. **Supabase Project** - Already set up and configured
2. **Google Sheets API** - Optional (for private sheets)
3. **Supabase CLI** - For deploying Edge Functions (optional, can use dashboard)

## Step 1: Database Migration ✅ COMPLETED

The database migration has been automatically applied using the Supabase MCP server! The `google_sheets_sync_config` table is now created with:

✅ Table structure with all required columns
✅ `detected_headers` JSONB column for storing column headers
✅ RLS (Row Level Security) enabled
✅ All RLS policies configured (SELECT, INSERT, UPDATE, DELETE)
✅ Indexes created for performance
✅ Triggers for `updated_at` timestamp

**Migration Applied**: `add_detected_headers_to_sync_config`

You can verify the table structure:
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'google_sheets_sync_config' 
ORDER BY ordinal_position;
```

## Step 2: Deploy Edge Function ✅ COMPLETED

The Edge Function has been automatically deployed using the Supabase MCP server!

**Deployment Details**:
- ✅ Function Name: `sync-google-sheets`
- ✅ Version: 6 (latest)
- ✅ Status: ACTIVE
- ✅ JWT Verification: Enabled (`verify_jwt: true`)
- ✅ Deployment Method: Supabase MCP Server

**Function Features**:
- JWT authentication (double verification)
- Public sheet support (CSV export)
- Private sheet support (API key)
- OAuth token support
- Comprehensive error handling
- CORS headers configured

The function is ready to use! You can verify it in Supabase Dashboard → Edge Functions.

## Step 3: Test with a Public Google Sheet

### Create a Test Sheet

1. Create a new Google Sheet
2. Add headers in row 1:
   ```
   NO | Item | No Kontrak | Kontrak Mula | Kontrak Tamat | Pembekal | Harga (RM) | Tempoh Serahan | SST | Status
   ```
3. Add some test data in rows 2-5
4. Click **Share** → **Change** → **"Anyone with the link"** → **Viewer**
5. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```

### Test in the Application

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Contract Catalog page
3. Click **"Configure Sync"**
4. Enter:
   - **Sheet ID or URL**: Paste the full URL or just the Sheet ID
   - **Sheet Name**: `Sheet1` (or your sheet tab name)
   - Leave API Key empty (for public sheet)
5. Click **"Save Configuration"**
6. Click **"Preview Headers"** to verify headers are detected
7. Click **"Sync Now"** to sync data
8. Verify contracts appear in the table

## Step 4: Verify Complete Flow

### Check Database

```sql
-- Check sync config
SELECT * FROM google_sheets_sync_config;

-- Check synced contracts
SELECT 
  contract_number,
  contract_name,
  supplier_name,
  start_date,
  end_date,
  status,
  last_synced_at
FROM contracts
ORDER BY last_synced_at DESC
LIMIT 10;
```

### Check Console Logs

Open browser DevTools Console and check for:
- ✅ "Dynamic headers extracted"
- ✅ "Manual Indices Detected"
- ✅ "Sync Complete" message
- ❌ Any error messages

## Step 5: Test Edge Cases

### Test 1: Invalid Sheet ID
- Enter an invalid Sheet ID
- Should show error: "Google Sheet not found"

### Test 2: Private Sheet (No API Key)
- Use a private sheet without API key
- Should show error: "Sheet not publicly accessible"

### Test 3: Empty Sheet
- Use a sheet with only headers, no data
- Should show: "No data rows found"

### Test 4: Auto-Sync
- Enable auto-sync with 5-minute interval
- Wait and verify automatic sync happens

### Test 5: Modified Data
- Change data in Google Sheet
- Click "Sync Now"
- Verify updated contracts in database

## Troubleshooting

### Edge Function Not Found

**Error**: `Function not found: sync-google-sheets`

**Solution**:
1. Verify function is deployed in Supabase Dashboard
2. Check function name matches exactly: `sync-google-sheets`
3. Redeploy the function

### CORS Error

**Error**: `CORS policy blocked`

**Solution**:
- Edge Function should handle CORS automatically
- Check if function is deployed correctly
- Verify request includes proper headers

### Authentication Error

**Error**: `Unauthorized. Please log in.`

**Solution**:
1. Make sure you're logged in to the application
2. Check Supabase Auth is working
3. Verify JWT token is included in request

### Sheet Not Accessible

**Error**: `Sheet not publicly accessible`

**Solutions**:
1. **Make sheet public** (easiest):
   - Open Google Sheet
   - Click Share → Change → "Anyone with the link" → Viewer
2. **Use API Key** (for private sheets):
   - Get API key from Google Cloud Console
   - Enable Google Sheets API
   - Enter API key in sync configuration

### Headers Not Detected

**Issue**: Headers preview shows wrong or no headers

**Solutions**:
1. Ensure first row contains column names (not data)
2. Use column names with keywords: "Item", "No Kontrak", "Pembekal", etc.
3. Check sheet structure - headers should be in row 1 (or early rows)

### Data Not Parsing Correctly

**Issue**: Contracts synced but data is wrong

**Solutions**:
1. Check "Preview Headers" to verify column mapping
2. Verify column names match expected keywords (see plan.md)
3. Check date formats (should be DD/MM/YYYY or ISO format)
4. Verify status values (should be: active, expired, terminated, pending)

## Google Sheets API Key Setup (Optional - For Private Sheets)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Google Sheets API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### Step 2: Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the API key
4. (Optional) Restrict API key:
   - Click on the API key
   - Under "API restrictions", select "Restrict key"
   - Choose "Google Sheets API"
   - Save

### Step 3: Use API Key in Application

1. Open Contract Catalog page
2. Click "Configure Sync"
3. Paste API key in "API Key" field
4. Save configuration
5. Now private sheets can be synced

## Production Considerations

### Security

1. **API Keys**: Consider encrypting API keys in database
2. **RLS Policies**: Verify RLS policies are properly configured
3. **Rate Limiting**: Be mindful of Google Sheets API quotas
4. **Error Logging**: Monitor Edge Function logs for errors

### Performance

1. **Sync Intervals**: Don't set too frequent (minimum 5 minutes recommended)
2. **Large Sheets**: Consider using ranges to fetch in chunks
3. **Caching**: Headers are cached to avoid re-detection
4. **Batch Processing**: Contracts are processed efficiently

### Monitoring

1. **Sync Status**: Check `last_sync_status` in `google_sheets_sync_config`
2. **Error Messages**: Review `last_sync_error` for issues
3. **Edge Function Logs**: Check Supabase Dashboard → Edge Functions → Logs
4. **Database Queries**: Monitor query performance

## Next Steps

1. ✅ Database migration applied
2. ✅ Edge Function deployed
3. ✅ Tested with public sheet
4. ✅ Verified data sync
5. ⬜ Set up monitoring/alerting
6. ⬜ Configure production API key (if needed)
7. ⬜ Train users on how to use the sync feature

## Support

For issues or questions:
1. Check the detailed plan: `GOOGLE_SHEETS_SYNC_PLAN.md`
2. Review Edge Function logs in Supabase Dashboard
3. Check browser console for client-side errors
4. Verify database migration was applied correctly
