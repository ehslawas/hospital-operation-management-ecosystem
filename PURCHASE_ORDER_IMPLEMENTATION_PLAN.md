# Purchase Order System Implementation Plan

## Overview
This document outlines the detailed implementation plan for the Purchase Order (PO) system within the Procurement module. The system will allow users to create purchase orders for drugs and non-drug items with comprehensive tracking, KPI dashboards, and print functionality.

## Requirements

### Form Fields
1. **Vote Code** - Dropdown selection (080702, 990102)
2. **Vote Activity** - Dropdown selection (27401, 27499, 27404, 27403, 27402, 27501)
3. **Category** - Dropdown selection (drug, non_drug, non_standard, reagent, vaccine, insulin, hepc, medical_oxygen)
4. **Department** - Dropdown selection (pharmacy, nephrology, radiology_radiography, emergency_trauma, cssu_cssd, operation_theater, laboratory_pathology, general_ward, wound_care, rehabilitation, anaesthesiology)
5. **Items to Purchase** - Dynamic list (max 5 items per PO)
   - Item selection (drug/non-drug)
   - Quantity
   - Price
   - Packaging Description
6. **Balance After Purchase** - Calculated field showing remaining budget
7. **Print Feature** - Generate printable PO document

### Table Display
- Show all purchase orders with status
- Display vote code, vote activity, category, department
- Filter and search capabilities
- Status tracking (draft, pending_approval, approved, sent, partial_received, completed, cancelled)

### KPI Dashboard
- Total Purchase Orders (count)
- Total Purchase Value (sum)
- Orders by Status (breakdown)
- Orders by Category (breakdown)
- Orders by Department (breakdown)
- Monthly Purchase Trend
- Top Suppliers by Value
- Budget Utilization

## Database Schema Changes

### Update `pharmacy_purchase_orders` table
Add new columns:
- `vote_code` VARCHAR(10) - Vote code (080702, 990102)
- `vote_activity` VARCHAR(10) - Vote activity code (27401, 27499, 27404, 27403, 27402, 27501)
- `category` VARCHAR(50) - Category (drug, non_drug, non_standard, reagent, vaccine, insulin, hepc, medical_oxygen)
- `department` VARCHAR(50) - Department code

### Update `pharmacy_purchase_order_items` table
Add new column:
- `packaging_description` TEXT - Packaging description for each item

## Implementation Steps

### Phase 1: Database Schema Updates
1. Create migration to add new columns to `pharmacy_purchase_orders`
2. Create migration to add `packaging_description` to `pharmacy_purchase_order_items`
3. Apply migrations via MCP Supabase server

### Phase 2: Type Definitions
1. Update `PurchaseOrder` interface to include new fields
2. Update `PurchaseOrderFormData` interface
3. Update `PurchaseOrderItem` interface to include packaging_description

### Phase 3: Service Layer Updates
1. Update `createPurchaseOrder` function to handle new fields
2. Update `getPurchaseOrders` to include new fields in queries
3. Add function to calculate balance after purchase (budget tracking)

### Phase 4: UI Components
1. Create `PurchaseOrderCreatePage` component with form
2. Implement dynamic item selection (max 5 items)
3. Add vote code, vote activity, category, department dropdowns
4. Implement balance calculation display
5. Add form validation
6. Implement print functionality

### Phase 5: List Page Enhancements
1. Update `PurchaseOrderListPage` to display new fields
2. Add filters for vote code, category, department
3. Enhance table columns

### Phase 6: KPI Dashboard
1. Create KPI calculation service functions
2. Create KPI dashboard component
3. Integrate KPI dashboard into Purchase Order page
4. Add charts/visualizations for trends

### Phase 7: Print Functionality
1. Create print template component
2. Implement print-to-PDF functionality
3. Add print button to form and detail views

### Phase 8: Testing & Validation
1. Test form submission with all fields
2. Test database persistence via MCP
3. Test KPI calculations
4. Test print functionality
5. Validate balance calculations

## Technical Details

### Form Validation Rules
- Vote Code: Required, must be one of valid codes
- Vote Activity: Required, must be one of valid activities
- Category: Required, must be one of valid categories
- Department: Required, must be one of valid departments
- Items: Minimum 1, maximum 5 items
- Each item must have: item_id, quantity > 0, unit_price > 0
- Packaging description: Optional but recommended

### Balance Calculation
- Fetch current budget allocation for the selected vote code/activity
- Calculate total committed amount from pending/approved POs
- Display: Available Budget - (Committed + Current PO Total) = Balance After Purchase

### Print Template
- Include hospital header
- PO number and date
- Supplier information
- Vote code, activity, category, department
- Itemized list with quantities, prices, packaging
- Totals (subtotal, tax, total)
- Terms and conditions
- Signature lines

## File Structure

```
src/
├── pages/
│   └── pharmacy/
│       └── procurement/
│           ├── PurchaseOrderListPage.tsx (existing - enhance)
│           ├── PurchaseOrderCreatePage.tsx (new)
│           └── PurchaseOrderKPIDashboard.tsx (new)
├── services/
│   └── pharmacy/
│       └── procurementService.ts (update)
├── types/
│   └── pharmacy/
│       └── index.ts (update)
└── components/
    └── pharmacy/
        └── PurchaseOrderPrintTemplate.tsx (new)
```

## Success Criteria
1. ✅ Form successfully creates PO with all required fields
2. ✅ Data persists correctly in Supabase via MCP
3. ✅ Table displays all POs with new fields
4. ✅ KPI dashboard shows accurate metrics
5. ✅ Print functionality generates proper PO document
6. ✅ Balance calculation is accurate
7. ✅ Maximum 5 items per PO enforced
8. ✅ All validations work correctly

## Timeline Estimate
- Phase 1: Database Schema (30 min)
- Phase 2: Type Definitions (15 min)
- Phase 3: Service Layer (30 min)
- Phase 4: UI Components (2 hours)
- Phase 5: List Page Enhancements (30 min)
- Phase 6: KPI Dashboard (1 hour)
- Phase 7: Print Functionality (1 hour)
- Phase 8: Testing & Validation (30 min)

**Total Estimated Time: ~6 hours**

