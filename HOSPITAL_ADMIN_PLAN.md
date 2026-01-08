# Hospital Admin Module - Detailed Implementation Plan

## Overview

This document outlines the comprehensive implementation plan for the Hospital Admin module. The Hospital Admin is a critical role that manages a specific hospital's operations within the HOME (Hospital Operation Management Ecosystem) system.

**Key Distinction from System Admin:**
- **System Admin**: Has full access across ALL hospitals in the system
- **Hospital Admin**: Has full access to ONLY their assigned hospital

---

## 🎯 Hospital Admin Main Roles

### 1. Approve/Deny Request for Access the System
### 2. Approve/Deny Memo Post on the System
### 3. Monitor Hospital System Log
### 4. Monitor Hospital System Health
### 5. Monitor Hospital System Report
### 6. Monitor Hospital System Backup
### 7. Monitor Hospital System User
### 8. Monitor Hospital System Module
### 9. Approve/Deny Request to View Sensitive Patient Data
### 10. Monitor Hospital System Patient Database

---

## 📋 Detailed Implementation Plan

### Module 1: Access Request Management (Approve/Deny System Access)
**Status:** Partially Implemented - Needs Hospital Admin Filtering

**Current State:**
- AccessRequestListPage exists
- AccessRequestDetailPage exists
- Approval workflow exists

**Required Enhancements:**
1. Filter access requests by Hospital Admin's hospital_id
2. Add approval workflow with:
   - Review panel showing applicant details
   - Role assignment dropdown (only hospital-specific roles)
   - Department assignment dropdown
   - Employee ID auto-generation
   - Approval comments field
   - Rejection reason field (mandatory on reject)
3. Email notification on approval/rejection (mock for now)
4. Auto-create user account on approval
5. Dashboard widget showing pending requests count

**Database/Types Needed:**
- ✅ AccessRequest type exists
- ✅ AccessRequestWithRelations exists

**Files to Create/Modify:**
- Modify: `AccessRequestListPage.tsx` - Add hospital filtering
- Modify: `AccessRequestDetailPage.tsx` - Enhance approval workflow
- Modify: `accessRequestManagementService.ts` - Add hospital filtering

---

### Module 2: Memo Approval System (NEW)
**Status:** New Feature

**Description:**
Hospital Admin can approve/deny memo posts that will be displayed on the hospital's bulletin/announcement system.

**Components Needed:**

1. **Memo Types:**
   - `announcement` - General announcements
   - `policy` - Policy updates
   - `event` - Event notifications
   - `emergency` - Emergency alerts (auto-approved)
   - `maintenance` - System maintenance notices

2. **Memo Workflow:**
   - Staff creates memo → Status: `draft`
   - Submit for approval → Status: `pending_approval`
   - Hospital Admin reviews → Status: `approved` / `rejected`
   - Scheduled publish → Status: `published`
   - Archive after expiry → Status: `archived`

3. **Memo Data Structure:**
```typescript
interface Memo {
  id: string
  hospital_id: string
  title: string
  content: string
  memo_type: MemoType
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: MemoStatus
  created_by: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  publish_date?: string
  expiry_date?: string
  target_departments?: string[] // Empty = all departments
  attachments?: string[]
  created_at: string
  updated_at?: string
}
```

**Pages to Create:**
- `src/pages/admin/memos/MemoListPage.tsx` - List all memos with filtering
- `src/pages/admin/memos/MemoDetailPage.tsx` - View/Edit/Approve memo
- `src/pages/admin/memos/MemoCreatePage.tsx` - Create new memo

**Services to Create:**
- `src/services/memoService.ts` - CRUD operations for memos

**UI Features:**
- Rich text editor for memo content
- Department targeting (multiselect)
- Schedule publishing
- Attachment upload
- Preview before publish

---

### Module 3: Hospital System Log Monitoring
**Status:** Placeholder Exists - Needs Full Implementation

**Description:**
Monitor all activities within the hospital - user logins, actions, changes, etc.

**Log Categories:**
1. **Authentication Logs**
   - Login success/failure
   - Password changes
   - Session timeouts
   - Account lockouts

2. **User Activity Logs**
   - Page views
   - Data access
   - Form submissions
   - File downloads

3. **Administrative Logs**
   - User management actions
   - Permission changes
   - Settings modifications
   - Department changes

4. **Security Logs**
   - Unauthorized access attempts
   - Suspicious activities
   - IP anomalies
   - Failed authentication

**UI Features:**
- Real-time log viewer
- Advanced filtering (user, action, date range, severity)
- Search functionality
- Export to CSV/Excel
- Log retention display
- Severity color coding

**Files to Create/Modify:**
- Implement: `src/pages/admin/systemLogs/SystemLogsPage.tsx`
- Create: `src/services/hospitalLogService.ts`

**Mock Data:**
- Generate realistic log entries for demo

---

### Module 4: Hospital System Health Monitoring
**Status:** Placeholder Exists - Needs Full Implementation

**Description:**
Real-time monitoring of hospital system components health.

**Health Metrics:**
1. **System Resources (Hospital-Specific)**
   - Active user sessions
   - Database connections used
   - Storage usage
   - API response times

2. **Service Status**
   - Authentication service
   - Database connectivity
   - File storage
   - Email service
   - External integrations

3. **Performance Metrics**
   - Average page load time
   - API latency
   - Error rate
   - Uptime percentage

**UI Components:**
- Health status cards (green/yellow/red indicators)
- Real-time charts (using recharts)
- Service status list
- Alert history
- Performance trends

**Files to Create/Modify:**
- Implement: `src/pages/admin/monitoring/SystemMonitoringPage.tsx`
- Create: `src/services/hospitalHealthService.ts`

---

### Module 5: Hospital System Reports
**Status:** New Feature

**Description:**
Generate and view various reports for hospital operations.

**Report Types:**

1. **User Reports**
   - Active users summary
   - New registrations
   - User activity summary
   - Department-wise user distribution

2. **Access Reports**
   - Access request statistics
   - Approval/rejection rates
   - Average processing time

3. **System Usage Reports**
   - Module usage statistics
   - Peak usage times
   - Feature adoption rates

4. **Security Reports**
   - Failed login attempts
   - Account lockouts
   - Security incidents

5. **Audit Reports**
   - Change history
   - Administrative actions
   - Compliance reports

**UI Features:**
- Report dashboard with quick stats
- Date range selection
- Export to PDF/Excel
- Scheduled reports (future)
- Visual charts and graphs

**Pages to Create:**
- `src/pages/admin/reports/ReportsDashboardPage.tsx`
- `src/pages/admin/reports/UserReportPage.tsx`
- `src/pages/admin/reports/AccessReportPage.tsx`
- `src/pages/admin/reports/SystemUsageReportPage.tsx`
- `src/pages/admin/reports/SecurityReportPage.tsx`
- `src/pages/admin/reports/AuditReportPage.tsx`

**Services to Create:**
- `src/services/hospitalReportService.ts`

---

### Module 6: Hospital System Backup Monitoring
**Status:** Placeholder Exists - Needs Full Implementation

**Description:**
Monitor backup status and history for the hospital's data.

**Note:** Hospital Admin can only VIEW backup status. System Admin manages actual backups.

**Features:**
1. **Backup Status Dashboard**
   - Last backup time
   - Backup size
   - Backup status (success/failed)
   - Next scheduled backup

2. **Backup History**
   - List of past backups
   - Status of each backup
   - Duration
   - Restore point availability

3. **Alerts**
   - Failed backup notifications
   - Storage warnings
   - Schedule changes

**UI Components:**
- Backup status card
- Backup history table
- Storage usage gauge
- Alert notifications

**Files to Create/Modify:**
- Implement: `src/pages/admin/backups/BackupManagementPage.tsx`
- Create: `src/services/hospitalBackupService.ts`

---

### Module 7: Hospital System User Monitoring
**Status:** Partially Implemented - Needs Enhancement

**Description:**
Comprehensive user management and monitoring for the hospital.

**Current State:**
- UserListPage exists with basic functionality
- UserDetailPage exists

**Required Enhancements:**

1. **User Overview Dashboard**
   - Total users by status (active/inactive/suspended)
   - Users by department
   - Users by role
   - Recent user activities

2. **User Session Monitoring**
   - Currently active sessions
   - Session duration
   - Force logout capability
   - Idle session detection

3. **User Activity Tracking**
   - Last login
   - Login frequency
   - Actions performed
   - Pages accessed

4. **Bulk Operations**
   - Bulk activate/deactivate
   - Bulk role assignment
   - Bulk department transfer
   - Export user list

**Files to Create/Modify:**
- Enhance: `src/pages/admin/users/UserListPage.tsx`
- Create: `src/pages/admin/users/UserSessionsPage.tsx`
- Create: `src/pages/admin/users/UserActivityPage.tsx`
- Enhance: `src/services/userService.ts`

---

### Module 8: Hospital System Module Monitoring
**Status:** System Admin Only - Need Hospital Admin View

**Description:**
View enabled modules and their status for the hospital.

**Note:** Hospital Admin can VIEW modules. Only System Admin can enable/disable.

**Features:**
1. **Module Overview**
   - List of all available modules
   - Enabled/disabled status
   - Module usage statistics
   - Module health status

2. **Module Details**
   - Module description
   - Features included
   - User access count
   - Last activity

3. **Request Module Access**
   - Hospital Admin can request new modules
   - Request goes to System Admin for approval

**Pages to Create:**
- `src/pages/admin/modules/HospitalModuleViewPage.tsx`
- Modify: `src/pages/admin/modules/ModuleAccessControlPage.tsx`

---

### Module 9: Sensitive Patient Data Access Request (NEW)
**Status:** New Feature

**Description:**
Approve/deny requests from staff to view sensitive patient data.

**Sensitive Data Categories:**
1. **Personal Health Information (PHI)**
   - Medical history
   - Diagnosis records
   - Treatment plans
   - Lab results

2. **Financial Information**
   - Billing records
   - Insurance details
   - Payment history

3. **Contact Information**
   - Emergency contacts
   - Next of kin
   - Address details

**Request Workflow:**
1. Staff member requests access with justification
2. Request logged with timestamp
3. Hospital Admin receives notification
4. Hospital Admin reviews request
5. Approve/Deny with comments
6. Access granted for specific duration (1 hour, 1 day, etc.)
7. Access automatically revoked after duration
8. All access logged for audit

**Data Structure:**
```typescript
interface SensitiveDataRequest {
  id: string
  hospital_id: string
  requestor_id: string
  patient_id: string
  data_category: 'phi' | 'financial' | 'contact' | 'all'
  justification: string
  urgency: 'routine' | 'urgent' | 'emergency'
  status: 'pending' | 'approved' | 'denied' | 'expired'
  access_duration_hours: number
  approved_by?: string
  approved_at?: string
  denial_reason?: string
  access_expires_at?: string
  created_at: string
  updated_at?: string
}
```

**Pages to Create:**
- `src/pages/admin/sensitiveData/SensitiveDataRequestListPage.tsx`
- `src/pages/admin/sensitiveData/SensitiveDataRequestDetailPage.tsx`

**Services to Create:**
- `src/services/sensitiveDataRequestService.ts`

---

### Module 10: Hospital Patient Database Monitoring
**Status:** New Feature

**Description:**
Monitor patient database status, statistics, and data integrity.

**Note:** This is READ-ONLY monitoring. Hospital Admin cannot modify patient data.

**Features:**

1. **Patient Statistics Dashboard**
   - Total patients registered
   - Active patients
   - New registrations (daily/weekly/monthly)
   - Patient demographics

2. **Database Health**
   - Record count
   - Data integrity status
   - Last verification date
   - Storage usage

3. **Data Quality Metrics**
   - Complete vs incomplete records
   - Duplicate detection alerts
   - Data validation issues

4. **Access Monitoring**
   - Who accessed patient records
   - When was data accessed
   - What data was viewed
   - Export of access logs

**Pages to Create:**
- `src/pages/admin/patientDatabase/PatientDatabaseDashboardPage.tsx`
- `src/pages/admin/patientDatabase/PatientAccessLogsPage.tsx`

**Services to Create:**
- `src/services/patientDatabaseMonitorService.ts`

---

## 🗂️ File Structure

```
src/
├── pages/
│   └── admin/
│       ├── accessRequests/          # Module 1 (Enhance)
│       │   ├── AccessRequestListPage.tsx
│       │   └── AccessRequestDetailPage.tsx
│       ├── memos/                    # Module 2 (NEW)
│       │   ├── MemoListPage.tsx
│       │   ├── MemoDetailPage.tsx
│       │   ├── MemoCreatePage.tsx
│       │   └── index.ts
│       ├── systemLogs/               # Module 3 (Implement)
│       │   ├── SystemLogsPage.tsx
│       │   └── index.ts
│       ├── monitoring/               # Module 4 (Implement)
│       │   ├── SystemMonitoringPage.tsx
│       │   └── index.ts
│       ├── reports/                  # Module 5 (NEW)
│       │   ├── ReportsDashboardPage.tsx
│       │   ├── UserReportPage.tsx
│       │   ├── AccessReportPage.tsx
│       │   └── index.ts
│       ├── backups/                  # Module 6 (Implement)
│       │   ├── BackupManagementPage.tsx
│       │   └── index.ts
│       ├── users/                    # Module 7 (Enhance)
│       │   ├── UserListPage.tsx
│       │   ├── UserDetailPage.tsx
│       │   ├── UserSessionsPage.tsx
│       │   └── UserActivityPage.tsx
│       ├── modules/                  # Module 8 (Add View)
│       │   ├── ModuleAccessControlPage.tsx
│       │   ├── HospitalModuleViewPage.tsx
│       │   └── index.ts
│       ├── sensitiveData/            # Module 9 (NEW)
│       │   ├── SensitiveDataRequestListPage.tsx
│       │   ├── SensitiveDataRequestDetailPage.tsx
│       │   └── index.ts
│       └── patientDatabase/          # Module 10 (NEW)
│           ├── PatientDatabaseDashboardPage.tsx
│           ├── PatientAccessLogsPage.tsx
│           └── index.ts
├── services/
│   ├── memoService.ts                # NEW
│   ├── hospitalLogService.ts         # NEW
│   ├── hospitalHealthService.ts      # NEW
│   ├── hospitalReportService.ts      # NEW
│   ├── hospitalBackupService.ts      # NEW
│   ├── sensitiveDataRequestService.ts # NEW
│   └── patientDatabaseMonitorService.ts # NEW
└── types/
    └── index.ts                      # Add new types
```

---

## 🔐 Route Configuration

### New Routes to Add:

```typescript
// Hospital Admin Routes
ADMIN_MEMOS: '/admin/memos',
ADMIN_MEMO_CREATE: '/admin/memos/create',
ADMIN_REPORTS: '/admin/reports',
ADMIN_REPORTS_USERS: '/admin/reports/users',
ADMIN_REPORTS_ACCESS: '/admin/reports/access',
ADMIN_REPORTS_USAGE: '/admin/reports/usage',
ADMIN_REPORTS_SECURITY: '/admin/reports/security',
ADMIN_USER_SESSIONS: '/admin/users/sessions',
ADMIN_USER_ACTIVITY: '/admin/users/activity',
ADMIN_HOSPITAL_MODULES: '/admin/hospital-modules',
ADMIN_SENSITIVE_DATA_REQUESTS: '/admin/sensitive-data-requests',
ADMIN_PATIENT_DATABASE: '/admin/patient-database',
ADMIN_PATIENT_ACCESS_LOGS: '/admin/patient-database/access-logs',
```

---

## 🧭 Navigation Updates

### Hospital Admin Sidebar Menu:

```
📊 Dashboard
├── Overview

🔐 Administration
├── 👥 Users
│   ├── User List
│   ├── Active Sessions
│   └── User Activity
├── 📝 Access Requests
├── 📢 Memo Approval
├── 🔒 Sensitive Data Requests
└── 🏥 Departments

📊 Monitoring
├── 📈 System Health
├── 📋 System Logs
├── 💾 Backup Status
├── 🗄️ Patient Database
└── 📦 Modules

📄 Reports
├── Dashboard
├── User Reports
├── Access Reports
├── Usage Reports
└── Security Reports

⚙️ Settings
└── Hospital Settings
```

---

## 📅 Implementation Priority

### Phase 1: Core Functions (Critical)
1. ✅ Access Request Enhancement (Module 1)
2. ⬜ Sensitive Data Requests (Module 9) - NEW Critical Security Feature
3. ⬜ System Logs (Module 3)
4. ⬜ User Monitoring Enhancement (Module 7)

### Phase 2: Monitoring Functions
5. ⬜ System Health Monitoring (Module 4)
6. ⬜ Backup Monitoring (Module 6)
7. ⬜ Patient Database Monitoring (Module 10)
8. ⬜ Module Monitoring (Module 8)

### Phase 3: Communication & Reporting
9. ⬜ Memo Approval System (Module 2)
10. ⬜ Reports Dashboard (Module 5)

---

## 🎨 UI/UX Guidelines

### Color Scheme for Hospital Admin:
- Primary: Teal (#0D9488) - Same as system
- Accent: Amber (#F59E0B) for pending items
- Success: Green (#10B981) for approvals
- Error: Red (#EF4444) for rejections
- Info: Blue (#3B82F6) for information

### Status Badge Colors:
- `pending` → Warning (Amber)
- `approved` → Success (Green)
- `rejected` → Error (Red)
- `expired` → Gray
- `active` → Primary (Teal)
- `inactive` → Gray

### Dashboard Layout:
- Use card-based design
- Real-time counters for pending items
- Quick action buttons
- Recent activity feed

---

## 🔄 Data Flow

### Hospital Admin Data Scope:
```
Hospital Admin (hospital_id: "HKL001")
│
├── Can Access:
│   ├── Users where hospital_id = "HKL001"
│   ├── Departments where hospital_id = "HKL001"
│   ├── Access Requests where hospital_id = "HKL001"
│   ├── Memos where hospital_id = "HKL001"
│   ├── Logs where hospital_id = "HKL001"
│   └── Patient Data where hospital_id = "HKL001"
│
└── Cannot Access:
    ├── Other hospitals' data
    ├── System-wide settings
    ├── Module enable/disable
    └── System Admin functions
```

---

## ✅ Implementation Checklist

### Types & Interfaces
- [ ] Add Memo types
- [ ] Add SensitiveDataRequest types
- [ ] Add PatientDatabaseStats types
- [ ] Add HospitalLog types
- [ ] Add HospitalHealthMetrics types
- [ ] Add HospitalReport types

### Services
- [ ] Create memoService.ts
- [ ] Create hospitalLogService.ts
- [ ] Create hospitalHealthService.ts
- [ ] Create hospitalReportService.ts
- [ ] Create hospitalBackupService.ts
- [ ] Create sensitiveDataRequestService.ts
- [ ] Create patientDatabaseMonitorService.ts

### Pages
- [ ] Create Memo pages
- [ ] Implement System Logs page
- [ ] Implement System Monitoring page
- [ ] Create Reports pages
- [ ] Implement Backup monitoring page
- [ ] Create Sensitive Data pages
- [ ] Create Patient Database pages
- [ ] Enhance User pages

### Routes & Navigation
- [ ] Add new routes to constants.ts
- [ ] Update routes.tsx
- [ ] Update Sidebar.tsx

### Dashboard
- [ ] Update HospitalAdminDashboard.tsx with new widgets
- [ ] Add pending counts for all approval items
- [ ] Add quick action buttons

---

**Document Created:** January 5, 2026
**Status:** Ready for Implementation
**Priority:** HIGH - Core foundation for all departments

