# SQL Migration Files Review Checklist

## ✅ Pre-Migration Checklist

### 1. File: `000_base_tables.sql`
- [x] Creates hospitals table with all required columns
- [x] Creates roles table with unique role_code
- [x] Creates departments table with hospital_id foreign key
- [x] Creates users table (with conditional creation)
- [x] Creates access_requests table with all fields from AccessRequest type
- [x] All foreign keys properly defined
- [x] All indexes created for performance
- [x] updated_at triggers created
- [x] Uses IF NOT EXISTS to prevent errors on re-run

**Issues Found**: None
**Status**: ✅ Ready to run

### 2. File: `001_system_admin_tables.sql`
- [x] Creates hospital_modules table
- [x] Creates system_health_logs table
- [x] Creates system_backups table
- [x] Creates system_alerts table
- [x] Updates hospitals table with new columns (uses DO block to check)
- [x] Creates update_updated_at_column() function
- [x] Creates triggers for updated_at
- [x] All CHECK constraints properly defined
- [x] All indexes created

**Issues Found**: None
**Status**: ✅ Ready to run (after 000_base_tables.sql)

### 3. File: `002_rls_policies.sql`
- [x] Creates check_single_system_admin() function
- [x] Creates trigger to enforce single System Admin
- [x] RLS policies for hospitals table
- [x] RLS policies for hospital_modules table
- [x] RLS policies for system_health_logs table
- [x] RLS policies for system_backups table
- [x] RLS policies for system_alerts table
- [x] RLS policies for users table
- [x] RLS policies for access_requests table (NEW - just added)
- [x] All policies use proper role checks
- [x] Service role policies included for admin operations

**Issues Found**: 
- ✅ Fixed: Added missing RLS policies for access_requests table
- ✅ Fixed: Added missing RLS policies for hospitals table

**Status**: ✅ Ready to run (after 000_base_tables.sql and 001_system_admin_tables.sql)

### 4. File: `004_database_functions.sql`
- [x] Creates auto_alert_on_critical_health() function
- [x] Creates trigger for critical health alerts
- [x] Creates auto_alert_on_backup_failure() function
- [x] Creates trigger for backup failure alerts
- [x] Creates get_system_statistics() function
- [x] Creates clean_old_health_logs() function
- [x] Creates clean_old_alerts() function
- [x] Creates get_module_usage_stats() function
- [x] All functions use SECURITY DEFINER appropriately
- [x] Proper GRANT statements for functions

**Issues Found**: None
**Status**: ✅ Ready to run (after all tables are created)

### 5. File: `003_seed_system_admin.sql`
- [x] Contains instructions only (commented out)
- [x] No actual data insertion (safe)
- [x] Clear instructions for manual setup

**Issues Found**: None
**Status**: ✅ Instructions only - safe to review

## 🔍 Critical Dependencies

1. **000_base_tables.sql** must run first
   - All other migrations depend on: hospitals, roles, departments, users

2. **001_system_admin_tables.sql** depends on:
   - hospitals table (for foreign keys)
   - users table (for foreign keys)

3. **002_rls_policies.sql** depends on:
   - All tables from 000_base_tables.sql
   - All tables from 001_system_admin_tables.sql
   - roles table (for role_code lookups)

4. **004_database_functions.sql** depends on:
   - All tables from previous migrations

## ⚠️ Potential Issues & Fixes

### Issue 1: Foreign Key Constraints
**Status**: ✅ Fixed
- All foreign keys properly reference existing tables
- Uses ON DELETE CASCADE where appropriate
- Uses ON DELETE RESTRICT for critical relationships

### Issue 2: RLS Policies Missing
**Status**: ✅ Fixed
- Added RLS policies for hospitals table
- Added RLS policies for access_requests table
- All tables now have proper RLS policies

### Issue 3: Column Existence Checks
**Status**: ✅ Good
- Uses DO blocks to check column existence before ALTER TABLE
- Prevents errors on re-run

### Issue 4: Trigger Existence
**Status**: ✅ Good
- Uses DROP TRIGGER IF EXISTS before CREATE
- Prevents duplicate trigger errors

### Issue 5: Function Existence
**Status**: ✅ Good
- Uses CREATE OR REPLACE FUNCTION
- Safe to re-run

## 📋 Final Verification

Before running migrations, ensure:

1. [x] All files are in correct order (000, 001, 002, 004)
2. [x] No syntax errors (reviewed all files)
3. [x] All foreign keys reference existing tables
4. [x] All RLS policies are defined
5. [x] All indexes are created
6. [x] All triggers are properly defined
7. [x] access_requests table is created
8. [x] access_requests RLS policies are defined

## 🚀 Ready to Run

All SQL files have been reviewed and are ready to run in Supabase.

**Execution Order**:
1. `000_base_tables.sql` ✅
2. `001_system_admin_tables.sql` ✅
3. `002_rls_policies.sql` ✅
4. `004_database_functions.sql` ✅
5. `003_seed_system_admin.sql` (instructions only - manual setup)

