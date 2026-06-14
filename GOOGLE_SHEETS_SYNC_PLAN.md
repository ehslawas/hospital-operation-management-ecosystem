# Google Sheets Sync System - Detailed Architecture Plan

## Executive Summary

This document provides a comprehensive technical overview of how the Contract Catalog system reads and synchronizes data from Google Sheets. The system is designed to automatically detect headers, parse contract data, and sync it to a Supabase database with support for both public sheets and authenticated API access.

---

## 1. System Architecture Overview

### 1.1 High-Level Flow

```
User Interface (React)
    ↓
Contract Catalog Page
    ↓
Google Sheets Service Layer
    ↓
Supabase Edge Function (sync-google-sheets)
    ↓
Google Sheets API
    ↓
Data Processing & Validation
    ↓
Supabase Database (contracts table)
```

### 1.2 Key Components

1. **Frontend (React/TypeScript)**
   - `ContractCatalogPage.tsx` - Main UI component
   - Configuration modal for sync settings
   - Real-time sync status display
   - Dynamic table rendering based on detected headers

2. **Service Layer**
   - `googleSheetsService.ts` - Core business logic
   - Header detection algorithms
   - Data parsing and validation
   - Database synchronization

3. **Backend (Supabase Edge Function)**
   - `sync-google-sheets` - Proxy function to avoid CORS
   - Handles authentication with Google Sheets API
   - Fetches raw sheet data

4. **Database (Supabase/PostgreSQL)**
   - `google_sheets_sync_config` table - Stores sync configuration
   - `contracts` table - Stores synchronized contract data

---

## 2. Detailed Component Breakdown

### 2.1 User Interface Layer (`ContractCatalogPage.tsx`)

#### 2.1.1 Configuration Modal
- **Purpose**: Allows users to configure Google Sheets connection
- **Key Fields**:
  - Google Sheet ID or URL
  - Sheet Name (default: "Sheet1")
  - Optional Range (e.g., "A1:Z1000")
  - Optional API Key (for private sheets)
  - Auto-sync toggle
  - Sync interval (minutes)

#### 2.1.2 Sync Actions
- **Configure Sync**: Opens modal to set up/update configuration
- **Preview Headers**: Fetches and displays detected column headers
- **Sync Now**: Triggers manual synchronization
- **Auto-sync**: Background sync based on configured interval

#### 2.1.3 Status Display
- Shows last sync timestamp
- Displays sync status (success/failed/in_progress)
- Shows error messages if sync fails
- Displays auto-sync interval if enabled

#### 2.1.4 Data Display
- Dynamic table with columns based on detected headers
- Filters columns to show only relevant ones (Item, No Kontrak, Kontrak Mula, etc.)
- Search functionality
- Status indicators (Active/Expired/Terminated/Pending)

---

### 2.2 Service Layer (`googleSheetsService.ts`)

#### 2.2.1 Sheet ID Extraction (`extractSheetId`)
**Purpose**: Extracts Google Sheet ID from various URL formats

**Input Examples**:
- Full URL: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
- ID only: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
- Partial URL: `/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/`

**Process**:
1. Validates input format
2. Uses regex patterns to extract ID from URL
3. Validates extracted ID format (alphanumeric, 20+ chars)
4. Returns extracted ID or null if invalid

#### 2.2.2 Data Fetching (`fetchGoogleSheetData`)
**Purpose**: Fetches raw data from Google Sheets via Supabase Edge Function

**Process**:
1. Validates Supabase configuration
2. Extracts sheet ID from input
3. Ensures user session is valid and refreshed if needed
4. Invokes Supabase Edge Function `sync-google-sheets`
5. Passes parameters: sheetId, sheetName, range, apiKey
6. Handles errors (401, 403, 404, 429, network errors)
7. Returns raw data as 2D array (rows × columns)

**Authentication Flow**:
- Uses Supabase JWT token for Edge Function authentication
- For public sheets: No API key needed
- For private sheets: API key must be provided by user

#### 2.2.3 Header Detection (`fetchSheetWithDynamicHeaders`)
**Purpose**: Detects header row and extracts column names

**Algorithm (Score-Based Detection)**:
1. Scans first 15 rows of sheet
2. For each row:
   - Counts non-empty cells (must be ≥ 3)
   - Matches cells against header keywords:
     - `['contract', 'kontrak', 'item', 'barang', 'pembekal', 'no kontrak', 'sst', 'tempoh serahan', 'tarikh', 'date', 'mula', 'tamat', 'status', 'supplier', 'harga', 'price', 'nilai', 'serahan', 'delivery', 'unit']`
   - Calculates match ratio: `keywordMatches / nonEmptyCells`
   - Applies length penalty if cells are too long (likely data, not headers)
   - Score: `keywordMatches × matchRatio × lengthPenalty`
3. Selects row with highest score (requires ≥ 3 keyword matches AND ≥ 25% match ratio)
4. Returns detected headers, header row index, and parsed data

**Why Score-Based?**
- Handles sheets with multiple header rows or empty rows
- Distinguishes between headers and data rows
- Works with various sheet structures

#### 2.2.4 Column Mapping (`detectManualIndices`)
**Purpose**: Maps detected headers to contract data fields

**Mapping Strategy**:
- Uses fuzzy matching (exact match → substring match → word-based match)
- Normalizes headers (lowercase, remove special chars, collapse spaces)
- Maps to fields:
  - `contractNumberIdx` → "No Kontrak", "Contract No", etc.
  - `contractNameIdx` → "Item", "Item Name", "Nama Item", etc.
  - `supplierNameIdx` → "Pembekal", "Supplier", "Vendor", etc.
  - `startDateIdx` → "Kontrak Mula", "Start Date", etc.
  - `endDateIdx` → "Kontrak Tamat", "End Date", etc.
  - `valueIdx` → "Harga (RM)", "Price", "Value", etc.
  - `tempohSerahanIdx` → "Tempoh Serahan", "Delivery Period", etc.
  - `sstIdx` → "SST", "SST Document", etc.
  - `unitIdx` → "Unit", "UOM", etc.

#### 2.2.5 Data Parsing (`parseContractRows`)
**Purpose**: Converts raw sheet rows into structured contract objects

**Process**:
1. Uses detected header row index to skip to data rows
2. For each data row:
   - Maps cells to contract fields using column indices
   - Parses dates (supports multiple formats: DD/MM/YYYY, DD-MM-YYYY, ISO)
   - Parses numeric values (removes currency symbols, commas)
   - Normalizes status values (active/expired/terminated/pending)
   - Stores unmapped columns in metadata object
3. Handles edge cases:
   - Missing contract name (defaults to contract number or "Contract N")
   - Combined period columns (splits into start/end dates)
   - Empty cells (skipped or set to null)
4. Returns array of `ContractRow` objects

**Date Parsing**:
- Attempts ISO format first
- Falls back to DD/MM/YYYY, DD-MM-YYYY formats
- Handles month names (e.g., "27-Oct-2025")

**Status Normalization**:
- Direct match: "active", "expired", "terminated", "pending"
- Malay variations: "aktif" → "active", "tamat" → "expired"
- Invalid statuses default to "active"

#### 2.2.6 Data Validation
**Functions**:
- `isValidContractNumber`: Validates contract number format (contains year pattern, contract prefix)
- `isValidSupplierName`: Validates supplier name (company indicators, reasonable length)
- `isValidDateValue`: Validates date format using regex patterns
- `normalizeStatus`: Normalizes and validates status values

#### 2.2.7 Synchronization (`syncContractsFromGoogleSheets`)
**Purpose**: Syncs parsed contracts to database

**Process**:
1. Updates sync status to "in_progress"
2. Fetches data from Google Sheets
3. Handles "squashed" CSV data (auto-repair if detected)
4. Parses contract rows
5. Gets existing contracts from database (by hospital_id)
6. For each contract:
   - Calculates sync hash (SHA-256 of key fields)
   - Validates required fields
   - Normalizes status
   - Checks if contract exists (by contract_number)
   - If exists: Updates if hash changed
   - If new: Inserts or upserts
   - Links to supplier if found
7. Marks contracts not in sheet as "expired"
8. Updates sync config with results
9. Returns sync statistics (processed, created, updated, deleted)

**Sync Hash**:
- Prevents unnecessary updates
- Hash of: contract_number, contract_name, supplier_name, start_date, end_date, value
- Only updates if hash changed (data was modified)

**Conflict Resolution**:
- Uses upsert with conflict resolution on `hospital_id, contract_number`
- Handles duplicate contract names gracefully

#### 2.2.8 Enhanced Sync (`syncContractsWithDynamicHeaders`)
**Purpose**: Syncs contracts and stores detected headers

**Process**:
1. Fetches sheet with dynamic headers
2. Stores detected headers in sync config
3. Detects manual indices for consistent mapping
4. Performs standard sync with detected indices
5. Returns result with detected headers

---

### 2.3 Supabase Edge Function (`sync-google-sheets`)

#### 2.3.1 Purpose
- Acts as proxy to avoid CORS issues
- Handles Google Sheets API authentication
- Fetches raw sheet data

#### 2.3.2 Implementation Requirements
- **Location**: `supabase/functions/sync-google-sheets/index.ts`
- **Authentication**: Uses Supabase JWT for function access
- **Google Sheets API**: Uses Google Sheets API v4

#### 2.3.3 Process Flow
1. Validates request (checks JWT token)
2. Extracts parameters from request body:
   - `sheetId`: Google Sheet ID
   - `sheetName`: Sheet tab name (default: "Sheet1")
   - `range`: Optional range (e.g., "A1:Z1000")
   - `apiKey`: Optional API key for private sheets
3. Constructs Google Sheets API URL:
   ```
   https://sheets.googleapis.com/v4/spreadsheets/{sheetId}/values/{sheetName}{range}?key={apiKey}
   ```
4. For public sheets (no API key):
   - Uses public export URL format
   - Or uses API with unauthenticated requests
5. Fetches data from Google Sheets API
6. Handles errors:
   - 401: Authentication failed
   - 403: Sheet not accessible (needs public sharing or API key)
   - 404: Sheet not found
   - 429: Rate limited
7. Returns data as 2D array

#### 2.3.4 Error Handling
- Returns structured error responses
- Includes user-friendly error messages
- Suggests solutions (make sheet public, provide API key)

---

### 2.4 Database Schema

#### 2.4.1 `google_sheets_sync_config` Table
```sql
CREATE TABLE google_sheets_sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id),
  sheet_id TEXT NOT NULL,
  sheet_name TEXT DEFAULT 'Sheet1',
  range TEXT,
  sync_type TEXT DEFAULT 'contracts',
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_interval_minutes INTEGER DEFAULT 60,
  api_key TEXT, -- Encrypted/stored securely
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT, -- 'success', 'failed', 'in_progress'
  last_sync_error TEXT,
  detected_headers JSONB, -- Array of detected column headers
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, sync_type)
);
```

#### 2.4.2 `contracts` Table
```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id),
  contract_number TEXT,
  contract_name TEXT NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name TEXT,
  contract_type TEXT,
  start_date DATE,
  end_date DATE,
  total_value NUMERIC,
  currency TEXT DEFAULT 'MYR',
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'terminated', 'pending'
  metadata JSONB, -- Stores additional columns from sheet
  google_sheet_row_index INTEGER, -- Original row number in sheet
  last_synced_at TIMESTAMPTZ,
  sync_hash TEXT, -- SHA-256 hash for change detection
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, contract_number)
);
```

---

## 3. Data Flow Examples

### 3.1 First-Time Setup Flow

1. **User Action**: Opens Contract Catalog page
2. **System**: Checks for existing sync config (none found)
3. **User Action**: Clicks "Configure Sync"
4. **User Input**: 
   - Pastes Google Sheet URL: `https://docs.google.com/spreadsheets/d/ABC123/edit`
   - Sets Sheet Name: "Contracts"
   - Enables auto-sync with 240-minute interval
5. **System**: 
   - Extracts Sheet ID: "ABC123"
   - Saves config to `google_sheets_sync_config` table
6. **User Action**: Clicks "Sync Now"
7. **System**:
   - Invokes Edge Function with Sheet ID
   - Edge Function fetches data from Google Sheets API
   - Service layer detects headers (row 1)
   - Parses 1000 rows of contract data
   - Inserts 1000 contracts into database
   - Updates sync config with detected headers
8. **UI Update**: Shows "1000 contracts" and sync status

### 3.2 Auto-Sync Flow

1. **System**: Checks auto-sync interval (240 minutes elapsed)
2. **System**: Automatically triggers sync
3. **System**: 
   - Fetches latest data from Google Sheets
   - Compares sync hashes
   - Updates 50 changed contracts
   - Creates 10 new contracts
   - Marks 5 removed contracts as "expired"
4. **UI Update**: Updates contract table and sync status

### 3.3 Header Detection Example

**Google Sheet Structure**:
```
Row 1: [Empty row]
Row 2: ["NO", "Item", "No Kontrak", "Kontrak Mula", "Kontrak Tamat", "Pembekal", "Harga (RM)", ...]
Row 3: ["1", "Amisulpride 100mg", "KKM-44/2025", "7-Apr-2025", "6-Apr-2028", "Quality Reputation", "42.05", ...]
```

**Detection Process**:
1. Scans rows 0-14 (first 15 rows)
2. Row 0 (index 0): 1 non-empty cell, 0 keyword matches → Score: 0
3. Row 1 (index 1): 8 non-empty cells, 7 keyword matches → Score: 7 × (7/8) × 1 = 6.125 ✅
4. Row 2 (index 2): 8 non-empty cells, 0 keyword matches → Score: 0
5. **Result**: Row 1 selected as header row

**Column Mapping**:
- Index 0: "NO" → Row number (skipped)
- Index 1: "Item" → contractNameIdx = 1
- Index 2: "No Kontrak" → contractNumberIdx = 2
- Index 3: "Kontrak Mula" → startDateIdx = 3
- Index 4: "Kontrak Tamat" → endDateIdx = 4
- Index 5: "Pembekal" → supplierNameIdx = 5
- Index 6: "Harga (RM)" → valueIdx = 6

### 3.4 Data Parsing Example

**Input Row** (after header detection):
```javascript
["1", "Amisulpride 100mg Tablet", "KKM-44/2025/F(U)", "7-Apr-2025", "6-Apr-2028", "Quality Reputation Sdn Bhd", "42.05", "Box of 30's", "Tidak melebihi 30 hari...", "SST Amisulpride.pdf"]
```

**Parsed Contract**:
```javascript
{
  contract_number: "KKM-44/2025/F(U)",
  contract_name: "Amisulpride 100mg Tablet",
  supplier_name: "Quality Reputation Sdn Bhd",
  start_date: "2025-04-07",
  end_date: "2028-04-06",
  value: 42.05,
  currency: "MYR",
  status: "active",
  tempoh_serahan: "Tidak melebihi 30 hari...",
  sst: "SST Amisulpride.pdf",
  metadata: {
    "NO": "1",
    "Unit": "Box of 30's",
    // ... other unmapped columns
  }
}
```

---

## 4. Error Handling & Edge Cases

### 4.1 Common Errors

#### 4.1.1 Sheet Not Accessible (403)
**Cause**: Sheet is private and no API key provided
**Solution**: 
- Make sheet publicly viewable: Share → "Anyone with the link" → Viewer
- OR provide Google Sheets API key in configuration

#### 4.1.2 Invalid Sheet ID (404)
**Cause**: Sheet ID is incorrect or sheet was deleted
**Solution**: Verify Sheet ID/URL is correct

#### 4.1.3 No Headers Found
**Cause**: Header row not detected or sheet is empty
**Solution**: 
- Ensure first row contains column names
- Use "Preview Headers" to verify detection
- Check if sheet has data

#### 4.1.4 No Data Rows
**Cause**: Only header row exists, no contract data
**Solution**: Add contract data below header row

#### 4.1.5 Rate Limited (429)
**Cause**: Too many API requests
**Solution**: Wait a few minutes and retry, or increase sync interval

### 4.2 Edge Cases Handled

1. **Squashed CSV Data**: Auto-detects and repairs when entire CSV is pasted into one column
2. **Multiple Header Rows**: Uses score-based detection to find best header row
3. **Empty Rows**: Skips empty rows during parsing
4. **Missing Fields**: Provides defaults (e.g., default contract name, status = "active")
5. **Invalid Dates**: Logs warning and continues with other fields
6. **Duplicate Contracts**: Uses upsert to handle duplicates gracefully
7. **Status Variations**: Normalizes various status formats (Malay, English, variations)

---

## 5. Security Considerations

### 5.1 Authentication
- Frontend requires user authentication (Supabase Auth)
- Edge Function validates JWT token
- Google Sheets API uses API key (optional for public sheets)

### 5.2 Data Privacy
- API keys stored securely in database (consider encryption)
- Hospital data isolation (filters by hospital_id)
- No sensitive data exposed in error messages

### 5.3 Access Control
- Users can only sync sheets for their hospital
- RLS (Row Level Security) on database tables
- Edge Function checks user permissions

---

## 6. Performance Optimizations

### 6.1 Caching
- Detected headers cached in sync config (prevents re-detection)
- Column mapping indices cached (consistent parsing)

### 6.2 Batch Processing
- Processes contracts in batches
- Uses database transactions for consistency

### 6.3 Sync Hash
- Only updates contracts if data changed (hash comparison)
- Reduces unnecessary database writes

### 6.4 Rate Limiting
- Respects Google Sheets API rate limits
- Configurable sync intervals prevent excessive requests

---

## 7. Testing & Validation

### 7.1 Test Scenarios

1. **First-Time Sync**: Test with new sheet, verify all contracts imported
2. **Incremental Sync**: Test with modified sheet, verify only changes synced
3. **Header Detection**: Test with various header row positions
4. **Error Handling**: Test with invalid sheet ID, private sheet, empty sheet
5. **Auto-Sync**: Test automatic sync at configured intervals
6. **Data Validation**: Test with invalid dates, statuses, contract numbers

### 7.2 Validation Checks

- ✅ Sheet ID extraction works with various URL formats
- ✅ Header detection finds correct row
- ✅ Column mapping matches all expected fields
- ✅ Date parsing handles multiple formats
- ✅ Status normalization works for all variations
- ✅ Sync hash detects changes correctly
- ✅ Database constraints prevent duplicates
- ✅ Error messages are user-friendly

---

## 8. Future Enhancements

### 8.1 Planned Features
- Support for multiple sheets (multiple sync configs)
- Column mapping UI (manual override of auto-detection)
- Sync history/logs
- Conflict resolution UI
- Export to Excel/CSV
- Real-time sync (webhook-based)

### 8.2 Improvements
- Better error recovery (retry logic)
- Progress indicators for large syncs
- Preview before sync
- Undo sync functionality
- Column type detection (automatically detect date/number columns)

---

## 9. Dependencies

### 9.1 Frontend
- React 18+
- TypeScript
- Supabase JS Client
- Lucide React (icons)
- Tailwind CSS (styling)

### 9.2 Backend
- Supabase Edge Functions (Deno runtime)
- Google Sheets API v4
- Supabase/PostgreSQL database

### 9.3 Required Services
- Supabase project (database + Edge Functions)
- Google Cloud Console project (for API key, optional)
- Google Sheet (public or with API access)

---

## 10. Configuration Guide

### 10.1 Setting Up Google Sheet

1. **Create or Open Google Sheet**
2. **Format Sheet**:
   - First row should contain column headers
   - Use clear column names (e.g., "Item", "No Kontrak", "Pembekal")
   - Start data from row 2
3. **Share Settings** (for public access):
   - Click "Share" → "Change" → "Anyone with the link" → "Viewer"
   - OR get API key from Google Cloud Console

### 10.2 Getting Google Sheets API Key (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable "Google Sheets API"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. (Optional) Restrict API key to Google Sheets API only
6. Copy API key and paste in configuration

### 10.3 System Configuration

1. **Configure Sync**:
   - Open Contract Catalog page
   - Click "Configure Sync"
   - Enter Sheet ID or URL
   - Set Sheet Name (if not "Sheet1")
   - (Optional) Enter API key
   - Enable auto-sync if desired
   - Set sync interval
   - Click "Save Configuration"

2. **Test Sync**:
   - Click "Preview Headers" to verify headers detected
   - Click "Sync Now" to perform first sync
   - Check sync status and error messages if any

---

## 11. Troubleshooting

### 11.1 Sync Fails Immediately
- **Check**: Is Supabase configured?
- **Check**: Is user logged in?
- **Check**: Is sheet ID valid?

### 11.2 Headers Not Detected
- **Check**: Does first row contain column names?
- **Check**: Are column names in Malay/English with contract-related keywords?
- **Solution**: Try "Preview Headers" to see what's detected

### 11.3 Data Not Parsing Correctly
- **Check**: Are columns in expected format (dates, numbers)?
- **Check**: Use "Preview Headers" to verify column mapping
- **Solution**: Adjust column names in Google Sheet to match expected keywords

### 11.4 Auto-Sync Not Working
- **Check**: Is auto-sync enabled in configuration?
- **Check**: Is sync interval set correctly?
- **Check**: Browser console for errors

---

## 12. Conclusion

This system provides a robust, flexible solution for synchronizing contract data from Google Sheets. It handles various sheet structures, detects headers automatically, and syncs data efficiently while providing a user-friendly interface for configuration and monitoring.

The architecture is designed to be:
- **Scalable**: Handles large sheets (1000+ rows) efficiently
- **Flexible**: Works with various sheet formats and structures
- **Reliable**: Error handling and validation prevent data corruption
- **User-Friendly**: Clear error messages and status indicators
- **Secure**: Proper authentication and data isolation

For questions or issues, refer to the troubleshooting section or contact the development team.
