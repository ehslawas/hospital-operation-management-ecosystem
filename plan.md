# Modern Enterprise Level Cylinder Movement Tracking Implementation Plan

This document outlines the detailed architectural and visual design implementation plan to upgrade the **Medical Oxygen & Gas Cylinder Movement Tracking Interface** (**Available**, **In Use / Used**, **Empty**, **Returned**).

---

## Executive Summary & Design Vision

As a Senior Google Design Lead, this upgrade transforms the current store balance cards and cylinder inventory tracking system into an enterprise-grade telemetry workspace. The design combines **Google Material 3 Expressive**, **Linear Method**, and **Stripe Dashboard** aesthetics to deliver high-density data clarity, fluid micro-interactions, and instant visual state recognition for hospital pharmacy storekeepers and logistics managers.

---

## Core Movement State Taxonomy

Every medical gas cylinder transitions through a strict four-stage movement lifecycle:

| Movement State | Color Token | Visual Element | Operational Context |
| :--- | :--- | :--- | :--- |
| **🟢 Available** | `Emerald-500` / `#10b981` | Heartbeat pulse badge + soft glow | Full pressure cylinders in Central Pharmacy Store, ready for immediate ward dispatch. |
| **🔵 In Use (Used)** | `Blue-600` / `#2563eb` | Cobalt active telemetry ring | Cylinders deployed in Wards, Emergency Department, or ICU connected to patient care. |
| **🟡 Empty** | `Amber-500` / `#f59e0b` | Warning alert dot | Depleted cylinders collected in the store empty-holding zone awaiting supplier return. |
| **🟣 Returned** | `Indigo-500` / `#6366f1` | Slate indigo quiet badge | Cylinders transferred back to gas supplier (Linde Malaysia) for refill & PO reconciliation. |

---

## Outsource Benchmarking & UX Innovations

Following research across industrial telemetry dashboards (AWS IoT SiteWise, Samsara Asset Telemetry, Linde Gas Logistics):

1. **Card Architecture (`StoreBalanceGrid.tsx`)**:
   - Elevated glassmorphic card container (`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl`).
   - Accent Top Header gradient bar based on cylinder contract type (Private vs Loan).
   - Type title (e.g. `P101 - D (0.5m³)`), valve connection type tag (`Pin Index (PI)` vs `Bullnose (BN)`), and ownership badge.
   - **4-Quadrant Metric Matrix**: High-contrast, tabular-numeric counters (`tabular-nums`) for Available, In Use, Empty, and Returned.
   - **Dynamic Stock Distribution Progress Bar**: Multi-segment horizontal bar displaying exact percentages, total counts, and interactive hover tooltips.
   - **Quick Action Hover Toolbar**: 
     - ⚡ *Quick Issue to Ward*
     - ⚡ *Mark as Depleted (Empty)*
     - ⚡ *Generate Supplier Return*

2. **Filter & Telemetry Toolbar**:
   - Interactive search input by cylinder code/name.
   - Pill filter controls: All Types, Pin Index (PI), Bullnose (BN), Loan Cylinders, Low Stock Warnings.
   - View Switcher: Store Grid View (Cards), Linear Inventory Table, and Real-time Store Ledger.

---

## Technical Architecture & Flow

```
+-----------------------------------------------------------------------------------+
|                            CYLINDER RECEPTION (Linde / PO)                         |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
                              +-----------------------+
                              |     🟢 AVAILABLE      |
                              |   (Central Store)     |
                              +-----------+-----------+
                                          |
                     +--------------------+--------------------+
                     | Quick Dispatch / Issue                   | Scan Ward Issue
                     v                                         v
         +-----------------------+                 +-----------------------+
         |      🔵 IN USE        |                 |      🔵 IN USE        |
         |  (Emergency Dept)     |                 |   (ICU / Wards)       |
         +-----------+-----------+                 +-----------+-----------+
                     |                                         |
                     +--------------------+--------------------+
                                          | Depleted / Empty
                                          v
                              +-----------------------+
                              |       🟡 EMPTY        |
                              |   (Collection Area)   |
                              +-----------+-----------+
                                          |
                                          | Supplier Return Doc
                                          v
                              +-----------------------+
                              |      🟣 RETURNED      |
                              | (Gas Supplier / Linde)|
                              +-----------------------+
```

---

## Proposed File Changes

### 1. Store Balance Grid Component

#### [MODIFY] [StoreBalanceGrid.tsx](file:///c:/Users/60113/Downloads/My%20Home/hospital-operation-management-ecosystem/src/components/oxygen/StoreBalanceGrid.tsx)
- Upgrade card grid to include filtering, 4-quadrant state counts with high-contrast semantic styling, multi-segment progress distribution visualizer, and quick action shortcuts.

### 2. Cylinder KPI Cards Header

#### [MODIFY] [CylinderKpiCards.tsx](file:///c:/Users/60113/Downloads/My%20Home/hospital-operation-management-ecosystem/src/components/oxygen/CylinderKpiCards.tsx)
- Redesign metric summary panel with Google Material 3 typography, tabular numbers, and movement velocity metrics.

### 3. Oxygen Dashboard Page Integration

#### [MODIFY] [OxygenDashboardPage.tsx](file:///c:/Users/60113/Downloads/My%20Home/hospital-operation-management-ecosystem/src/modules/mycylinder/pages/oxygen/OxygenDashboardPage.tsx)
- Wire search, filter pill states, and modal action handlers to `StoreBalanceGrid`.

---

## Verification Plan

### Automated Build Verification
```bash
npx tsc --noEmit
npm run build
```

### Manual Verification
1. Access `/pharmacy/oxygen/cylinders` -> Click **Overview Store Grid**.
2. Verify card visual hierarchy, 4 movement state quadrants (Available, In Use, Empty, Returned), progress bar distribution, and search filter responsiveness.
3. Test quick action modal triggers.
