# Pharmacy Logistics Module - Comprehensive Implementation Plan

## 📋 Overview

The Pharmacy Logistics module is the first of many hospital operation modules that will be developed for the HOME system. This module is controlled by the **System Admin** (who enables/disables modules per hospital) and managed by the **Hospital Admin** (who oversees module operations).

**Key Points:**
- System Admin controls which hospitals have access to this module
- Hospital Admin manages the module for their hospital
- Pharmacy staff use the module for daily operations
- This serves as the template for future modules

---

## 🏗️ Module Architecture

### Module Access Control Flow

```
System Admin (KKM Level)
│
├── Enable/Disable Pharmacy Logistics for Hospital A
├── Enable/Disable Pharmacy Logistics for Hospital B
└── Enable/Disable Pharmacy Logistics for Hospital C
        │
        ▼
Hospital Admin (Hospital Level)
│
├── Manage Pharmacy Logistics settings for their hospital
├── Assign users to Pharmacy Logistics roles
├── View Pharmacy Logistics reports
└── Monitor Pharmacy Logistics operations
        │
        ▼
Pharmacy Staff (Department Level)
│
├── Pharmacy Manager
│   └── Full access to Pharmacy Logistics operations
├── Pharmacist
│   └── View and manage inventory, procurement
└── Pharmacy Assistant
    └── Limited access (receiving, basic inventory)
```

---

## 📦 Module Structure

### 1. Inventory Management

#### 1.1 Drug Inventory
- **Drug Master List**: All registered drugs with details
- **Stock Levels**: Current, minimum, maximum, reorder point
- **Batch Tracking**: Batch number, manufacturing date, expiry date
- **Location Management**: Storage locations within pharmacy

#### 1.2 Non-Drug Inventory
- **Medical Consumables**: Syringes, gloves, bandages, etc.
- **Sundries**: General pharmacy supplies
- **Equipment**: Small pharmacy equipment

#### 1.3 Buffer Level Management
- Set minimum and maximum stock levels
- Automated reorder point calculation
- Safety stock configuration
- Lead time consideration

#### 1.4 Item Movement
- Stock In: Receiving from suppliers
- Stock Out: Dispensing to wards/patients
- Transfer: Inter-location transfers
- Adjustment: Stock corrections
- Return: Returns to suppliers

#### 1.5 Slow Moving Items
- Items with low turnover rate
- Threshold configuration (e.g., no movement in 90 days)
- Alerts and recommendations
- Action tracking (mark for return, disposal, etc.)

#### 1.6 Near Expiry Management
- Configurable expiry thresholds (30, 60, 90 days)
- First Expiry First Out (FEFO) enforcement
- Expiry alerts and notifications
- Expiry action workflow (return, dispose, transfer)

#### 1.7 Bad Stock / Defective Items
- Defective item reporting
- Quarantine management
- Investigation workflow
- Disposal/return tracking

---

### 2. Medical Oxygen Management

#### 2.1 Oxygen Cylinder Tracking
- Cylinder inventory (types: B, D, E, M, G, etc.)
- Serial number tracking
- Location tracking (ward, emergency, store)
- Status (full, empty, in-use, maintenance)

#### 2.2 Oxygen Consumption
- Daily consumption recording per ward/unit
- Consumption trends and analytics
- Usage forecasting
- Cost allocation per department

#### 2.3 Supplier Management
- Oxygen supplier records
- Delivery scheduling
- Quality certificates
- Contract management

#### 2.4 Alerts & Notifications
- Low stock alerts
- Cylinder maintenance due
- Expiry certification alerts

---

### 3. Financial Management

#### 3.1 Budget Allocation
- **APPL (Anggaran Peruntukan Perbelanjaan Langsung)**: Direct expenditure allocation
- **CC (Cost Center)**: Departmental cost tracking
- **DP (Dana Peruntukan)**: Fund allocation

#### 3.2 Budget Categories
- Drug procurement budget
- Non-drug procurement budget
- Equipment budget
- Operational expenses

#### 3.3 Budget Tracking
- Allocation vs. Expenditure
- Real-time budget utilization
- Monthly/Quarterly/Annual reports
- Budget variance analysis

#### 3.4 Forecast
- Demand forecasting based on historical data
- Seasonal trend analysis
- Budget requirement prediction
- Cash flow projection

#### 3.5 APPL Management
- APPL application creation
- Approval workflow
- Status tracking
- Integration with procurement

#### 3.6 CC/DP Management
- Cost center assignment
- Dana allocation tracking
- Fund transfer requests
- Financial reporting

---

### 4. Procurement

#### 4.1 Purchase Order (PO)
- Create PO from requisition or direct
- Approval workflow (based on amount thresholds)
- Supplier selection
- Terms and conditions
- Delivery scheduling

#### 4.2 Local Purchase Order (LPO)
- Emergency/urgent purchases
- Simplified approval for small amounts
- Quick vendor selection
- Immediate processing

#### 4.3 Delivery Management
- Expected delivery tracking
- Delivery notifications
- Delivery schedule management
- Partial delivery handling

#### 4.4 Receiving (Goods Receipt)
- Document verification (DO, Invoice)
- Quantity verification
- Quality inspection
- Batch number recording
- Expiry date verification
- Storage allocation

#### 4.5 Payment
- Invoice verification
- Payment scheduling
- Payment status tracking
- Supplier payment history

#### 4.6 Order Tracking
- End-to-end order visibility
- Status updates (ordered, shipped, received, completed)
- Timeline tracking
- Issue flagging

#### 4.7 Penalty Management
- Late delivery penalty calculation
- Quality issue penalties
- Penalty tracking and enforcement
- Supplier performance impact

#### 4.8 Letter of Undertaking (LOU)
- LOU generation
- Approval workflow
- Status tracking
- Integration with contracts

---

### 5. Distribution

#### 5.1 Inter-Facility Distribution
- Transfer between hospitals/clinics
- Request and approval workflow
- Transport arrangement
- Receiving confirmation
- Stock movement tracking

#### 5.2 Intra-Facility Distribution
- Ward requisitions
- Department transfers
- Emergency issues
- Return handling
- Stock reconciliation

#### 5.3 Distribution Dashboard
- Pending requests
- In-transit items
- Completed transfers
- Distribution analytics

---

### 6. Catalog Management

#### 6.1 Drug Catalog
- Drug master list (KKM standard)
- Drug information (generic name, brand, dosage form)
- Pricing information
- Supplier mapping
- Contract pricing

#### 6.2 Non-Drug Catalog
- Medical consumables list
- Sundry items
- Equipment catalog
- Standard specifications

#### 6.3 Supplier Catalog
- Registered suppliers
- Product mapping
- Contact information
- Performance rating
- Contract status

#### 6.4 Contract Catalog
- Active contracts
- Contract terms
- Pricing details
- Validity period
- Contract items

#### 6.5 MOF (Ministry of Finance) Catalog
- Government procurement catalog
- Standard pricing
- Panel suppliers
- Contract references

#### 6.6 KKM Hospital Facility Catalog
- Facility list (all hospitals)
- Facility codes
- Contact information
- Module assignments

#### 6.7 KKM Clinic Facility Catalog
- Klinik Kesihatan list
- Facility codes
- Supported services
- Stock requirements

---

### 7. Maintenance

#### 7.1 Unit Catalog List
- Unit of measure definitions
- Conversion factors
- Standard abbreviations

#### 7.2 Stock Location Management
- Location hierarchy (Warehouse > Zone > Bin)
- Location types (ambient, cold chain, controlled)
- Capacity management
- Location assignments

#### 7.3 Stock Verification
- Scheduled stock counts
- Cycle counting
- Full inventory count
- Variance reporting
- Adjustment processing

---

### 8. System

#### 8.1 Reports
- **Inventory Reports**
  - Current stock report
  - Stock movement report
  - Expiry report
  - Slow-moving report
  - Dead stock report
  
- **Procurement Reports**
  - Purchase order status
  - Pending deliveries
  - Supplier performance
  - Cost analysis
  
- **Financial Reports**
  - Budget utilization
  - Expenditure analysis
  - Cost center reports
  
- **Distribution Reports**
  - Transfer history
  - Ward consumption
  - Department usage

#### 8.2 Logs
- User activity logs
- Stock transaction logs
- System event logs
- Error logs
- Audit trails

---

## 🗂️ File Structure

```
src/
├── pages/
│   └── pharmacy/
│       ├── dashboard/
│       │   ├── PharmacyLogisticsDashboard.tsx
│       │   └── index.ts
│       ├── inventory/
│       │   ├── InventoryListPage.tsx
│       │   ├── InventoryDetailPage.tsx
│       │   ├── DrugInventoryPage.tsx
│       │   ├── NonDrugInventoryPage.tsx
│       │   ├── BufferLevelPage.tsx
│       │   ├── ItemMovementPage.tsx
│       │   ├── SlowMovingPage.tsx
│       │   ├── NearExpiryPage.tsx
│       │   ├── BadStockPage.tsx
│       │   └── index.ts
│       ├── oxygen/
│       │   ├── OxygenDashboardPage.tsx
│       │   ├── CylinderInventoryPage.tsx
│       │   ├── ConsumptionPage.tsx
│       │   └── index.ts
│       ├── financial/
│       │   ├── BudgetDashboardPage.tsx
│       │   ├── BudgetAllocationPage.tsx
│       │   ├── ForecastPage.tsx
│       │   ├── APPLPage.tsx
│       │   ├── CCDPPage.tsx
│       │   └── index.ts
│       ├── procurement/
│       │   ├── ProcurementDashboardPage.tsx
│       │   ├── PurchaseOrderListPage.tsx
│       │   ├── PurchaseOrderDetailPage.tsx
│       │   ├── PurchaseOrderCreatePage.tsx
│       │   ├── LPOListPage.tsx
│       │   ├── LPOCreatePage.tsx
│       │   ├── DeliveryTrackingPage.tsx
│       │   ├── ReceivingPage.tsx
│       │   ├── PaymentPage.tsx
│       │   ├── OrderTrackingPage.tsx
│       │   ├── PenaltyPage.tsx
│       │   ├── LOUPage.tsx
│       │   └── index.ts
│       ├── distribution/
│       │   ├── DistributionDashboardPage.tsx
│       │   ├── InterFacilityPage.tsx
│       │   ├── IntraFacilityPage.tsx
│       │   ├── TransferRequestPage.tsx
│       │   └── index.ts
│       ├── catalog/
│       │   ├── DrugCatalogPage.tsx
│       │   ├── NonDrugCatalogPage.tsx
│       │   ├── SupplierCatalogPage.tsx
│       │   ├── ContractCatalogPage.tsx
│       │   ├── MOFCatalogPage.tsx
│       │   ├── HospitalFacilityPage.tsx
│       │   ├── ClinicFacilityPage.tsx
│       │   └── index.ts
│       ├── maintenance/
│       │   ├── UnitCatalogPage.tsx
│       │   ├── StockLocationPage.tsx
│       │   ├── StockVerificationPage.tsx
│       │   └── index.ts
│       ├── reports/
│       │   ├── ReportsDashboardPage.tsx
│       │   ├── InventoryReportsPage.tsx
│       │   ├── ProcurementReportsPage.tsx
│       │   ├── FinancialReportsPage.tsx
│       │   ├── DistributionReportsPage.tsx
│       │   └── index.ts
│       ├── logs/
│       │   ├── PharmacyLogsPage.tsx
│       │   └── index.ts
│       └── index.ts
├── services/
│   └── pharmacy/
│       ├── inventoryService.ts
│       ├── drugService.ts
│       ├── nonDrugService.ts
│       ├── oxygenService.ts
│       ├── budgetService.ts
│       ├── procurementService.ts
│       ├── purchaseOrderService.ts
│       ├── lpoService.ts
│       ├── receivingService.ts
│       ├── distributionService.ts
│       ├── catalogService.ts
│       ├── maintenanceService.ts
│       ├── pharmacyReportService.ts
│       ├── pharmacyLogService.ts
│       └── index.ts
├── types/
│   └── pharmacy/
│       ├── inventory.ts
│       ├── oxygen.ts
│       ├── financial.ts
│       ├── procurement.ts
│       ├── distribution.ts
│       ├── catalog.ts
│       ├── maintenance.ts
│       └── index.ts
├── components/
│   └── pharmacy/
│       ├── inventory/
│       │   ├── InventoryTable.tsx
│       │   ├── StockCard.tsx
│       │   ├── ExpiryAlert.tsx
│       │   └── index.ts
│       ├── procurement/
│       │   ├── POForm.tsx
│       │   ├── POItemTable.tsx
│       │   ├── ReceivingForm.tsx
│       │   └── index.ts
│       ├── distribution/
│       │   ├── TransferForm.tsx
│       │   ├── TransferStatusBadge.tsx
│       │   └── index.ts
│       └── shared/
│           ├── PharmacyHeader.tsx
│           ├── PharmacySidebar.tsx
│           └── index.ts
└── stores/
    └── pharmacyStore.ts
```

---

## 📊 Database Schema

### New Tables Required

```sql
-- =====================================================
-- INVENTORY TABLES
-- =====================================================

-- Drug Master
CREATE TABLE pharmacy_drugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id),
  drug_code VARCHAR(50) UNIQUE NOT NULL,
  drug_name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  brand_name VARCHAR(255),
  dosage_form VARCHAR(100), -- tablet, capsule, injection, etc.
  strength VARCHAR(100), -- 500mg, 10ml, etc.
  unit_of_measure VARCHAR(50),
  category_id UUID REFERENCES pharmacy_drug_categories(id),
  is_controlled BOOLEAN DEFAULT FALSE,
  requires_prescription BOOLEAN DEFAULT TRUE,
  storage_conditions VARCHAR(255),
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER,
  reorder_level INTEGER,
  lead_time_days INTEGER DEFAULT 7,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Drug Categories
CREATE TABLE pharmacy_drug_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code VARCHAR(50) NOT NULL,
  category_name VARCHAR(255) NOT NULL,
  parent_category_id UUID REFERENCES pharmacy_drug_categories(id),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Non-Drug Items
CREATE TABLE pharmacy_non_drugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id),
  item_code VARCHAR(50) UNIQUE NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES pharmacy_non_drug_categories(id),
  unit_of_measure VARCHAR(50),
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER,
  reorder_level INTEGER,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Stock Batches
CREATE TABLE pharmacy_stock_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id),
  item_type VARCHAR(20) NOT NULL, -- 'drug' or 'non_drug'
  item_id UUID NOT NULL,
  batch_number VARCHAR(100) NOT NULL,
  manufacturing_date DATE,
  expiry_date DATE,
  quantity_received INTEGER NOT NULL,
  quantity_on_hand INTEGER NOT NULL,
  quantity_reserved INTEGER DEFAULT 0,
  unit_cost DECIMAL(15,2),
  location_id UUID REFERENCES pharmacy_stock_locations(id),
  status VARCHAR(20) DEFAULT 'available', -- available, quarantine, expired, depleted
  received_date DATE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  po_id UUID REFERENCES pharmacy_purchase_orders(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Stock Locations
CREATE TABLE pharmacy_stock_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id),
  location_code VARCHAR(50) NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  location_type VARCHAR(50) NOT NULL, -- warehouse, pharmacy, ward, cold_room, controlled
  parent_location_id UUID REFERENCES pharmacy_stock_locations(id),
  capacity INTEGER,
  temperature_required VARCHAR(50), -- ambient, 2-8C, -20C, etc.
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stock Transactions
CREATE TABLE pharmacy_stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id),
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  transaction_type VARCHAR(30) NOT NULL, -- receipt, issue, transfer_in, transfer_out, adjust, return, dispose
  transaction_date TIMESTAMP DEFAULT NOW(),
  item_type VARCHAR(20) NOT NULL, -- 'drug' or 'non_drug'
  item_id UUID NOT NULL,
  batch_id UUID REFERENCES pharmacy_stock_batches(id),
  quantity INTEGER NOT NULL,
  from_location_id UUID REFERENCES pharmacy_stock_locations(id),
  to_location_id UUID REFERENCES pharmacy_stock_locations(id),
  reference_type VARCHAR(50), -- PO, transfer_request, requisition, etc.
  reference_id UUID,
  reason TEXT,
  performed_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- OXYGEN MANAGEMENT TABLES
-- =====================================================

-- Oxygen Cylinder Types
CREATE TABLE pharmacy_oxygen_cylinder_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_code VARCHAR(10) NOT NULL, -- B, D, E, M, G, etc.
  type_name VARCHAR(100) NOT NULL,
  capacity_liters DECIMAL(10,2),
  weight_kg DECIMAL(10,2),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Oxygen Cylinders
CREATE TABLE pharmacy_oxygen_cylinders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id),
  serial_number VARCHAR(100) UNIQUE NOT NULL,
  type_id UUID REFERENCES pharmacy_oxygen_cylinder_types(id),
  status VARCHAR(30) DEFAULT 'full', -- full, empty, in_use, maintenance, disposed
  current_location_id UUID REFERENCES pharmacy_stock_locations(id),
  assigned_ward_id UUID REFERENCES departments(id),
  last_fill_date DATE,
  next_maintenance_date DATE,
  certification_expiry DATE,
  supplier_id UUID REFERENCES suppliers(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Oxygen Consumption Records
CREATE TABLE pharmacy_oxygen_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id),
  cylinder_id UUID REFERENCES pharmacy_oxygen_cylinders(id),
  department_id UUID REFERENCES departments(id),
  consumption_date DATE NOT NULL,
  quantity_used DECIMAL(10,2),
  unit VARCHAR(20), -- liters, cylinders
  recorded_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- FINANCIAL TABLES
-- =====================================================

-- Budget Allocations
CREATE TABLE pharmacy_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id),
  fiscal_year INTEGER NOT NULL,
  budget_type VARCHAR(30) NOT NULL, -- appl, cc, dp
  category VARCHAR(50) NOT NULL, -- drug, non_drug, equipment, operational
  allocated_amount DECIMAL(15,2) NOT NULL,
  utilized_amount DECIMAL(15,2) DEFAULT 0,
  committed_amount DECIMAL(15,2) DEFAULT 0,
  available_amount DECIMAL(15,2),
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Budget Transactions
CREATE TABLE pharmacy_budget_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES pharmacy_budgets(id),
  transaction_type VARCHAR(30) NOT NULL, -- commitment, expenditure, release
  amount DECIMAL(15,2) NOT NULL,
  reference_type VARCHAR(50), -- PO, payment, etc.
  reference_id UUID,
  description TEXT,
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- APPL Applications
CREATE TABLE pharmacy_appl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id),
  appl_number VARCHAR(50) UNIQUE NOT NULL,
  fiscal_year INTEGER NOT NULL,
  amount_requested DECIMAL(15,2) NOT NULL,
  amount_approved DECIMAL(15,2),
  purpose TEXT,
  justification TEXT,
  status VARCHAR(30) DEFAULT 'draft', -- draft, submitted, approved, rejected
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- =====================================================
-- PROCUREMENT TABLES
-- =====================================================

-- Purchase Orders
CREATE TABLE pharmacy_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  po_type VARCHAR(30) NOT NULL, -- regular, lpo, emergency
  supplier_id UUID REFERENCES suppliers(id),
  budget_id UUID REFERENCES pharmacy_budgets(id),
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  subtotal DECIMAL(15,2),
  tax_amount DECIMAL(15,2),
  total_amount DECIMAL(15,2),
  payment_terms VARCHAR(100),
  delivery_address TEXT,
  status VARCHAR(30) DEFAULT 'draft', -- draft, pending_approval, approved, sent, partial_received, completed, cancelled
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Purchase Order Items
CREATE TABLE pharmacy_purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES pharmacy_purchase_orders(id),
  item_type VARCHAR(20) NOT NULL, -- drug, non_drug
  item_id UUID NOT NULL,
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  expected_delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Goods Receipts
CREATE TABLE pharmacy_goods_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id),
  gr_number VARCHAR(50) UNIQUE NOT NULL,
  po_id UUID REFERENCES pharmacy_purchase_orders(id),
  receipt_date DATE NOT NULL,
  delivery_note_number VARCHAR(100),
  invoice_number VARCHAR(100),
  invoice_amount DECIMAL(15,2),
  status VARCHAR(30) DEFAULT 'pending', -- pending, inspecting, accepted, partial, rejected
  received_by UUID REFERENCES users(id),
  inspected_by UUID REFERENCES users(id),
  inspected_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Goods Receipt Items
CREATE TABLE pharmacy_goods_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gr_id UUID REFERENCES pharmacy_goods_receipts(id),
  po_item_id UUID REFERENCES pharmacy_purchase_order_items(id),
  quantity_received INTEGER NOT NULL,
  quantity_accepted INTEGER,
  quantity_rejected INTEGER DEFAULT 0,
  batch_number VARCHAR(100),
  manufacturing_date DATE,
  expiry_date DATE,
  storage_location_id UUID REFERENCES pharmacy_stock_locations(id),
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Order Tracking
CREATE TABLE pharmacy_order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES pharmacy_purchase_orders(id),
  status VARCHAR(50) NOT NULL,
  status_date TIMESTAMP DEFAULT NOW(),
  location VARCHAR(255),
  notes TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Supplier Penalties
CREATE TABLE pharmacy_supplier_penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id),
  supplier_id UUID REFERENCES suppliers(id),
  po_id UUID REFERENCES pharmacy_purchase_orders(id),
  penalty_type VARCHAR(50) NOT NULL, -- late_delivery, quality_issue, incomplete_delivery
  penalty_amount DECIMAL(15,2),
  penalty_percentage DECIMAL(5,2),
  days_delayed INTEGER,
  issue_date DATE NOT NULL,
  status VARCHAR(30) DEFAULT 'pending', -- pending, enforced, waived
  enforced_by UUID REFERENCES users(id),
  enforced_at TIMESTAMP,
  waiver_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Letter of Undertaking
CREATE TABLE pharmacy_lou (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id),
  lou_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  po_id UUID REFERENCES pharmacy_purchase_orders(id),
  issue_date DATE NOT NULL,
  valid_until DATE,
  amount DECIMAL(15,2),
  purpose TEXT,
  terms TEXT,
  status VARCHAR(30) DEFAULT 'draft', -- draft, pending, approved, issued, expired, cancelled
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- DISTRIBUTION TABLES
-- =====================================================

-- Transfer Requests
CREATE TABLE pharmacy_transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number VARCHAR(50) UNIQUE NOT NULL,
  transfer_type VARCHAR(30) NOT NULL, -- inter_facility, intra_facility
  from_hospital_id UUID REFERENCES hospitals(id),
  to_hospital_id UUID REFERENCES hospitals(id),
  from_department_id UUID REFERENCES departments(id),
  to_department_id UUID REFERENCES departments(id),
  from_location_id UUID REFERENCES pharmacy_stock_locations(id),
  to_location_id UUID REFERENCES pharmacy_stock_locations(id),
  request_date TIMESTAMP DEFAULT NOW(),
  required_date DATE,
  status VARCHAR(30) DEFAULT 'pending', -- pending, approved, preparing, in_transit, received, completed, rejected
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  requested_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  received_by UUID REFERENCES users(id),
  received_at TIMESTAMP,
  notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Transfer Request Items
CREATE TABLE pharmacy_transfer_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID REFERENCES pharmacy_transfer_requests(id),
  item_type VARCHAR(20) NOT NULL, -- drug, non_drug
  item_id UUID NOT NULL,
  batch_id UUID REFERENCES pharmacy_stock_batches(id),
  quantity_requested INTEGER NOT NULL,
  quantity_approved INTEGER,
  quantity_sent INTEGER,
  quantity_received INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- CATALOG TABLES
-- =====================================================

-- Contract Catalog
CREATE TABLE pharmacy_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number VARCHAR(100) UNIQUE NOT NULL,
  contract_name VARCHAR(255) NOT NULL,
  contract_type VARCHAR(50) NOT NULL, -- mof, kkm, hospital
  supplier_id UUID REFERENCES suppliers(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_value DECIMAL(15,2),
  status VARCHAR(30) DEFAULT 'active', -- draft, active, expired, terminated
  document_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Contract Items (linking items to contracts with pricing)
CREATE TABLE pharmacy_contract_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES pharmacy_contracts(id),
  item_type VARCHAR(20) NOT NULL, -- drug, non_drug
  item_id UUID NOT NULL,
  contract_price DECIMAL(15,2) NOT NULL,
  min_order_quantity INTEGER,
  max_order_quantity INTEGER,
  delivery_lead_time_days INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- MOF Catalog Items
CREATE TABLE pharmacy_mof_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mof_code VARCHAR(100) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  item_type VARCHAR(20) NOT NULL, -- drug, non_drug, equipment
  description TEXT,
  unit_of_measure VARCHAR(50),
  standard_price DECIMAL(15,2),
  contract_reference VARCHAR(100),
  panel_suppliers JSONB, -- Array of supplier IDs
  status VARCHAR(20) DEFAULT 'active',
  effective_date DATE,
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- =====================================================
-- MAINTENANCE TABLES
-- =====================================================

-- Unit of Measure
CREATE TABLE pharmacy_units_of_measure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_code VARCHAR(20) UNIQUE NOT NULL,
  unit_name VARCHAR(100) NOT NULL,
  unit_type VARCHAR(50), -- quantity, volume, weight, pack
  base_unit_id UUID REFERENCES pharmacy_units_of_measure(id),
  conversion_factor DECIMAL(10,4),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stock Verification (Stock Count)
CREATE TABLE pharmacy_stock_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id),
  verification_number VARCHAR(50) UNIQUE NOT NULL,
  verification_type VARCHAR(30) NOT NULL, -- full, cycle, spot
  location_id UUID REFERENCES pharmacy_stock_locations(id),
  scheduled_date DATE,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  status VARCHAR(30) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  performed_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stock Verification Items
CREATE TABLE pharmacy_stock_verification_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID REFERENCES pharmacy_stock_verifications(id),
  item_type VARCHAR(20) NOT NULL,
  item_id UUID NOT NULL,
  batch_id UUID REFERENCES pharmacy_stock_batches(id),
  system_quantity INTEGER NOT NULL,
  counted_quantity INTEGER,
  variance INTEGER,
  variance_reason TEXT,
  adjustment_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- LOGS TABLES
-- =====================================================

-- Pharmacy Activity Logs
CREATE TABLE pharmacy_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL, -- inventory, procurement, distribution, etc.
  entity_type VARCHAR(50),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎨 UI/UX Design Guidelines

### Dashboard Design
- Modern card-based layout with gradient accents
- Real-time statistics with animated counters
- Color-coded alerts (red: critical, amber: warning, green: healthy)
- Quick action buttons for common tasks
- Recent activity feed

### Color Scheme
- Primary: Teal (#0D9488) - Main pharmacy branding
- Secondary: Blue (#3B82F6) - Procurement actions
- Success: Green (#10B981) - Completed/Healthy
- Warning: Amber (#F59E0B) - Near expiry/Low stock
- Error: Red (#EF4444) - Critical alerts
- Info: Cyan (#06B6D4) - Information

### Status Badges
- Stock Status: In Stock (green), Low (amber), Critical (red), Out (gray)
- Expiry Status: Valid (green), Near Expiry (amber), Expired (red)
- Order Status: Draft (gray), Pending (amber), Approved (blue), Completed (green)
- Transfer Status: Pending (amber), In Transit (blue), Received (green)

---

## 🔐 Roles & Permissions

### Pharmacy Logistics Roles

| Role | Code | Access Level |
|------|------|--------------|
| Pharmacy Director | pharmacy_director | Full access + approvals |
| Pharmacy Manager | pharmacy_manager | Full operational access |
| Pharmacist | pharmacist | Inventory + Procurement view |
| Pharmacy Assistant | pharmacy_assistant | Basic receiving + viewing |
| Store Keeper | pharmacy_storekeeper | Stock management only |

### Permission Matrix

| Permission | Director | Manager | Pharmacist | Assistant | Storekeeper |
|------------|----------|---------|------------|-----------|-------------|
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Inventory | ✅ | ✅ | ✅ | ❌ | ✅ |
| Create PO | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve PO | ✅ | ✅ | ❌ | ❌ | ❌ |
| Receive Goods | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Budget | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Catalog | ✅ | ✅ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 📅 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up file structure
- [ ] Create TypeScript types
- [ ] Create mock data
- [ ] Build base services
- [ ] Create Pharmacy Dashboard

### Phase 2: Inventory Management (Week 3-4)
- [ ] Drug inventory pages
- [ ] Non-drug inventory pages
- [ ] Stock location management
- [ ] Batch tracking
- [ ] Expiry management
- [ ] Stock movement

### Phase 3: Procurement (Week 5-6)
- [ ] Purchase Order creation
- [ ] PO approval workflow
- [ ] LPO handling
- [ ] Goods receiving
- [ ] Order tracking

### Phase 4: Distribution & Financial (Week 7-8)
- [ ] Transfer requests
- [ ] Inter/Intra facility distribution
- [ ] Budget management
- [ ] APPL workflow
- [ ] Financial reports

### Phase 5: Catalog & Maintenance (Week 9-10)
- [ ] Drug catalog
- [ ] Non-drug catalog
- [ ] Supplier catalog
- [ ] Contract management
- [ ] Stock verification

### Phase 6: Reports & Integration (Week 11-12)
- [ ] Inventory reports
- [ ] Procurement reports
- [ ] Financial reports
- [ ] Activity logs
- [ ] Dashboard refinement

---

## 🔄 Future Module Template

This Pharmacy Logistics module will serve as the template for all future modules:
- Pharmacy Substore
- Pharmacy Outpatient
- Pharmacy Emergency
- Pharmacy In Patient
- Pharmacy Galenical & Prepacking
- General Ward
- Paediatric Ward
- Maternity Ward
- Emergency and Trauma
- Laboratory
- Operation Theater
- CSSU/CSSD
- Radiology & Radiography
- Klinik Pakar
- Haemodialysis
- Driver Room
- Hospital Office
- Front Desk

Each module will follow the same architectural patterns:
1. Module-specific pages under `src/pages/{module}/`
2. Module-specific services under `src/services/{module}/`
3. Module-specific types under `src/types/{module}/`
4. Module-specific components under `src/components/{module}/`

---

## ✅ Checklist Summary

### Types & Interfaces
- [ ] Inventory types (Drug, NonDrug, Batch, Location, Transaction)
- [ ] Oxygen types
- [ ] Financial types (Budget, APPL, Transaction)
- [ ] Procurement types (PO, GR, Tracking, Penalty, LOU)
- [ ] Distribution types (Transfer, Request, Item)
- [ ] Catalog types (Contract, MOF, Facility)
- [ ] Maintenance types (UOM, Verification)

### Services
- [ ] inventoryService.ts
- [ ] drugService.ts
- [ ] nonDrugService.ts
- [ ] oxygenService.ts
- [ ] budgetService.ts
- [ ] procurementService.ts
- [ ] purchaseOrderService.ts
- [ ] receivingService.ts
- [ ] distributionService.ts
- [ ] catalogService.ts
- [ ] maintenanceService.ts
- [ ] pharmacyReportService.ts
- [ ] pharmacyLogService.ts

### Pages (Priority Order)
1. [ ] PharmacyLogisticsDashboard (main entry point)
2. [ ] InventoryListPage (core functionality)
3. [ ] DrugInventoryPage
4. [ ] NonDrugInventoryPage
5. [ ] PurchaseOrderListPage
6. [ ] PurchaseOrderCreatePage
7. [ ] ReceivingPage
8. [ ] TransferRequestPage
9. [ ] BudgetDashboardPage
10. [ ] ReportsDashboardPage

### Components
- [ ] InventoryTable
- [ ] StockCard
- [ ] ExpiryAlert
- [ ] POForm
- [ ] ReceivingForm
- [ ] TransferForm
- [ ] BudgetChart
- [ ] PharmacyNav

### Routes
- [ ] Add all pharmacy routes to constants.ts
- [ ] Update routes.tsx
- [ ] Add to Sidebar navigation

---

**Document Created:** January 5, 2026
**Status:** Ready for Implementation
**Priority:** HIGH - First operational module


