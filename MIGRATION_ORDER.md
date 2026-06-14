# Supabase Migration Order

## ⚠️ IMPORTANT: Run migrations in this exact order

### Step 1: Base Tables (Run First)
**File**: `000_base_tables.sql`
- Creates core tables: hospitals, roles, departments, users, access_requests
- Creates indexes and triggers
- **Must run this FIRST** as other migrations depend on these tables

### Step 2: System Admin Tables
**File**: `001_system_admin_tables.sql`
- Creates System Admin specific tables:
  - hospital_modules
  - system_health_logs
  - system_backups
  - system_alerts
- Updates hospitals table with additional columns
- Creates triggers for updated_at

### Step 3: Seed System Roles
**File**: `011_seed_system_roles.sql`
- Creates essential system roles:
  - `system_admin` - System Administrator role
  - `hospital_admin` - Hospital Administrator role
- **Must run after base tables but before RLS policies**
- These roles are required for the application to function

### Step 4: RLS Policies
**File**: `002_rls_policies.sql`
- Sets up Row Level Security policies for all tables
- Creates policies for:
  - hospitals
  - hospital_modules
  - system_health_logs
  - system_backups
  - system_alerts
  - users
  - access_requests
- **Must run after tables and roles are created**

### Step 5: Fix Roles RLS
**File**: `010_fix_roles_rls.sql`
- Fixes RLS policies on roles table
- Allows authenticated users to read roles (needed for role lookups)
- **Run after RLS policies are created**

### Step 6: Create Audit Logs Table
**File**: `012_create_audit_logs_table.sql`
- Creates audit_logs table for tracking system actions
- Required for audit logging functionality
- **Run after users table is created**

### Step 6a: Fix Audit Logs user_id
**File**: `014_fix_audit_logs_user_id_nullable.sql`
- Makes user_id nullable to support ON DELETE SET NULL
- Allows audit logs to be preserved when users are deleted
- **Run immediately after creating audit_logs table**

### Step 7: Database Functions
**File**: `004_database_functions.sql`
- Creates helper functions and triggers
- Auto-alert functions
- Statistics functions
- Cleanup functions
- **Can run after RLS policies**

### Step 8: Pharmacy Catalog Tables
**File**: `005_pharmacy_catalog_tables.sql`
- Creates pharmacy catalog tables:
  - uploaded_files (tracks file uploads to prevent duplicates)
  - drug_categories
  - non_drug_categories
  - suppliers
  - drugs
  - non_drugs
- Creates helper functions for duplicate checking and category management
- Creates indexes and triggers
- **Run after base tables**

### Step 9: Create Memos Table
**File**: `015_create_memos_table.sql`
- Creates memos table for hospital announcements, policies, events, and communications
- Includes RLS policies for:
  - System Admin: Full access
  - Hospital Admin: Manage memos for their hospital
  - All users: View published memos for their hospital
- Creates indexes for performance
- **Run after users and hospitals tables are created**

### Step 10: Create Sensitive Data Requests Table
**File**: `016_create_sensitive_data_requests_table.sql`
- Creates sensitive_data_requests table for managing access requests to sensitive patient data
- Creates sensitive_data_access_logs table for audit logging
- Includes RLS policies for:
  - System Admin: Full access
  - Hospital Admin: Manage requests for their hospital
  - Users: Create and view requests for their hospital
- Creates indexes for performance
- **Run after users and hospitals tables are created**

### Step 11: Create Hospital Health Metrics Table
**File**: `017_create_hospital_health_metrics_table.sql`
- Creates hospital_health_metrics table for monitoring hospital system health
- Tracks metrics: active_sessions, database, storage, api_latency, error_rate
- Includes RLS policies for:
  - System Admin: Full access
  - Hospital Admin: Manage metrics for their hospital
  - Users: View metrics for their hospital
- Creates indexes for performance
- **Run after hospitals table is created**

### Step 12: Add hospital_id to system_backups
**File**: `018_add_hospital_id_to_system_backups.sql`
- Adds hospital_id column to system_backups table (nullable)
- Allows backups to be associated with specific hospitals
- System-wide backups can have NULL hospital_id
- Updates RLS policies to support hospital-specific backups
- Creates index for performance
- **Run after system_backups table exists (from migration 001)**

### Step 6: Seed System Admin (Optional)
**File**: `003_seed_system_admin.sql`
- Instructions for creating initial System Admin
- **DO NOT run directly** - follow instructions manually
- Only needed for initial setup

## Quick Start

```sql
-- In Supabase SQL Editor, run in this order:

-- 1. Base tables
\i supabase/migrations/000_base_tables.sql

-- 2. System Admin tables
\i supabase/migrations/001_system_admin_tables.sql

-- 3. Seed System Roles (REQUIRED - creates system_admin and hospital_admin roles)
\i supabase/migrations/011_seed_system_roles.sql

-- 4. RLS Policies
\i supabase/migrations/002_rls_policies.sql

-- 5. Fix Roles RLS
\i supabase/migrations/010_fix_roles_rls.sql

-- 6. Create Audit Logs Table
\i supabase/migrations/012_create_audit_logs_table.sql

-- 6a. Fix Audit Logs user_id (make nullable)
\i supabase/migrations/014_fix_audit_logs_user_id_nullable.sql

-- 7. Database Functions
\i supabase/migrations/004_database_functions.sql

-- 8. Pharmacy Catalog Tables
\i supabase/migrations/005_pharmacy_catalog_tables.sql

-- 9. Hospital Modules RLS Wide Read (optional, but recommended for now)
\i supabase/migrations/013_hospital_modules_rls_wide.sql

-- 10. Create Memos Table
\i supabase/migrations/015_create_memos_table.sql

-- 11. Create Sensitive Data Requests Table
\i supabase/migrations/016_create_sensitive_data_requests_table.sql

-- 12. Create Hospital Health Metrics Table
\i supabase/migrations/017_create_hospital_health_metrics_table.sql

-- 13. Add hospital_id to system_backups
\i supabase/migrations/018_add_hospital_id_to_system_backups.sql

-- 14. Allow Optional Manual PO Fields (Drop Constraints)
\i supabase/migrations/051_allow_optional_manual_po_fields.sql
```

## Verification

After running all migrations, verify tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'hospitals',
    'roles',
    'departments',
    'users',
    'access_requests',
    'hospital_modules',
    'system_health_logs',
    'system_backups',
    'system_alerts',
    'uploaded_files',
    'drug_categories',
    'non_drug_categories',
    'suppliers',
    'drugs',
    'non_drugs',
    'memos',
    'sensitive_data_requests',
    'sensitive_data_access_logs',
    'hospital_health_metrics',
    'system_backups' (with hospital_id column)
  )
ORDER BY table_name;
```

## Common Issues

1. **Foreign key errors**: Make sure base tables are created first
2. **RLS blocking operations**: Ensure RLS policies are created after tables
3. **Function errors**: Check that referenced tables exist
4. **Trigger errors**: Verify update_updated_at_column() function exists

