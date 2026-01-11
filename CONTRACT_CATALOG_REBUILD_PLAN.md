# Contract Catalog Rebuild Plan

## Executive Summary
Complete redesign of the Contract Catalog system, replacing the buggy Google Sheets sync approach with a clean, modern Excel upload system similar to the Drug and Non-Drug catalogs.

---

## Current State Analysis

### Problems with Existing Implementation
1. **Google Sheets Sync Complexity**: Current `ContractCatalogPage.tsx` (713 lines) uses Google Sheets sync with many bugs
2. **Configuration Overhead**: Requires complex setup with Google Sheets API, sheet ID, header mapping
3. **Error-Prone**: Multiple issues with header detection, sync status, and data mapping
4. **Poor User Experience**: Users want simple file upload, not external sheet configuration

### Files to Remove/Replace
- `src/pages/pharmacy/catalog/ContractCatalogPage.tsx` - Current buggy implementation
- `src/app/contract-catalog/page.tsx` - Placeholder Next.js page
- Google Sheets specific code in `src/services/pharmacy/googleSheetsService.ts` (contract-related only)

---

## New Approach: Excel Upload System

### Design Philosophy
**"Upload and Display"** - Similar to Drug/Non-Drug catalogs:
1. User uploads Excel file with contract data
2. System intelligently maps columns
3. Data is validated and imported
4. Display in modern, professional table with filters and search

---

## Required Headers (from User Screenshots)

Based on the provided images, the Contract Catalog must support these columns:

| Column Name | Malay Name | Type | Required | Description |
|------------|------------|------|----------|-------------|
| Item | Item | String | Yes | Item/Product name |
| No Kontrak | Contract Number | String | Yes | Unique contract identifier |
| Kontrak Mula | Contract Start | Date | No | Contract start date |
| Kontrak Tamat | Contract End | Date | No | Contract end date |
| Pembekal | Supplier | String | No | Supplier/Vendor name |
| Unit | Unit | String | No | Unit of measure |
| Harga (RM) | Price | Number | No | Unit price in Ringgit Malaysia |
| Tempoh Serahan | Delivery Period | String | No | Expected delivery timeframe |
| SST | SST | String/Number | No | Sales and Service Tax |

---

## Technical Architecture

### 1. Database Schema Update

**New Migration: `039_contract_catalog_redesign.sql`**

```sql
-- Drop Google Sheets specific columns
ALTER TABLE contracts DROP COLUMN IF EXISTS google_sheet_row_index;
ALTER TABLE contracts DROP COLUMN IF EXISTS sync_hash;
ALTER TABLE contracts DROP COLUMN IF EXISTS last_synced_at;

-- Rename and restructure for Excel upload approach
ALTER TABLE contracts 
  RENAME COLUMN contract_name TO item_name;

-- Add new columns for contract catalog
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS 
  item_code TEXT; -- For item identification
  
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS 
  unit TEXT; -- Unit of measure
  
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS 
  unit_price DECIMAL(15,2); -- Price per unit
  
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS 
  delivery_period TEXT; -- Tempoh Serahan
  
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS 
  sst_rate TEXT; -- SST percentage or amount

-- Update metadata to store additional fields
-- metadata JSONB will store: { sst_details, notes, custom_fields }

-- Update catalog_type in uploaded_files
ALTER TABLE uploaded_files DROP CONSTRAINT IF EXISTS uploaded_files_catalog_type_check;
ALTER TABLE uploaded_files ADD CONSTRAINT uploaded_files_catalog_type_check 
  CHECK (catalog_type IN ('drug', 'non_drug', 'contract'));
```

### 2. Service Layer

**New File: `src/services/pharmacy/contractCatalogService.ts`**

Functions to implement:
- `getContracts()` - Fetch contracts with filters
- `getContractById()` - Get single contract
- `createContract()` - Add new contract
- `updateContract()` - Update existing contract
- `deleteContract()` - Remove contract
- `batchImportContracts()` - Import from Excel (main function)
- `exportContractCatalog()` - Export to Excel
- `getContractKPIs()` - Dashboard statistics

### 3. Component Structure

**New File: `src/pages/pharmacy/catalog/ContractCatalogPage.tsx`**

Layout:
```
┌─────────────────────────────────────────────┐
│  📋 Contract Catalog                        │
│  Synced from uploaded files • 1000 contracts│
├─────────────────────────────────────────────┤
│  [KPI Cards: Total | Active | Expiring]    │
├─────────────────────────────────────────────┤
│  [Search] [Filters ▼]    [Upload] [Export] │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │  DATA TABLE                         │   │
│  │  - Item                             │   │
│  │  - No Kontrak                       │   │
│  │  - Kontrak Mula / Tamat            │   │
│  │  - Pembekal                        │   │
│  │  - Unit                            │   │
│  │  - Harga (RM)                      │   │
│  │  - Tempoh Serahan                  │   │
│  │  - SST                             │   │
│  │  - Status                          │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  [Pagination: 1 2 3 ... 10]                │
└─────────────────────────────────────────────┘
```

### 4. Excel Import Configuration

**Field Mappings** (AI-assisted):
```typescript
const contractImportFields = [
  { key: 'item_name', label: 'Item', required: true, type: 'string' },
  { key: 'contract_number', label: 'No Kontrak', required: true, type: 'string' },
  { key: 'start_date', label: 'Kontrak Mula', required: false, type: 'date' },
  { key: 'end_date', label: 'Kontrak Tamat', required: false, type: 'date' },
  { key: 'supplier_name', label: 'Pembekal', required: false, type: 'string' },
  { key: 'unit', label: 'Unit', required: false, type: 'string' },
  { key: 'unit_price', label: 'Harga (RM)', required: false, type: 'number' },
  { key: 'delivery_period', label: 'Tempoh Serahan', required: false, type: 'string' },
  { key: 'sst_rate', label: 'SST', required: false, type: 'string' },
  { key: 'status', label: 'Status', required: false, type: 'select' }
]
```

---

## Implementation Steps

### Phase 1: Database & Service Layer (Foundation)
1. ✅ Create new database migration
2. ✅ Create `contractCatalogService.ts` with CRUD operations
3. ✅ Implement `batchImportContracts()` function
4. ✅ Add validation rules (similar to drugs/non-drugs)
5. ✅ Update `uploadService.ts` to support 'contract' catalog type
6. ✅ Update TypeScript types in `src/types/index.ts`

### Phase 2: UI Components (User Interface)
7. ✅ Create new `ContractCatalogPage.tsx` component
8. ✅ Design KPI cards (Total, Active, Expiring Soon)
9. ✅ Implement search and filter functionality
10. ✅ Create data table with all required columns
11. ✅ Add sorting and pagination
12. ✅ Integrate `ExcelImport` component
13. ✅ Add export functionality

### Phase 3: Validation & Polish (Quality)
14. ✅ Implement duplicate detection (by contract_number)
15. ✅ Add date validation (end_date > start_date)
16. ✅ Add status indicators (active, expired, expiring)
17. ✅ Add bulk actions (delete, export selected)
18. ✅ Add responsive design for mobile
19. ✅ Add loading states and error handling

### Phase 4: Testing & Cleanup (Final)
20. ✅ Test Excel import with sample data
21. ✅ Test all CRUD operations
22. ✅ Test filters and search
23. ✅ Remove old ContractCatalogPage.tsx
24. ✅ Clean up unused Google Sheets code
25. ✅ Update routing if needed

---

## UI/UX Design Specifications

### Color Scheme
- **Primary**: Blue (#3B82F6) - Professional, trustworthy
- **Success**: Green (#10B981) - Active contracts
- **Warning**: Amber (#F59E0B) - Expiring soon
- **Danger**: Red (#EF4444) - Expired contracts
- **Neutral**: Gray scale for backgrounds

### Typography
- **Headings**: Inter/SF Pro, 600 weight
- **Body**: Inter/SF Pro, 400 weight
- **Numbers**: Tabular figures for alignment

### Components
- **Cards**: Rounded corners (12px), subtle shadows
- **Buttons**: Solid primary, outline secondary
- **Table**: Striped rows, hover effects, sticky header
- **Modals**: Centered, backdrop blur
- **Inputs**: Rounded, focus ring, clear validation states

---

## Validation Rules

### Contract Number Validation
```typescript
// Must be unique per hospital
// Format: Allow alphanumeric, dots, hyphens
// Min length: 3 characters
// Exclude: Headers, placeholders
const invalidContractNumbers = [
  'CONTRACT', 'NO KONTRAK', 'CONTRACT_NUMBER', 
  'ITEM CODE', 'SAMPLE', 'TEST'
]
```

### Date Validation
```typescript
// Start date must be <= End date
// Warn if contract expired
// Highlight contracts expiring within 30 days
```

### Price Validation
```typescript
// Must be >= 0
// Format: 2 decimal places
// Currency: MYR (Ringgit Malaysia)
```

---

## Sample Excel Template

Users should upload Excel files with these headers:

| Item | No Kontrak | Kontrak Mula | Kontrak Tamat | Pembekal | Unit | Harga (RM) | Tempoh Serahan | SST |
|------|------------|--------------|---------------|----------|------|------------|----------------|-----|
| Surgical Gloves | .31.123.75.22-May-2028 | 2024-05-22 | 2028-05-22 | ABC Medical Supply | Box | 45.00 | 7 days | 6% |
| Medical Mask | .34.Q.47.18.29-Oct-2026 | 2024-10-29 | 2026-10-29 | XYZ Healthcare | Pack | 12.50 | 3 days | 6% |

**Template Download**: System will provide downloadable template

---

## Performance Considerations

### Optimization Strategies
1. **Batch Processing**: Import 100 items at a time
2. **Progress Indicator**: Real-time import progress
3. **Indexing**: Database indexes on contract_number, hospital_id, status
4. **Lazy Loading**: Pagination with adjustable page size
5. **Caching**: Cache KPIs and filter options
6. **Debouncing**: Search input debounced 300ms

---

## Security & Access Control

### Row-Level Security (RLS)
```sql
-- Users can only access contracts from their hospital
CREATE POLICY hospital_scoped_contracts ON contracts
  FOR ALL USING (hospital_id = (
    SELECT hospital_id FROM users WHERE id = auth.uid()
  ));
```

### Permissions
- **Pharmacy Admin**: Full CRUD access
- **Pharmacy Staff**: Read + Import
- **System Admin**: Full access across hospitals

---

## Success Metrics

### User Experience
- ✅ Upload to display: < 10 seconds (for 1000 items)
- ✅ Search response: < 500ms
- ✅ Page load: < 2 seconds
- ✅ Mobile responsive: 100% functionality

### Data Quality
- ✅ Duplicate detection: 100% accuracy
- ✅ Validation coverage: All required fields
- ✅ Error reporting: Clear, actionable messages

---

## Maintenance & Support

### Documentation
- User guide for Excel upload
- Column mapping guide
- Troubleshooting FAQ
- API documentation

### Monitoring
- Track import success rates
- Monitor query performance
- Log validation errors
- User feedback collection

---

## Future Enhancements (Post-MVP)

1. **Contract Alerts**: Email notifications for expiring contracts
2. **Supplier Integration**: Link to supplier catalog
3. **Price History**: Track price changes over time
4. **Bulk Updates**: Update multiple contracts at once
5. **Advanced Filters**: Date range, price range, supplier group
6. **Reports**: Contract summary reports, spending analysis
7. **OCR Support**: Extract data from scanned documents
8. **API Integration**: Import from government procurement systems

---

## Rollout Plan

### Week 1: Foundation
- Database migration
- Service layer
- Basic CRUD operations

### Week 2: UI Development
- Page layout
- KPI cards
- Data table
- Import modal

### Week 3: Polish & Testing
- Validation rules
- Error handling
- Responsive design
- User testing

### Week 4: Deployment
- Remove old code
- Deploy to production
- User training
- Monitor and support

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Backup existing data, test migration on staging |
| Excel format variations | Medium | Flexible column mapping, validation |
| Performance issues | Medium | Pagination, indexing, batch processing |
| User adoption | Low | Similar to existing catalogs, easy to use |

---

## Conclusion

This rebuild will deliver a **modern, professional, and reliable** Contract Catalog system that matches the quality of the Drug and Non-Drug catalogs. By removing the buggy Google Sheets sync and implementing a simple Excel upload approach, we'll provide users with an intuitive and efficient workflow.

**Estimated Effort**: 2-3 weeks
**Priority**: High (user-requested fix)
**Impact**: High (critical pharmacy functionality)

---

## Appendix

### Reference Files
- Drug Catalog: `src/pages/pharmacy/catalog/DrugCatalogPage.tsx`
- Non-Drug Catalog: `src/pages/pharmacy/catalog/NonDrugCatalogPage.tsx`
- Excel Import: `src/components/pharmacy/ExcelImport.tsx`
- Drug Service: `src/services/pharmacy/drugCatalogService.ts`
- Upload Service: `src/services/pharmacy/uploadService.ts`

### Database Tables
- `contracts` - Main contract data
- `uploaded_files` - File tracking and duplicate detection
- `suppliers` - Reference for supplier data

---

**Document Version**: 1.0  
**Created**: January 10, 2026  
**Last Updated**: January 10, 2026  
**Status**: Ready for Implementation
