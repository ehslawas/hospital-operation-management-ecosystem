# Unit Catalog - Revised Implementation Plan

## 📋 Overview

The Unit Catalog defines which departments/units are available in each hospital based on activated modules. Each unit has:
- One person in charge (responsible person)
- A catalog of drugs they can indent (with individual active/inactive toggle, min/max limits per item)
- A catalog of non-drugs they can indent (with individual active/inactive toggle, min/max limits per item)
- Overall status (active/inactive) for the unit

## 🎯 Key Requirements

1. **Unit/Department Selection**: Based on activated modules for the hospital
   - Pharmacy Logistic
   - Pharmacy Substor
   - General Ward
   - Emergency & Trauma
   - CSSU & CSSD
   - Operation Theater
   - Laboratory
   - Radiologi & Radiography
   - Haemodialisis
   - Paediatric Ward
   - Maternity Ward
   - Klinik Pakar
   - Driver Room
   - Office Admin

2. **Per Unit Configuration**:
   - One responsible person (person in charge)
   - Status: Active/Inactive for the entire unit
   - Last update tracking and change logs

3. **Per Item Configuration** (for each drug/non-drug):
   - Active/Inactive toggle (whether this specific item can be indented by this unit)
   - Minimum limit (minimum request quantity)
   - Maximum limit (maximum request quantity)

## 🗄️ Database Schema Redesign

### Main Table: `pharmacy_unit_catalog`

This table stores the unit/department level configuration.

```sql
CREATE TABLE pharmacy_unit_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  module_code TEXT NOT NULL, -- Links to hospital_modules.module_code
  
  -- Responsibility
  responsible_user_id UUID REFERENCES users(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Last Update Tracking
  last_updated_at TIMESTAMP WITH TIME ZONE,
  last_updated_by UUID REFERENCES users(id),
  last_update_reason TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(hospital_id, department_id) -- One catalog entry per department
);
```

### Catalog Items Table: `pharmacy_unit_catalog_items`

This table stores the individual drugs and non-drugs that each unit can indent.

```sql
CREATE TABLE pharmacy_unit_catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID NOT NULL REFERENCES pharmacy_unit_catalog(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  
  -- Item Type and Reference
  item_type TEXT NOT NULL CHECK (item_type IN ('drug', 'non_drug')),
  drug_id UUID REFERENCES drugs(id) ON DELETE CASCADE, -- NULL if non_drug
  non_drug_id UUID REFERENCES non_drugs(id) ON DELETE CASCADE, -- NULL if drug
  
  -- Configuration
  is_active BOOLEAN NOT NULL DEFAULT true,
  min_limit INTEGER NOT NULL DEFAULT 1,
  max_limit INTEGER, -- NULL = unlimited
  
  -- Last Update Tracking
  last_updated_at TIMESTAMP WITH TIME ZONE,
  last_updated_by UUID REFERENCES users(id),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(catalog_id, drug_id) WHERE drug_id IS NOT NULL,
  UNIQUE(catalog_id, non_drug_id) WHERE non_drug_id IS NOT NULL,
  CHECK (
    (item_type = 'drug' AND drug_id IS NOT NULL AND non_drug_id IS NULL) OR
    (item_type = 'non_drug' AND non_drug_id IS NOT NULL AND drug_id IS NULL)
  )
);
```

### Change Log Table: `pharmacy_unit_catalog_changes`

Same as before, tracks changes to the unit catalog.

```sql
CREATE TABLE pharmacy_unit_catalog_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID NOT NULL REFERENCES pharmacy_unit_catalog(id) ON DELETE CASCADE,
  item_id UUID REFERENCES pharmacy_unit_catalog_items(id) ON DELETE CASCADE, -- NULL if catalog-level change
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  
  -- Who & When
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- What Changed
  field_name TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  
  -- Context
  change_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

## 🎨 UI/UX Design

### Main Page Structure

1. **KPI Cards**:
   - Total Units
   - Active Units
   - Inactive Units
   - Units with Items

2. **Unit List Table**:
   - Department Name
   - Module
   - Responsible Person
   - Drug Items Count
   - Non-Drug Items Count
   - Status
   - Last Updated
   - Actions (Edit, Manage Items, View History)

3. **Add/Edit Unit Modal**:
   - Department Selection (dropdown - only departments from activated modules)
   - Module (auto-populated, read-only)
   - Responsible Person (dropdown)
   - Status (dropdown)
   - Notes (optional)

4. **Manage Items Modal** (for each unit):
   - Two tabs: "Drugs" and "Non-Drugs"
   - For each tab:
     - Search/Filter
     - Add Items button
     - Table showing:
       - Item Code
       - Item Name
       - Active Toggle (switch)
       - Min Limit (input)
       - Max Limit (input)
       - Actions (Edit, Remove)
   - Bulk operations: Add multiple items, toggle multiple items active/inactive

## 🔄 Implementation Steps

1. ✅ Create revised database migration
2. ✅ Update TypeScript types
3. ✅ Update service layer (unitCatalogService.ts)
4. ✅ Create item management service (unitCatalogItemService.ts)
5. ✅ Update UI components:
   - Main UnitCatalogPage
   - UnitFormModal (simplified - just unit info)
   - CatalogItemsModal (new - manage items for a unit)
6. ✅ Add change logging for items
7. ✅ Testing

## 📝 API Functions

### Unit Catalog Service
- `getUnitCatalogs()` - Get all units with item counts
- `getUnitCatalog(id)` - Get single unit with items
- `createUnitCatalog()` - Create new unit
- `updateUnitCatalog()` - Update unit info
- `deleteUnitCatalog()` - Delete unit (cascades to items)

### Unit Catalog Items Service
- `getCatalogItems(catalogId, itemType?)` - Get items for a unit
- `addCatalogItem()` - Add single item
- `addCatalogItems()` - Bulk add items
- `updateCatalogItem()` - Update item (active, min, max)
- `deleteCatalogItem()` - Remove item
- `toggleCatalogItem()` - Toggle active status

