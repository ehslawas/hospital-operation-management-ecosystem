# Dashboard Separation - Implementation Guide

## Overview

The HOME system now has **three distinct dashboards** that are completely separated based on user roles. This ensures clear boundaries and prevents confusion between different administrative levels.

---

## 1. System Admin Dashboard

**File**: `src/pages/dashboard/SystemAdminDashboard.tsx`

### Purpose
Manages the **entire system across all hospitals**. This is the highest level of administration.

### Access
- **Role**: `SYSTEM_ADMIN` (System Administrator)
- **Scope**: All hospitals in the system

### Features
- **System-Wide Statistics**
  - Total Hospitals (across all hospitals)
  - Total System Users (all hospitals combined)
  - Active Sessions (system-wide)
  - Pending Access Requests (all hospitals)

- **System-Wide Activity Feed**
  - Activities from all hospitals
  - Shows which hospital each activity belongs to
  - System-level changes and configurations

- **Quick Actions**
  - Manage Hospitals (create, edit, view all hospitals)
  - Manage Users (all users across all hospitals)
  - Roles & Permissions (system-wide)
  - System Settings (global configuration)

### Navigation
- Shows **Administration** menu with:
  - Users (all hospitals)
  - Access Requests (all hospitals)
  - **Hospitals** (only System Admin can see this)
  - Departments (all hospitals)
  - Roles & Permissions
  - Audit Logs
  - Settings

---

## 2. Hospital Admin Dashboard

**File**: `src/pages/dashboard/HospitalAdminDashboard.tsx`

### Purpose
Manages **only their specific hospital**. Cannot see or manage other hospitals.

### Access
- **Role**: `HOSPITAL_ADMIN` (Hospital Administrator)
- **Scope**: Single hospital only

### Features
- **Hospital-Specific Statistics**
  - Hospital Users (only their hospital)
  - Departments (only their hospital)
  - Active Sessions (their hospital only)
  - Pending Requests (their hospital only)

- **Hospital Activity Feed**
  - Activities within their hospital only
  - Shows department for each activity
  - Hospital-specific changes

- **Quick Actions**
  - Manage Users (their hospital only)
  - Manage Departments (their hospital)
  - Permissions (hospital-level)
  - Hospital Settings (their hospital configuration)

### Navigation
- Shows **Administration** menu with:
  - Users (their hospital only)
  - Access Requests (their hospital only)
  - **NO Hospitals menu** (cannot manage hospitals)
  - Departments (their hospital only)
  - Roles & Permissions (hospital-level)
  - Audit Logs (their hospital)
  - Settings (hospital settings)

---

## 3. Pharmacy Logistics Dashboard

**File**: `src/pages/dashboard/PharmacyDashboard.tsx`

### Purpose
Department-specific dashboard for **Pharmacy Logistics** operations. This is a department landing page.

### Access
- **Roles**: 
  - `PHARMACY_MANAGER` (Pharmacy Manager)
  - `PHARMACY_STAFF` (Pharmacy Staff)
- **Scope**: Pharmacy department only

### Features
- **Pharmacy-Specific Statistics**
  - Inventory Items
  - Pending Orders
  - Low Stock Alerts
  - Active Suppliers

- **Pharmacy Activity Feed**
  - Purchase requisitions
  - Goods receipts
  - Stock transfers
  - Inventory alerts

- **Quick Actions**
  - Inventory Management
  - Purchase Requisitions
  - Purchase Orders
  - Suppliers

### Navigation
- Shows **Pharmacy** menu with:
  - Dashboard
  - Inventory
  - Products
  - Suppliers
  - Requisitions
  - Orders
  - Receipts
- **NO Administration menu** (department staff cannot access admin features)

---

## Routing Logic

**File**: `src/pages/dashboard/DashboardPage.tsx`

The main dashboard page acts as a router that automatically redirects users to the correct dashboard based on their role:

```typescript
// System Admin → SystemAdminDashboard
if (roleCode === SYSTEM_ROLES.SYSTEM_ADMIN) {
  return <SystemAdminDashboard />
}

// Hospital Admin → HospitalAdminDashboard
if (roleCode === SYSTEM_ROLES.HOSPITAL_ADMIN) {
  return <HospitalAdminDashboard />
}

// Pharmacy roles → PharmacyDashboard
if (roleCode === SYSTEM_ROLES.PHARMACY_MANAGER || roleCode === SYSTEM_ROLES.PHARMACY_STAFF) {
  return <PharmacyDashboard />
}
```

---

## Sidebar Navigation Filtering

**File**: `src/components/layout/Sidebar.tsx`

The sidebar automatically filters navigation items based on user role:

- **System Admin**: Sees Administration (with Hospitals) + Pharmacy (if needed)
- **Hospital Admin**: Sees Administration (without Hospitals) + Pharmacy (if needed)
- **Pharmacy Staff**: Sees only Pharmacy menu

### Role-Based Menu Items

Each navigation item can specify which roles can access it:

```typescript
{
  label: 'Administration',
  roles: [SYSTEM_ROLES.SYSTEM_ADMIN, SYSTEM_ROLES.HOSPITAL_ADMIN],
  children: [
    { label: 'Hospitals', roles: [SYSTEM_ROLES.SYSTEM_ADMIN] }, // Only System Admin
    { label: 'Departments' }, // Both admins
  ]
}
```

---

## Key Differences Summary

| Feature | System Admin | Hospital Admin | Pharmacy |
|---------|-------------|----------------|----------|
| **Scope** | All Hospitals | One Hospital | One Department |
| **Can Manage Hospitals** | ✅ Yes | ❌ No | ❌ No |
| **Can Manage Users** | ✅ All Hospitals | ✅ Their Hospital | ❌ No |
| **Can Manage Departments** | ✅ All Hospitals | ✅ Their Hospital | ❌ No |
| **Can Access Pharmacy** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Dashboard Focus** | System-wide | Hospital-wide | Department-specific |

---

## Testing with Demo Credentials

### System Admin
- **Employee ID**: `SYS001`
- **Password**: `Password123`
- **Sees**: System Admin Dashboard with all hospitals

### Hospital Admin
- **Employee ID**: `HKL001`
- **Password**: `Password123`
- **Sees**: Hospital Admin Dashboard for Hospital Kuala Lumpur only

### Pharmacy Manager
- **Employee ID**: `HKL-PHR-001`
- **Password**: `Password123`
- **Sees**: Pharmacy Dashboard for Pharmacy department

---

## Future Department Dashboards

When adding more departments (e.g., Nursing, Radiology), follow the same pattern:

1. Create `NursingDashboard.tsx` (or `RadiologyDashboard.tsx`)
2. Add role check in `DashboardPage.tsx`
3. Add navigation items in `Sidebar.tsx` with appropriate roles
4. Each department gets its own landing page

Example:
```typescript
// In DashboardPage.tsx
if (roleCode === SYSTEM_ROLES.NURSING_MANAGER || roleCode === SYSTEM_ROLES.NURSE) {
  return <NursingDashboard />
}
```

---

## Benefits of This Separation

1. **Clear Boundaries**: No confusion about what each admin can manage
2. **Security**: Users only see what they're authorized to access
3. **Scalability**: Easy to add new departments without affecting others
4. **User Experience**: Each role sees a dashboard tailored to their needs
5. **Maintainability**: Each dashboard is a separate component, easy to modify

---

**Last Updated**: January 2024

