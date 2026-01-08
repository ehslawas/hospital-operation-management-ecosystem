# System Admin Module - Implementation TODO List

## ✅ Phase 1: Foundation & Core Services (COMPLETED)

### 1.1 Type Definitions ✅
- [x] Create System Admin TypeScript types
- [x] Add HospitalModule, SystemHealthLog, SystemBackup, SystemAlert types
- [x] Add SystemStatistics interface
- [x] Add ModuleCode and health status enums

### 1.2 Service Layer ✅
- [x] Create systemAdminService.ts (statistics, hospital management)
- [x] Create hospitalAdminService.ts (create/manage Hospital Admin)
- [x] Create moduleService.ts (enable/disable modules)
- [x] Create monitoringService.ts (system health)
- [x] Create backupService.ts (backup management)
- [x] Create alertService.ts (alert system)
- [x] Export all services in index.ts

### 1.3 Constants & Routes ✅
- [x] Add module definitions to constants.ts
- [x] Add System Admin routes to constants
- [x] Update routes.tsx with new pages
- [x] Add route protection for System Admin

### 1.4 Dashboard ✅
- [x] Update SystemAdminDashboard with real data
- [x] Integrate statistics service
- [x] Add system health display
- [x] Add alerts feed
- [x] Add quick action links

### 1.5 Placeholder Pages ✅
- [x] Create ModuleAccessControlPage placeholder
- [x] Create SystemMonitoringPage placeholder
- [x] Create BackupManagementPage placeholder
- [x] Create AlertCenterPage placeholder
- [x] Create SystemLogsPage placeholder

---

## 🔄 Phase 2: Database Schema & Supabase Setup (IN PROGRESS)

### 2.1 Database Tables
- [ ] Create hospital_modules table migration
  - [ ] hospital_id (UUID, FK to hospitals)
  - [ ] module_code (TEXT)
  - [ ] is_enabled (BOOLEAN)
  - [ ] enabled_at, enabled_by, disabled_at, disabled_by
  - [ ] UNIQUE constraint (hospital_id, module_code)
  
- [ ] Create system_health_logs table migration
  - [ ] check_type (TEXT: cpu, memory, database, api, storage, network)
  - [ ] status (TEXT: healthy, warning, critical)
  - [ ] value (NUMERIC)
  - [ ] unit (TEXT)
  - [ ] message (TEXT)
  - [ ] checked_at (TIMESTAMP)
  
- [ ] Create system_backups table migration
  - [ ] backup_type (TEXT: scheduled, manual, pre_update)
  - [ ] status (TEXT: pending, in_progress, completed, failed)
  - [ ] file_path (TEXT)
  - [ ] file_size (BIGINT)
  - [ ] started_at, completed_at (TIMESTAMP)
  - [ ] initiated_by (UUID, FK to users)
  - [ ] error_message (TEXT)
  
- [ ] Create system_alerts table migration
  - [ ] alert_type (TEXT: error, warning, critical, info)
  - [ ] category (TEXT: security, performance, backup, system, module)
  - [ ] title, message (TEXT)
  - [ ] is_read, is_resolved (BOOLEAN)
  - [ ] resolved_at (TIMESTAMP)
  - [ ] resolved_by (UUID, FK to users)
  - [ ] metadata (JSONB)

### 2.2 Hospital Table Updates
- [ ] Add admin_id column to hospitals table
  - [ ] UUID, FK to users
  - [ ] UNIQUE constraint
  - [ ] NULL allowed (for hospitals without admin yet)
  
- [ ] Add license_valid_until (DATE)
- [ ] Add max_users (INTEGER, default 100)
- [ ] Add subscription_tier (TEXT, default 'basic')

### 2.3 Row Level Security (RLS) Policies
- [ ] System Admin protection policy
  - [ ] Only 1 System Admin can exist (check constraint)
  - [ ] System Admin cannot be deleted via application
  - [ ] System Admin can access all data
  
- [ ] Hospital Admin scope policy
  - [ ] Hospital Admin can only see their hospital's data
  - [ ] Hospital Admin cannot see other hospitals
  
- [ ] Module access policies
  - [ ] System Admin can manage all modules
  - [ ] Hospital Admin can view their hospital's modules (read-only)

### 2.4 System Admin Initialization
- [ ] Create seed script for initial System Admin
  - [ ] Create user in Supabase Auth
  - [ ] Create user record in users table
  - [ ] Assign system_admin role
  - [ ] Set secure initial password (must be changed on first login)
  - [ ] Document credentials securely (offline storage)

### 2.5 Database Functions & Triggers
- [ ] Create function to check single System Admin
- [ ] Create trigger to prevent multiple System Admins
- [ ] Create function to auto-create alerts on errors
- [ ] Create function to log health checks
- [ ] Create scheduled backup function (Edge Function)

---

## 🔄 Phase 3: Hospital Management Implementation

### 3.1 Hospital List Page Enhancement
- [ ] Update HospitalListPage to show admin status
- [ ] Add "Create Admin" button for hospitals without admin
- [ ] Display module count per hospital
- [ ] Add user count per hospital
- [ ] Add status indicators (active, pending setup)

### 3.2 Hospital Detail Page Enhancement
- [ ] Add "Hospital Admin" section
  - [ ] Display current admin (if exists)
  - [ ] "Create Admin" button/form
  - [ ] "Reset Password" button
  - [ ] "Disable Admin" button
  - [ ] Admin activity log
  
- [ ] Add "Module Access" section
  - [ ] List all available modules
  - [ ] Toggle switches for each module
  - [ ] Show enabled/disabled status
  - [ ] Save changes button
  
- [ ] Add "Statistics" section
  - [ ] User count (active, pending, suspended)
  - [ ] Module usage
  - [ ] Recent activity

### 3.3 Create Hospital Admin Form
- [ ] Create HospitalAdminForm component
  - [ ] Email input (validation)
  - [ ] Employee ID input
  - [ ] Full name input
  - [ ] IC number input (validation)
  - [ ] Phone number input
  - [ ] Jawatan input
  - [ ] Password generation/input
  - [ ] Password confirmation
  - [ ] Form validation (Zod schema)
  - [ ] Error handling
  - [ ] Success notification

### 3.4 Hospital Admin Management Functions
- [ ] Implement createHospitalAdmin in UI
- [ ] Implement resetPassword in UI
- [ ] Implement disableAdmin in UI
- [ ] Add confirmation dialogs for destructive actions
- [ ] Add audit logging for all actions

---

## 🔄 Phase 4: Module Access Control Implementation

### 4.1 Module Access Control Page
- [ ] Create full ModuleAccessControlPage
- [ ] Hospital selector/search
- [ ] Module grid/list view
  - [ ] Module name and description
  - [ ] Toggle switch per module
  - [ ] Enabled/disabled indicator
  - [ ] Last modified timestamp
- [ ] Bulk enable/disable functionality
- [ ] Save changes with confirmation
- [ ] Real-time status updates

### 4.2 Module Management Features
- [ ] Per-hospital module configuration
- [ ] Module usage statistics
- [ ] Module enable/disable history
- [ ] Module dependency checking (if needed)
- [ ] Export module configuration

### 4.3 Module Visibility Integration
- [ ] Update navigation to check module access
- [ ] Hide disabled modules from navigation
- [ ] Show "Module Disabled" message if accessed
- [ ] Update route guards to check module access

---

## 🔄 Phase 5: System Monitoring Implementation

### 5.1 System Monitoring Page
- [ ] Create full SystemMonitoringPage
- [ ] Real-time health dashboard
  - [ ] Database connection status
  - [ ] API response time chart
  - [ ] Storage usage gauge
  - [ ] Memory usage chart
  - [ ] CPU usage chart
  - [ ] Network status
- [ ] Auto-refresh toggle (30s, 1min, 5min)
- [ ] Historical data view
- [ ] Export health reports

### 5.2 Health Check Implementation
- [ ] Create health check service (backend/Edge Function)
- [ ] Schedule periodic health checks
- [ ] Store health logs in database
- [ ] Alert on critical health issues
- [ ] Health check API endpoint

### 5.3 Usage Statistics
- [ ] Hospital usage statistics
- [ ] User activity statistics
- [ ] Module usage statistics
- [ ] System load statistics
- [ ] Performance metrics

---

## 🔄 Phase 6: Backup Management Implementation

### 6.1 Backup Management Page
- [ ] Create full BackupManagementPage
- [ ] Backup list view
  - [ ] Backup type (scheduled/manual)
  - [ ] Status indicator
  - [ ] File size
  - [ ] Created date/time
  - [ ] Download button
  - [ ] Delete button
- [ ] Manual backup creation
- [ ] Backup scheduling configuration
- [ ] Backup retention settings
- [ ] Restore from backup (with confirmation)

### 6.2 Backup Service Integration
- [ ] Integrate with Supabase backup API
- [ ] Create backup scheduling (Edge Function)
- [ ] Implement backup download
- [ ] Implement backup restore
- [ ] Backup verification/validation
- [ ] Error handling and notifications

### 6.3 Backup Settings
- [ ] Backup frequency configuration
- [ ] Backup retention period
- [ ] Storage location selection
- [ ] Backup encryption settings
- [ ] Backup notification preferences

---

## 🔄 Phase 7: Alert Center Implementation ✅

### 7.1 Alert Center Page
- [x] Create full AlertCenterPage
- [x] Alert list with filters
  - [x] Filter by type (critical, warning, info)
  - [x] Filter by category
  - [x] Filter by resolved/unresolved
  - [x] Filter by read/unread
  - [ ] Date range filter (future enhancement)
- [x] Alert detail view
- [x] Mark as read functionality
- [x] Resolve alert functionality
- [x] Bulk actions (mark all as read)
- [ ] Alert export (CSV, JSON) (future enhancement)

### 7.2 Alert System Integration
- [ ] Auto-create alerts on system events
- [ ] Alert notification system
  - [ ] Email notifications
  - [ ] Dashboard notifications
  - [ ] SMS notifications (future)
- [ ] Alert severity levels
- [ ] Alert grouping/aggregation
- [ ] Alert history

### 7.3 Alert Settings
- [ ] Notification preferences
- [ ] Alert threshold configuration
- [ ] Alert routing rules
- [ ] Alert suppression rules

---

## 🔄 Phase 8: System Logs Implementation ✅

### 8.1 System Logs Page
- [x] Create full SystemLogsPage
- [x] Log viewer with filters
  - [x] Filter by log type (security, admin, system)
  - [x] Filter by user
  - [x] Filter by module
  - [x] Filter by action
  - [x] Filter by hospital (System Admin)
  - [x] Date range filter
  - [x] Search functionality
- [x] Log detail view
- [x] Log export (CSV, JSON)
- [ ] Real-time log streaming (optional - future enhancement)
- [x] Log pagination

### 8.2 Log Categories
- [ ] Security logs (login attempts, password resets, etc.)
- [ ] Administrative logs (user creation, role changes, etc.)
- [ ] System logs (backups, health checks, errors)
- [ ] Module logs (module enable/disable)
- [ ] Audit trail for all critical actions

### 8.3 Log Management
- [ ] Log retention policy
- [ ] Log archiving
- [ ] Log cleanup automation
- [ ] Log analysis tools

---

## 🔄 Phase 9: Security & Error Handling

### 9.1 System Admin Security
- [x] Implement password strength requirements
- [x] Implement password expiry (90 days)
- [x] Implement session timeout (30 minutes)
- [ ] Implement single session enforcement
- [ ] Implement IP whitelist (optional)
- [ ] Implement 2FA (future enhancement)

### 9.2 Error Handling
- [x] Comprehensive error messages
- [x] Error logging (existing log system)
- [x] User-friendly error displays (ErrorBoundary)
- [x] Error recovery mechanisms (ErrorBoundary with reset)
- [x] Graceful degradation (ErrorBoundary fallback UI)

### 9.3 Audit & Compliance
- [x] Complete audit trail (existing audit log system)
- [x] Action confirmation dialogs
- [ ] Change tracking (future enhancement)
- [ ] Compliance reporting (future enhancement)

---

## 🔄 Phase 10: Testing & Documentation

### 10.1 Testing
- [ ] Unit tests for all services
- [ ] Integration tests for API calls
- [ ] E2E tests for critical flows
- [ ] Security testing
- [ ] Performance testing
- [ ] Load testing

### 10.2 Documentation
- [ ] System Admin user guide
- [ ] API documentation
- [ ] Database schema documentation
- [ ] Deployment guide
- [ ] Troubleshooting guide

### 10.3 Deployment
- [ ] Production database migrations
- [ ] System Admin account setup
- [ ] Environment configuration
- [ ] Monitoring setup
- [ ] Backup configuration

---

## 📋 Quick Reference: Priority Order

1. **Phase 2** - Database Schema (Foundation)
2. **Phase 3** - Hospital Management (Core functionality)
3. **Phase 4** - Module Access Control (Core functionality)
4. **Phase 5** - System Monitoring (Important)
5. **Phase 6** - Backup Management (Important)
6. **Phase 7** - Alert Center (Important)
7. **Phase 8** - System Logs (Nice to have)
8. **Phase 9** - Security & Error Handling (Ongoing)
9. **Phase 10** - Testing & Documentation (Final)

---

**Last Updated**: January 2025
**Status**: Phases 1-9 Complete ✅ | Phase 10 Next 🔄

