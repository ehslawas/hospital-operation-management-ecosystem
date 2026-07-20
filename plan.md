# Implementation Plan - Cylinder Maintenance Module

This document outlines the architecture, database schema, API service layer, routing configuration, and UI designs required to add a new **Cylinder Maintenance** sub-module to the **Medical Oxygen** module.

This feature behaves like a purchase order (PO) in the MyWarrant module but is specialized for requesting maintenance tasks (valve replacement, painting, hydrostatic testing, general maintenance) on medical oxygen cylinders.

---

## 1. Architectural Overview

The diagram below illustrates how user actions on the sidebar propagate through the application routing layer down to the React components, services, and the Supabase database.

### 1.1 Application Flow Diagram

```
+-----------------------------------+
|            Sidebar.tsx            |
| (Sidebar Link Clicked / triggered)|
+-----------------+-----------------+
                  |
                  v
+-----------------+-----------------+
|            routes.tsx             |
| (Path: /pharmacy/oxygen/maint)   |
+-----------------+-----------------+
                  |
                  v
+-----------------+-----------------+
|     CylinderMaintenancePage       |
|  (Lists, Creates, Details View)   |
+--------+-----------------+--------+
         |                 |
         v                 v
+--------+--------+  +-----+--------+
|  Create Form    |  | Details Modal|
|  & Cylinder     |  | & Status     |
|  Selector       |  | Updates      |
+--------+--------+  +-----+--------+
         |                 |
         +--------+--------+
                  |
                  v
+-----------------+-----------------+
|   cylinderMaintenanceService.ts   |
| (Selects, Inserts, Status updates)|
+-----------------+-----------------+
                  |
                  v
+-----------------+-----------------+
|         Supabase Client           |
| (Triggers RLS & performs queries) |
+-----------------+-----------------+
                  |
                  v
+-----------------+-----------------+
|      PostgreSQL Database          |
|  (New Maintenance SQL Tables)     |
+-----------------------------------+
```

---

## 2. Database Design & Relationships

To represent maintenance orders (similar to purchase orders) and the list of cylinders assigned to each, we will create two new tables in Supabase:

1. `pharmacy_oxygen_cylinder_maintenance`: Parent table representing the maintenance request document/PO.
2. `pharmacy_oxygen_cylinder_maintenance_items`: Child table mapping specific cylinders to specific maintenance types and individual costs.

### 2.1 Entity Relationship Diagram (ERD)

```
+-------------------------------------------+
|    pharmacy_oxygen_cylinder_inventory     |
+-------------------------------------------+
| id (UUID, PK)                             |
| serial_number (VARCHAR)                   |
| status (OxygenCylinderStatus)             |
| hospital_id (UUID, FK)                    |
+---------------------+---------------------+
                      |
                      | 1
                      |
                      | N (REFERENCES cylinder_id)
                      v
+-------------------------------------------+
| pharmacy_oxygen_cylinder_maintenance_items|
+-------------------------------------------+
| id (UUID, PK)                             |
| maintenance_id (UUID, FK) ----------------+
| cylinder_id (UUID, FK)                    | |
| maintenance_type (VARCHAR)                | |
| cost (DECIMAL)                            | |
| notes (TEXT)                              | |
+-------------------------------------------+ |
                                              |
                        +---------------------+
                        | N (REFERENCES maintenance_id)
                        v 1
+-------------------------------------------+
|   pharmacy_oxygen_cylinder_maintenance    |
+-------------------------------------------+
| id (UUID, PK)                             |
| maintenance_no (VARCHAR, UNIQUE)          |
| supplier_id (UUID, FK) -----------------------> [suppliers] (existing)
| status (VARCHAR)                          |
| requested_by (UUID, FK) ----------------------> [users] (existing)
| total_cost (DECIMAL)                      |
| budget_source (VARCHAR: APPL / CC / LP)   |
| justification (TEXT)                      |
| created_at (TIMESTAMP)                    |
+-------------------------------------------+
```

---

## 3. User Interface (UI) Mockup

The user interface will be created using **Vercel/Linear design guidelines** and will consist of three tabs:

* **Active Requests**: List of all ongoing cylinder maintenance purchase orders.
* **Create Request**: Form to submit a new cylinder maintenance request.
* **Maintenance History**: List of completed or cancelled orders.

### 3.1 UI Layout Structure

```
+------------------------------------------------------------------------------------------+
|  Medical Oxygen > Cylinder Maintenance                                                   |
+------------------------------------------------------------------------------------------+
|  [Tab: Active Requests]  [Tab: Create Request]  [Tab: Maintenance History]               |
+------------------------------------------------------------------------------------------+
|  +------------------------------------------------------------------------------------+  |
|  | Filters: [Search Maint No / Supplier...]   Status: [ All | Pending | Completed... ]|  |
|  +------------------------------------------------------------------------------------+  |
|  | REQ NO      | SUPPLIER      | STATUS     | REQ DATE   | COST (RM)   | ACTIONS      |  |
|  |-------------|---------------|------------|------------|-------------|--------------|  |
|  | MNT-26-001  | Air Liquide   | Completed  | 10-Jul-26  |    450.00   | [View] [PDF] |  |
|  | MNT-26-002  | Linde Gas     | In Progress| 15-Jul-26  |    780.00   | [View]       |  |
|  | MNT-26-003  | Gas Malaysia  | Draft      | 17-Jul-26  |      0.00   | [Edit]       |  |
|  +------------------------------------------------------------------------------------+  |
|  | Pagination: < 1 2 3 >                                       Showing 1-3 of 3 items |  |
|  +------------------------------------------------------------------------------------+  |
+------------------------------------------------------------------------------------------+
```

### 3.2 Add Maintenance Request Form

```
+------------------------------------------------------------------------------------------+
|  Create Cylinder Maintenance Order                                                       |
+------------------------------------------------------------------------------------------+
|  1. GENERAL DETAILS                                                                      |
|  Supplier: [ Linde Gas Malaysia v ]     Budget Source: [ CC Allocation (Contract) v ]    |
|  Justification: [ Painting and valve replacements for safety audits 2026.              ] |
|                                                                                          |
|  2. SELECTED CYLINDERS FOR MAINTENANCE                                                   |
|  +------------------------------------------------------------------------------------+  |
|  | CYLINDER SERIAL | SIZE / TYPE   | MAINTENANCE TYPE            | ESTIMATED COST (RM) |  |
|  |-----------------|---------------|-----------------------------|---------------------|  |
|  | CYL-OX-90211    | 10L / B       | [ Replacing Valve        v ]| [ 150.00          ] |  |
|  | CYL-OX-88402    | 47L / K       | [ Painting               v ]| [  80.00          ] |  |
|  | CYL-OX-71288    | 10L / B       | [ General Maintenance    v ]| [  50.00          ] |  |
|  +------------------------------------------------------------------------------------+  |
|  | (+ Add Cylinder from Inventory)                                                      |  |
|  +------------------------------------------------------------------------------------+  |
|  |                                                 TOTAL COST ESTIMATED: RM 280.00       |  |
|  +------------------------------------------------------------------------------------+  |
|  [ Save as Draft ]                                                [ Submit for Approval ]|
+------------------------------------------------------------------------------------------+
```

---

## 4. Proposed Code Changes

### 4.1 Database Migration
#### [NEW] [058_create_cylinder_maintenance_tables.sql](file:///c:/Users/60113/Downloads/My%20Home/hospital-operation-management-ecosystem/supabase/migrations/058_create_cylinder_maintenance_tables.sql)
Creates SQL schemas, RLS policies, triggers for updating timestamps, and indexes.

### 4.2 Sidebar Menu Link
#### [MODIFY] [Sidebar.tsx](file:///c:/Users/60113/Downloads/My%20Home/hospital-operation-management-ecosystem/src/shared/components/layout/Sidebar.tsx)
- Import `Wrench` icon from `lucide-react`.
- Add `Cylinder Maintenance` nav item under the `Medical Oxygen` children array.

### 4.3 Route Definitions & Router Setup
#### [MODIFY] [routes.ts](file:///c:/Users/60113/Downloads/My%20Home/hospital-operation-management-ecosystem/src/shared/constants/routes.ts)
- Add constant: `PHARMACY_OXYGEN_MAINTENANCE: '/pharmacy/oxygen/maintenance'`.

#### [MODIFY] [routes.tsx](file:///c:/Users/60113/Downloads/My%20Home/hospital-operation-management-ecosystem/src/routes/routes.tsx)
- Lazy import the new `CylinderMaintenancePage`.
- Define path `'pharmacy/oxygen/maintenance'` and wrap with `ProtectedRoute` for pharmacy roles.

### 4.4 Types & Interfaces
#### [MODIFY] [index.ts (types/pharmacy)](file:///c:/Users/60113/Downloads/My%20Home/hospital-operation-management-ecosystem/src/types/pharmacy/index.ts)
- Define TypeScript types for maintenance: `CylinderMaintenance`, `CylinderMaintenanceItem`, `CylinderMaintenanceWithRelations`.

### 4.5 Data & API Service Layer
#### [NEW] [cylinderMaintenanceService.ts](file:///c:/Users/60113/Downloads/My%20Home/hospital-operation-management-ecosystem/src/modules/mycylinder/services/cylinderMaintenanceService.ts)
Service functions for CRUD operations:
- `getCylinderMaintenanceRequests(hospitalId)`
- `getCylinderMaintenanceDetails(id)`
- `createCylinderMaintenanceRequest(data)`
- `updateCylinderMaintenanceRequest(id, data)`
- `updateCylinderMaintenanceStatus(id, status)`

### 4.6 Page View Component
#### [NEW] [CylinderMaintenancePage.tsx](file:///c:/Users/60113/Downloads/My%20Home/hospital-operation-management-ecosystem/src/modules/mycylinder/pages/oxygen/CylinderMaintenancePage.tsx)
Renders tabs for listing, creating, and viewing cylinder maintenance requests. It links to cylinder inventory to allow picking specific cylinders and updating their statuses.

---

## 5. Verification Plan

### Automated Verification
- Run TypeScript syntax checking:
  `npm run build`
- Run local unit tests (if any) to ensure routing and component rendering are functional.

### Manual Verification
- Log in as an **Assistant Pharmacist** or other valid pharmacy role.
- Verify that **Cylinder Maintenance** is listed under the **Medical Oxygen** navigation section in the sidebar.
- Click it, verify redirection to `/pharmacy/oxygen/maintenance`.
- Create a test maintenance draft, select cylinders, verify total cost matches the individual item cost sums.
- Change status to verify cylinders status updates to `'maintenance'` inside `Cylinder Inventory`.
