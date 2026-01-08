# Unit Catalog System - Comprehensive Implementation Plan

## 📋 Overview

The Unit Catalog is a critical system component that determines what each hospital unit/department can indent (drug or non-drug), how many items they can keep, who is responsible, department status, current inventory counts, and maintains a complete audit trail of all changes.

## 🎯 Key Requirements

### Core Functionality
1. **Department/Unit Management**
   - Track all departments/units based on activated hospital modules
   - Each department must be linked to a module (pharmacy_logistics, general_ward, etc.)
   - Support for multiple departments per module (e.g., multiple wards)

2. **Indent Permissions**
   - Specify what items each unit can indent:
     - Drug items (yes/no)
     - Non-drug items (yes/no)
   - Can be configured per unit independently

3. **Capacity Management**
   - Maximum number of drug items allowed
   - Maximum number of non-drug items allowed
   - Real-time tracking of current counts
   - Visual indicators when approaching limits

4. **Responsibility Tracking**
   - Link to Head of Department (from departments.head_of_department_id)
   - Display responsible person details
   - Change tracking when responsibility changes

5. **Department Status**
   - Active: Can indent items
   - Inactive: Cannot indent items (maintenance, closed, etc.)
   - Suspended: Temporarily disabled

6. **Inventory Tracking**
   - Current count of drug items in unit
   - Current count of non-drug items in unit
   - Updated in real-time from stock transactions

7. **Catalog Update Tracking**
   - Last updated timestamp
   - Last updated by (user)
   - Update reason/notes

8. **Change Logs (Audit Trail)**
   - Complete history of all changes
   - Who made the change
   - When the change was made
   - What changed (field-level tracking)
   - Old values vs new values
   - Reason for change (optional)

## 🗄️ Database Schema Design

### Main Table: `pharmacy_unit_catalog`

```sql
CREATE TABLE pharmacy_unit_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  module_code TEXT NOT NULL, -- Links to hospital_modules.module_code
  
  -- Indent Permissions
  can_indent_drugs BOOLEAN NOT NULL DEFAULT true,
  can_indent_non_drugs BOOLEAN NOT NULL DEFAULT true,
  
  -- Capacity Limits
  max_drug_items INTEGER, -- NULL = unlimited
  max_non_drug_items INTEGER, -- NULL = unlimited
  
  -- Current Counts (denormalized for performance)
  current_drug_count INTEGER NOT NULL DEFAULT 0,
  current_non_drug_count INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Responsibility (references departments.head_of_department_id, but stored here for history)
  responsible_user_id UUID REFERENCES users(id),
  
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

-- Indexes
CREATE INDEX idx_unit_catalog_hospital ON pharmacy_unit_catalog(hospital_id);
CREATE INDEX idx_unit_catalog_department ON pharmacy_unit_catalog(department_id);
CREATE INDEX idx_unit_catalog_module ON pharmacy_unit_catalog(module_code);
CREATE INDEX idx_unit_catalog_status ON pharmacy_unit_catalog(status) WHERE status = 'active';
CREATE INDEX idx_unit_catalog_responsible ON pharmacy_unit_catalog(responsible_user_id);
```

### Change Log Table: `pharmacy_unit_catalog_changes`

```sql
CREATE TABLE pharmacy_unit_catalog_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID NOT NULL REFERENCES pharmacy_unit_catalog(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  
  -- Who & When
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- What Changed (field-level tracking)
  field_name TEXT NOT NULL,
  old_value JSONB, -- Can store any type (text, number, boolean, null)
  new_value JSONB,
  
  -- Context
  change_reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_unit_catalog_changes_catalog ON pharmacy_unit_catalog_changes(catalog_id);
CREATE INDEX idx_unit_catalog_changes_hospital ON pharmacy_unit_catalog_changes(hospital_id);
CREATE INDEX idx_unit_catalog_changes_user ON pharmacy_unit_catalog_changes(changed_by);
CREATE INDEX idx_unit_catalog_changes_date ON pharmacy_unit_catalog_changes(changed_at DESC);
CREATE INDEX idx_unit_catalog_changes_field ON pharmacy_unit_catalog_changes(field_name);
```

### Trigger for Automatic Change Logging

```sql
CREATE OR REPLACE FUNCTION log_unit_catalog_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_by_user UUID;
  changed_at_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get change metadata from NEW record if available
  changed_by_user := COALESCE(NEW.last_updated_by, auth.uid());
  changed_at_time := COALESCE(NEW.last_updated_at, NOW());

  -- Compare OLD and NEW values and log changes
  IF (OLD.can_indent_drugs IS DISTINCT FROM NEW.can_indent_drugs) THEN
    INSERT INTO pharmacy_unit_catalog_changes (catalog_id, hospital_id, changed_by, changed_at, field_name, old_value, new_value, change_reason)
    VALUES (NEW.id, NEW.hospital_id, changed_by_user, changed_at_time, 'can_indent_drugs', to_jsonb(OLD.can_indent_drugs), to_jsonb(NEW.can_indent_drugs), NEW.last_update_reason);
  END IF;

  IF (OLD.can_indent_non_drugs IS DISTINCT FROM NEW.can_indent_non_drugs) THEN
    INSERT INTO pharmacy_unit_catalog_changes (catalog_id, hospital_id, changed_by, changed_at, field_name, old_value, new_value, change_reason)
    VALUES (NEW.id, NEW.hospital_id, changed_by_user, changed_at_time, 'can_indent_non_drugs', to_jsonb(OLD.can_indent_non_drugs), to_jsonb(NEW.can_indent_non_drugs), NEW.last_update_reason);
  END IF;

  IF (OLD.max_drug_items IS DISTINCT FROM NEW.max_drug_items) THEN
    INSERT INTO pharmacy_unit_catalog_changes (catalog_id, hospital_id, changed_by, changed_at, field_name, old_value, new_value, change_reason)
    VALUES (NEW.id, NEW.hospital_id, changed_by_user, changed_at_time, 'max_drug_items', to_jsonb(OLD.max_drug_items), to_jsonb(NEW.max_drug_items), NEW.last_update_reason);
  END IF;

  IF (OLD.max_non_drug_items IS DISTINCT FROM NEW.max_non_drug_items) THEN
    INSERT INTO pharmacy_unit_catalog_changes (catalog_id, hospital_id, changed_by, changed_at, field_name, old_value, new_value, change_reason)
    VALUES (NEW.id, NEW.hospital_id, changed_by_user, changed_at_time, 'max_non_drug_items', to_jsonb(OLD.max_non_drug_items), to_jsonb(NEW.max_non_drug_items), NEW.last_update_reason);
  END IF;

  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO pharmacy_unit_catalog_changes (catalog_id, hospital_id, changed_by, changed_at, field_name, old_value, new_value, change_reason)
    VALUES (NEW.id, NEW.hospital_id, changed_by_user, changed_at_time, 'status', to_jsonb(OLD.status), to_jsonb(NEW.status), NEW.last_update_reason);
  END IF;

  IF (OLD.responsible_user_id IS DISTINCT FROM NEW.responsible_user_id) THEN
    INSERT INTO pharmacy_unit_catalog_changes (catalog_id, hospital_id, changed_by, changed_at, field_name, old_value, new_value, change_reason)
    VALUES (NEW.id, NEW.hospital_id, changed_by_user, changed_at_time, 'responsible_user_id', to_jsonb(OLD.responsible_user_id), to_jsonb(NEW.responsible_user_id), NEW.last_update_reason);
  END IF;

  IF (OLD.notes IS DISTINCT FROM NEW.notes) THEN
    INSERT INTO pharmacy_unit_catalog_changes (catalog_id, hospital_id, changed_by, changed_at, field_name, old_value, new_value, change_reason)
    VALUES (NEW.id, NEW.hospital_id, changed_by_user, changed_at_time, 'notes', to_jsonb(OLD.notes), to_jsonb(NEW.notes), NEW.last_update_reason);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER unit_catalog_changes_trigger
  AFTER UPDATE ON pharmacy_unit_catalog
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION log_unit_catalog_changes();
```

### Function to Sync Current Counts

```sql
CREATE OR REPLACE FUNCTION sync_unit_catalog_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_department_id UUID;
  v_item_type TEXT;
BEGIN
  -- Determine department and item type from stock transaction
  -- This is a simplified version - actual implementation depends on stock transaction structure
  
  -- Update counts based on transaction type
  -- This should be called when stock transactions are created/updated
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 📊 TypeScript Types

### Core Types

```typescript
export type UnitCatalogStatus = 'active' | 'inactive' | 'suspended'

export interface UnitCatalog extends BaseEntity {
  hospital_id: string
  department_id: string
  module_code: string
  
  // Indent Permissions
  can_indent_drugs: boolean
  can_indent_non_drugs: boolean
  
  // Capacity Limits
  max_drug_items?: number | null
  max_non_drug_items?: number | null
  
  // Current Counts
  current_drug_count: number
  current_non_drug_count: number
  
  // Status
  status: UnitCatalogStatus
  
  // Responsibility
  responsible_user_id?: string | null
  
  // Last Update Tracking
  last_updated_at?: string | null
  last_updated_by?: string | null
  last_update_reason?: string | null
  
  // Metadata
  notes?: string | null
}

export interface UnitCatalogWithRelations extends UnitCatalog {
  department?: Department
  responsible_user?: User
  last_updated_by_user?: User
  hospital?: Hospital
  module?: HospitalModule
}

export interface UnitCatalogChange extends BaseEntity {
  catalog_id: string
  hospital_id: string
  changed_by: string
  changed_at: string
  field_name: string
  old_value: any
  new_value: any
  change_reason?: string | null
  ip_address?: string | null
  user_agent?: string | null
}

export interface UnitCatalogChangeWithRelations extends UnitCatalogChange {
  changed_by_user?: User
  catalog?: UnitCatalog
}

export interface UnitCatalogFormData {
  department_id: string
  module_code: string
  can_indent_drugs: boolean
  can_indent_non_drugs: boolean
  max_drug_items?: number | null
  max_non_drug_items?: number | null
  status: UnitCatalogStatus
  responsible_user_id?: string | null
  notes?: string | null
  update_reason?: string | null
}

export interface UnitCatalogSummary {
  total_units: number
  active_units: number
  inactive_units: number
  suspended_units: number
  units_with_drug_access: number
  units_with_non_drug_access: number
  total_drug_items: number
  total_non_drug_items: number
  units_near_capacity: number
  units_at_capacity: number
}
```

## 🔧 Service Layer

### Key Functions

1. **getUnitCatalogs(hospitalId, filters)** - Get all unit catalogs with filters
2. **getUnitCatalog(id)** - Get single catalog with relations
3. **getUnitCatalogByDepartment(departmentId)** - Get catalog for specific department
4. **createUnitCatalog(data, userId)** - Create new catalog entry
5. **updateUnitCatalog(id, data, userId, reason)** - Update catalog with change tracking
6. **deleteUnitCatalog(id, userId)** - Soft delete or hard delete
7. **getUnitCatalogChanges(catalogId, filters)** - Get change log for a catalog
8. **syncUnitCatalogCounts(hospitalId)** - Sync current counts from stock transactions
9. **getUnitCatalogSummary(hospitalId)** - Get summary statistics
10. **getAvailableDepartments(hospitalId)** - Get departments that can have catalogs (based on modules)

## 🎨 UI Components

### Main Page Features

1. **Summary Dashboard**
   - Total units
   - Active/Inactive/Suspended counts
   - Units with drug/non-drug access
   - Total items tracked
   - Units near/at capacity alerts

2. **Unit Catalog Table**
   - Department name and code
   - Module name
   - Indent permissions (badges)
   - Capacity limits and current counts (progress bars)
   - Status badge
   - Responsible person
   - Last updated info
   - Actions (Edit, View History, View Details)

3. **Filters & Search**
   - Search by department name/code
   - Filter by module
   - Filter by status
   - Filter by indent permissions
   - Filter by capacity status (near limit, at limit, ok)

4. **Add/Edit Modal**
   - Department selector (only shows departments linked to active modules)
   - Module display (auto-populated from department)
   - Indent permissions checkboxes
   - Capacity limit inputs
   - Status selector
   - Responsible person selector
   - Notes textarea
   - Update reason (for edits)

5. **Change History Modal**
   - Timeline view of all changes
   - Shows field name, old value, new value
   - Who made the change and when
   - Change reason
   - Can filter by field, date range, user

6. **Detail View**
   - Full catalog information
   - Current inventory breakdown
   - Recent changes
   - Related stock locations
   - Quick actions

## 🔐 Permissions

- **View**: All pharmacy staff
- **Create/Edit**: Pharmacy Manager, Pharmacy Director
- **Delete**: Pharmacy Director only
- **View Change Logs**: All pharmacy staff
- **Export**: Pharmacy Manager, Pharmacy Director

## 📈 Real-time Updates

- Current counts should be updated automatically when:
  - Stock transactions occur (receipt, issue, transfer)
  - Items are received into the unit
  - Items are issued from the unit
  - Items are transferred between units

## ✅ Implementation Checklist

- [ ] Create database migration
- [ ] Create TypeScript types
- [ ] Create service functions
- [ ] Create UI page component
- [ ] Create form modals
- [ ] Create change history component
- [ ] Add route to router
- [ ] Add RLS policies
- [ ] Test all CRUD operations
- [ ] Test change logging
- [ ] Test count syncing
- [ ] Test permissions
- [ ] Test error handling
- [ ] Add validation
- [ ] Add loading states
- [ ] Add success/error toasts

## 🚀 Implementation Order

1. Database schema and migration
2. TypeScript types
3. Service layer (basic CRUD)
4. Change logging functionality
5. Count syncing functionality
6. UI components (page, table, filters)
7. Add/Edit modals
8. Change history modal
9. Integration and testing
10. Error handling and polish

---

**Document Created:** January 2026  
**Status:** Ready for Implementation  
**Priority:** HIGH - Critical for hospital operations

