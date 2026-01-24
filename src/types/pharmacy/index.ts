/**
 * Pharmacy Logistics Module - Type Definitions
 * This file contains all TypeScript types for the Pharmacy Logistics module
 */

import { BaseEntity, User, Department, Hospital, HospitalModule } from '@/types'

// =====================================================
// ENUMS AND CONSTANTS
// =====================================================

export type DrugDosageForm =
  | 'tablet'
  | 'capsule'
  | 'injection'
  | 'syrup'
  | 'suspension'
  | 'cream'
  | 'ointment'
  | 'drops'
  | 'inhaler'
  | 'patch'
  | 'suppository'
  | 'powder'
  | 'solution'
  | 'other'

export type ItemStatus = 'active' | 'inactive'
export type BatchStatus = 'available' | 'quarantine' | 'expired' | 'depleted'
export type LocationType = 'warehouse' | 'pharmacy' | 'ward' | 'cold_room' | 'controlled'
export type TemperatureRequirement = 'ambient' | '2-8C' | '-20C' | '-80C'

export type StockTransactionType =
  | 'receipt'
  | 'issue'
  | 'transfer_in'
  | 'transfer_out'
  | 'adjust_in'
  | 'adjust_out'
  | 'return'
  | 'dispose'

export type POStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'partial_received'
  | 'completed'
  | 'cancelled'

export type POType = 'regular' | 'lpo' | 'emergency' | 'sq' | 'manual'

export type GRStatus = 'pending' | 'inspecting' | 'accepted' | 'partial' | 'rejected'

export type TransferStatus =
  | 'pending'
  | 'approved'
  | 'preparing'
  | 'in_transit'
  | 'received'
  | 'completed'
  | 'rejected'

export type TransferType = 'inter_facility' | 'intra_facility'

// Deprecated or replaced by interfaces below
// export type OxygenCylinderStatus = ...
// export type OxygenCylinderType = ...

export type BudgetType = 'appl' | 'cc' | 'dp'
export type BudgetCategory = 'drug' | 'non_drug' | 'equipment' | 'operational'
export type APPLStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export type PenaltyType = 'late_delivery' | 'quality_issue' | 'incomplete_delivery'
export type PenaltyStatus = 'pending' | 'enforced' | 'waived'

export type ContractType = 'mof' | 'kkm' | 'hospital'
export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated'

export type VerificationType = 'full' | 'cycle' | 'spot'
export type VerificationStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

// =====================================================
// INVENTORY TYPES
// =====================================================

export interface DrugCategory extends BaseEntity {
  category_code: string
  category_name: string
  parent_category_id?: string
  description?: string
}

export interface DrugCategoryWithRelations extends DrugCategory {
  parent_category?: DrugCategory
  children?: DrugCategory[]
}

export interface Drug extends BaseEntity {
  hospital_id: string
  drug_code: string
  drug_name: string
  generic_name?: string
  brand_name?: string
  dosage_form: DrugDosageForm
  strength?: string
  unit_of_measure: string
  category_id?: string
  is_controlled: boolean
  requires_prescription: boolean
  storage_conditions?: string
  min_stock_level: number
  max_stock_level?: number
  reorder_level?: number
  lead_time_days: number
  status: ItemStatus
  // Catalog-specific fields
  sku?: string
  pku?: string
  supplier_id?: string
  procurement_vote?: 'appl' | 'cc' | 'dp' | 'lp'
  price?: number
  packaging_description?: string
  item_sub_class?: string
  notes?: string
}

export interface DrugWithRelations extends Drug {
  category?: DrugCategory
  hospital?: Hospital
  supplier?: Supplier
  current_stock?: number
  stock_status?: 'in_stock' | 'low_stock' | 'critical' | 'out_of_stock'
}

export interface NonDrugCategory extends BaseEntity {
  category_code: string
  category_name: string
  parent_category_id?: string
  description?: string
}

export interface NonDrug extends BaseEntity {
  hospital_id: string
  item_code: string
  item_name: string
  category_id?: string
  unit_of_measure: string
  min_stock_level: number
  max_stock_level?: number
  reorder_level?: number
  status: ItemStatus
  // Catalog-specific fields
  sku?: string
  pku?: string
  supplier_id?: string
  procurement_vote?: 'appl' | 'cc' | 'dp' | 'lp'
  price?: number
  packaging_description?: string
  notes?: string
}

export interface NonDrugWithRelations extends NonDrug {
  category?: NonDrugCategory
  hospital?: Hospital
  supplier?: Supplier
  current_stock?: number
  stock_status?: 'in_stock' | 'low_stock' | 'critical' | 'out_of_stock'
}

// =====================================================
// APPL CATALOG TYPES
// =====================================================

export interface ApplDrug extends BaseEntity {
  hospital_id: string
  item_code: string
  item_name: string
  packaging_description?: string
  price?: number
  notes?: string
  status: 'active' | 'inactive'
  created_by?: string
}

export interface ApplDrugWithRelations extends ApplDrug {
  hospital?: Hospital
  created_by_user?: User
}

export interface ApplNonDrug extends BaseEntity {
  hospital_id: string
  item_code: string
  item_name: string
  packaging_description?: string
  price?: number
  notes?: string
  status: 'active' | 'inactive'
  created_by?: string
}

export interface ApplNonDrugWithRelations extends ApplNonDrug {
  hospital?: Hospital
  created_by_user?: User
}

// =====================================================
// LP CATALOG TYPES
// =====================================================

export interface LpDrug extends BaseEntity {
  hospital_id: string
  item_code: string
  item_name: string
  packaging_description?: string
  price?: number
  notes?: string
  status: 'active' | 'inactive'
  created_by?: string
}

export interface LpDrugWithRelations extends LpDrug {
  hospital?: Hospital
  created_by_user?: User
}

export interface LpNonDrug extends BaseEntity {
  hospital_id: string
  item_code: string
  item_name: string
  packaging_description?: string
  price?: number
  notes?: string
  status: 'active' | 'inactive'
  created_by?: string
}

export interface LpNonDrugWithRelations extends LpNonDrug {
  hospital?: Hospital
  created_by_user?: User
}


export interface StockLocation extends BaseEntity {
  hospital_id: string
  location_code: string
  location_name: string
  location_type: LocationType
  parent_location_id?: string
  capacity?: number
  temperature_required?: TemperatureRequirement
  is_active: boolean
}

export interface StockLocationWithRelations extends StockLocation {
  parent_location?: StockLocation
  children?: StockLocation[]
  hospital?: Hospital
}

export interface StockBatch extends BaseEntity {
  hospital_id: string
  item_type: 'drug' | 'non_drug'
  item_id: string
  batch_number: string
  manufacturing_date?: string
  expiry_date?: string
  quantity_received: number
  quantity_on_hand: number
  quantity_reserved: number
  unit_cost?: number
  location_id?: string
  status: BatchStatus
  received_date: string
  supplier_id?: string
  po_id?: string
}

export interface StockBatchWithRelations extends StockBatch {
  drug?: Drug
  non_drug?: NonDrug
  location?: StockLocation
  supplier?: Supplier
}

export interface StockTransaction extends BaseEntity {
  hospital_id: string
  transaction_number: string
  transaction_type: StockTransactionType
  transaction_date: string
  item_type: 'drug' | 'non_drug'
  item_id: string
  batch_id?: string
  quantity: number
  from_location_id?: string
  to_location_id?: string
  reference_type?: string
  reference_id?: string
  reason?: string
  performed_by: string
  approved_by?: string
}

export interface StockTransactionWithRelations extends StockTransaction {
  drug?: Drug
  non_drug?: NonDrug
  batch?: StockBatch
  from_location?: StockLocation
  to_location?: StockLocation
  performed_by_user?: User
  approved_by_user?: User
}

// =====================================================
// INVENTORY SUMMARY TYPES
// =====================================================

export interface InventorySummary {
  total_items: number
  drugs_count: number
  non_drugs_count: number
  total_value: number
  low_stock_count: number
  critical_stock_count: number
  near_expiry_count: number
  expired_count: number
  slow_moving_count: number
}

export interface StockLevelSummary {
  item_id: string
  item_type: 'drug' | 'non_drug'
  item_code: string
  item_name: string
  unit_of_measure: string
  min_stock: number
  max_stock?: number
  reorder_level?: number
  current_stock: number
  available_stock: number
  reserved_stock: number
  status: 'in_stock' | 'low_stock' | 'critical' | 'out_of_stock'
  last_movement_date?: string
}

export interface ExpiryItem {
  batch_id: string
  item_id: string
  item_type: 'drug' | 'non_drug'
  item_code: string
  item_name: string
  batch_number: string
  expiry_date: string
  quantity: number
  days_to_expiry: number
  location_name: string
  status: 'valid' | 'near_expiry' | 'expired'
}

export interface SlowMovingItem {
  item_id: string
  item_type: 'drug' | 'non_drug'
  item_code: string
  item_name: string
  current_stock: number
  last_movement_date: string
  days_since_movement: number
  unit_value: number
  total_value: number
}

// =====================================================
// OXYGEN MANAGEMENT TYPES
// =====================================================

export interface OxygenCylinderSize extends BaseEntity {
  code: string // P101-D, P101-E, etc.
  capacity: number
  unit: string // m3
  is_loan: boolean
}

export interface OxygenCylinderType extends BaseEntity {
  code: string // BN, PI
  name: string // Bullnose, Pin Index
}

export interface OxygenReceptionRecord extends BaseEntity {
  hospital_id: string
  reception_date: string
  delivery_order_no: string
  sales_order_no?: string
  refill_amount: number
  loan_amount: number
  total_amount: number
  vote_code: string // 080702
  vote_activity: string // 27402
  status: 'pending' | 'completed' | 'cancelled'
  created_by?: string
}

export interface OxygenReceptionRecordWithRelations extends OxygenReceptionRecord {
  hospital?: Hospital
  created_by_user?: User
  items?: OxygenReceptionItemWithRelations[]
}

export interface OxygenReceptionItem extends BaseEntity {
  reception_id: string
  cylinder_id: string
  cylinder_size_id: string
  cylinder_type_id: string
  unit_price: number
}

export interface OxygenReceptionItemWithRelations extends OxygenReceptionItem {
  cylinder?: OxygenCylinderInventory
  cylinder_size?: OxygenCylinderSize
  cylinder_type?: OxygenCylinderType
}

export interface OxygenCylinderInventory extends BaseEntity {
  hospital_id: string
  cylinder_size_id: string
  cylinder_type_id: string
  qr_code: string
  serial_number?: string
  status: 'available' | 'issued' | 'empty' | 'damaged' | 'returned_to_supplier'
  current_location: string
  department_id?: string
}

export interface OxygenCylinderInventoryWithRelations extends OxygenCylinderInventory {
  size_info?: OxygenCylinderSize
  type_info?: OxygenCylinderType
  department?: Department
  movements?: OxygenCylinderMovement[]
}

export interface OxygenCylinderMovement extends BaseEntity {
  hospital_id: string
  cylinder_id: string
  movement_type: 'received' | 'issued' | 'returned_from_dept' | 'sent_to_supplier'
  from_location?: string
  to_location?: string
  department_id?: string
  moved_by?: string
  moved_at: string
  remarks?: string
}

export interface OxygenCylinderMovementWithRelations extends OxygenCylinderMovement {
  cylinder?: OxygenCylinderInventory
  department?: Department
  moved_by_user?: User
}

export interface OxygenCylinderRequest extends BaseEntity {
  hospital_id: string
  supplier_id?: string
  request_number: string
  request_date: string
  request_type: 'purchase' | 'maintenance' | 'return_empty'
  status: 'draft' | 'submitted' | 'approved' | 'sent' | 'completed' | 'cancelled'
  total_amount: number
  email_sent_at?: string
  remarks?: string
  created_by?: string
  approved_by?: string
}

export interface OxygenCylinderRequestWithRelations extends OxygenCylinderRequest {
  hospital?: Hospital
  supplier?: Supplier
  items?: OxygenRequestItemWithRelations[]
  created_by_user?: User
  approved_by_user?: User
}

export interface OxygenRequestItem extends BaseEntity {
  request_id: string
  cylinder_size_id: string
  cylinder_type_id: string
  quantity: number
  unit_price: number
  total_price: number
  remarks?: string
}

export interface OxygenRequestItemWithRelations extends OxygenRequestItem {
  size_info?: OxygenCylinderSize
  type_info?: OxygenCylinderType
}

export interface OxygenDashboardKPIs {
  cc_allocation: number
  total_allocation: number
  expense: number
  balance: number
  liabilities: number
  net_expenses: number
  loan_total: number
}

export interface OxygenPricingConfig extends BaseEntity {
  hospital_id?: string
  cylinder_size_code: string
  refill_price: number
  effective_from: string
}

export interface OxygenSystemSettings {
  hospital_id: string
  loan_cylinder_rate: number
}

export interface OxygenSummary {
  total_cylinders: number
  full_cylinders: number
  empty_cylinders: number
  in_use_cylinders: number
  maintenance_cylinders: number
  cylinders_by_type: { type: string; count: number }[]
  daily_consumption: number
  monthly_consumption: number
  kpis?: OxygenDashboardKPIs
  inventory_summary?: {
    size_code: string
    type_name: string
    capacity: number
    unit: string
    available: number
    empty: number
    issued: number
    total: number
    avg_usage_month: number
  }[]
  recent_receptions?: OxygenReceptionRecord[]
}

// =====================================================
// SUPPLIER TYPES
// =====================================================

export type SupplierStatus = 'active' | 'inactive' | 'blacklisted'
export type SupplierType = 'drug' | 'non_drug' | 'both'

export interface Supplier extends BaseEntity {
  supplier_code: string
  company_name: string
  contact_person?: string
  contact_person_phone?: string
  email?: string
  phone?: string
  address?: string
  registration_number?: string
  bank_account?: string
  bank_name?: string
  supplier_type?: SupplierType
  /** Primary bank account number used for payments (display only, no secrets) */
  account_number?: string
  /** Optional URL to uploaded bank/account document (PDF in Supabase Storage) */
  account_document_url?: string
  /** Optional URL to uploaded MOF certificate (PDF in Supabase Storage) */
  mof_certificate_url?: string
  /** Optional URL to uploaded Bumiputera Registration certificate (PDF in Supabase Storage) */
  bumiputera_registration_certificate_url?: string
  status: SupplierStatus
  hospital_id?: string
  performance_rating?: number
  notes?: string
}

export interface SupplierWithRelations extends Supplier {
  contracts?: Contract[]
  recent_orders?: PurchaseOrder[]
  total_orders?: number
  total_value?: number
}

// =====================================================
// FINANCIAL TYPES
// =====================================================

export interface Budget extends BaseEntity {
  hospital_id: string
  fiscal_year: number
  budget_type: BudgetType
  category: BudgetCategory
  allocated_amount: number
  utilized_amount: number
  committed_amount: number
  available_amount: number
  created_by: string
  approved_by?: string
  status: 'active' | 'closed'
}

export interface BudgetWithRelations extends Budget {
  created_by_user?: User
  approved_by_user?: User
  transactions?: BudgetTransaction[]
}

export interface BudgetTransaction extends BaseEntity {
  budget_id: string
  transaction_type: 'commitment' | 'expenditure' | 'release'
  amount: number
  reference_type?: string
  reference_id?: string
  description?: string
  performed_by: string
}

export interface APPL extends BaseEntity {
  hospital_id: string
  appl_number: string
  fiscal_year: number
  amount_requested: number
  amount_approved?: number
  purpose?: string
  justification?: string
  status: APPLStatus
  submitted_by?: string
  submitted_at?: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
}

export interface APPLWithRelations extends APPL {
  hospital?: Hospital
  submitted_by_user?: User
  approved_by_user?: User
}

export interface BudgetSummary {
  fiscal_year: number
  total_allocated: number
  total_utilized: number
  total_committed: number
  total_available: number
  utilization_percentage: number
  by_type: {
    type: BudgetType
    allocated: number
    utilized: number
    available: number
  }[]
  by_category: {
    category: BudgetCategory
    allocated: number
    utilized: number
    available: number
  }[]
}

// =====================================================
// WARRANT TYPES
// =====================================================

export type WarrantVoteCode = '080702' | '990102'

export type WarrantVoteActivity = '27401' | '27499' | '27404' | '27403' | '27402' | '27501'

export type WarrantCategory =
  | 'drug'
  | 'non_drug'
  | 'non_standard'
  | 'reagent'
  | 'vaccine'
  | 'insulin'
  | 'hepc'
  | 'medical_oxygen'

export type WarrantDepartment =
  | 'pharmacy'
  | 'nephrology'
  | 'radiology_radiography'
  | 'emergency_trauma'
  | 'cssu_cssd'
  | 'operation_theater'
  | 'laboratory_pathology'
  | 'general_ward'
  | 'wound_care'
  | 'rehabilitation'
  | 'anaesthesiology'

export interface Warrant extends BaseEntity {
  hospital_id: string
  warrant_date: string
  document_no: string
  vote_code: WarrantVoteCode
  vote_activity: WarrantVoteActivity
  category: WarrantCategory
  department: WarrantDepartment
  amount: number
  created_by?: string
}

export interface WarrantWithRelations extends Warrant {
  hospital?: Hospital
  created_by_user?: User
}

export interface WarrantFormData {
  warrant_date: string
  document_no: string
  vote_code: WarrantVoteCode
  vote_activity: WarrantVoteActivity
  category: WarrantCategory
  department: WarrantDepartment
  amount: number
}

export interface WarrantSummary {
  // Core metrics
  total_allocation: number
  total_expenses: number
  total_balance: number
  total_liabilities: number
  net_expenses: number
  usage_percentage: number
  total_count: number

  // Breakdowns
  by_category: {
    category: WarrantCategory
    allocation: number
    expenses: number
    balance: number
    count: number
  }[]
  by_department: {
    department: WarrantDepartment
    allocation: number
    expenses: number
    liabilities: number
    net_expenses: number
    balance: number
    count: number
  }[]
  by_vote_code: {
    vote_code: WarrantVoteCode
    allocation: number
    expenses: number
    balance: number
    count: number
  }[]
  by_department_vote_activity: {
    department: string
    vote_code: string
    vote_activity: string
    allocation: number
    expenses: number
    balance: number
    count: number
  }[]
  recent_warrants: Warrant[]
}

// =====================================================
// APPL ALLOCATION TYPES
// =====================================================

export interface APPLExpense extends BaseEntity {
  hospital_id: string
  fiscal_year: number
  warrant_id?: string
  po_id: string
  expense_date: string
  po_number: string
  lpo_number?: string
  po_type: POType
  amount: number
  status: 'pending' | 'approved' | 'completed' | 'cancelled'
  category?: string
  vote_activity?: string // Vote activity code (27401, 27499, 27404, 27403, 27402, 27501)
  department?: string
  created_by?: string
}

export interface APPLExpenseWithRelations extends APPLExpense {
  warrant?: Warrant
  purchase_order?: PurchaseOrderWithRelations
  created_by_user?: User
}

export interface APPLAllocationSummary {
  fiscal_year: number
  total_allocation: number // From warrants with vote_code 990102
  total_expenses: number // Sum of all APPL expenses
  total_balance: number // allocation - expenses
  total_liabilities: number // Pending/approved but not completed expenses
  net_expenses: number // Completed expenses only
  usage_percentage: number // (expenses / allocation) * 100
  total_count: number // Total number of expenses

  // Quarterly breakdown
  quarterly: {
    quarter: 1 | 2 | 3 | 4
    allocation: number
    expenses: number
    balance: number
    usage_percentage: number
  }[]

  // Breakdown by vote activity
  by_vote_activity: {
    vote_activity: string
    allocation: number
    expenses: number
    balance: number
    liabilities: number
    net_expenses: number
    count: number
  }[]

  // Breakdown by category
  by_category: {
    category: string
    allocation: number
    expenses: number
    balance: number
    count: number
  }[]

  // Breakdown by PO type
  by_po_type: {
    po_type: POType
    expenses: number
    count: number
  }[]
}

// =====================================================
// CC ALLOCATION TYPES
// =====================================================

export interface CCExpense extends BaseEntity {
  hospital_id: string
  fiscal_year: number
  warrant_id?: string
  po_id: string
  expense_date: string
  po_number: string
  lpo_number?: string
  po_type: POType
  amount: number
  status: 'pending' | 'approved' | 'completed' | 'cancelled'
  category?: string
  vote_activity?: string // Vote activity code (27401, 27499, 27404, 27403, 27402, 27501)
  department?: string
  created_by?: string
}

export interface CCExpenseWithRelations extends CCExpense {
  warrant?: Warrant
  purchase_order?: PurchaseOrderWithRelations
  created_by_user?: User
}

export interface CCAllocationSummary {
  fiscal_year: number
  total_allocation: number // From warrants with vote_code 080702
  total_expenses: number // Sum of all CC expenses
  total_balance: number // allocation - expenses
  total_liabilities: number // Pending/approved but not completed expenses
  net_expenses: number // Completed expenses only
  usage_percentage: number // (expenses / allocation) * 100
  total_count: number // Total number of expenses

  // Quarterly breakdown
  quarterly: {
    quarter: 1 | 2 | 3 | 4
    allocation: number
    expenses: number
    balance: number
    usage_percentage: number
  }[]

  // Breakdown by vote activity
  by_vote_activity: {
    vote_activity: string
    allocation: number
    expenses: number
    balance: number
    liabilities: number
    net_expenses: number
    count: number
  }[]

  // Breakdown by category
  by_category: {
    category: string
    allocation: number
    expenses: number
    balance: number
    count: number
  }[]

  // Breakdown by PO type
  by_po_type: {
    po_type: POType
    expenses: number
    count: number
  }[]
}

// =====================================================
// PROCUREMENT TYPES
// =====================================================

export interface PurchaseOrder extends BaseEntity {
  hospital_id: string
  po_number: string
  po_type: POType
  supplier_id: string
  budget_id?: string
  vote_code?: string // Vote code (080702, 990102)
  vote_activity?: string // Vote activity (27401, 27499, 27404, 27403, 27402, 27501)
  category?: string // Category (drug, non_drug, non_standard, reagent, vaccine, insulin, hepc, medical_oxygen)
  department?: string // Department code
  order_date: string
  expected_delivery_date?: string
  actual_delivery_date?: string
  subtotal?: number
  tax_amount?: number
  total_amount?: number
  payment_terms?: string
  delivery_address?: string
  status: POStatus
  created_by: string
  approved_by?: string
  approved_at?: string
  notes?: string
  kkm_contract_number?: string
  manual_supplier_name?: string;
  manual_supplier_address?: string;
  sq_suppliers?: string[]
  program_name?: string;
  workflow_id?: string;
  current_step?: number;
  signature_snapshot?: any;
}

export interface PurchaseOrderWithRelations extends PurchaseOrder {
  hospital?: Hospital
  supplier?: Supplier
  budget?: Budget
  items?: PurchaseOrderItem[]
  goods_receipts?: GoodsReceipt[]
  created_by_user?: User
  approved_by_user?: User
  tracking_history?: OrderTracking[]
}

export interface PurchaseOrderItem extends BaseEntity {
  po_id: string
  item_type: 'drug' | 'non_drug' | 'manual'
  item_id?: string
  item_name?: string
  item_code?: string
  quantity_ordered: number
  quantity_received: number
  unit_price: number
  total_price: number
  packaging_description?: string
  expected_delivery_date?: string
  notes?: string
}

export interface PurchaseOrderItemWithRelations extends PurchaseOrderItem {
  drug?: Drug
  non_drug?: NonDrug
}

export interface GoodsReceipt extends BaseEntity {
  hospital_id: string
  gr_number: string
  po_id: string
  receipt_date: string
  delivery_note_number?: string
  invoice_number?: string
  invoice_amount?: number
  status: GRStatus
  received_by: string
  inspected_by?: string
  inspected_at?: string
  notes?: string
}

export interface GoodsReceiptWithRelations extends GoodsReceipt {
  hospital?: Hospital
  purchase_order?: PurchaseOrder
  items?: GoodsReceiptItem[]
  received_by_user?: User
  inspected_by_user?: User
}

export interface GoodsReceiptItem extends BaseEntity {
  gr_id: string
  po_item_id: string
  quantity_received: number
  quantity_accepted?: number
  quantity_rejected: number
  batch_number?: string
  manufacturing_date?: string
  expiry_date?: string
  storage_location_id?: string
  rejection_reason?: string
  notes?: string
}

export interface GoodsReceiptItemWithRelations extends GoodsReceiptItem {
  po_item?: PurchaseOrderItem
  storage_location?: StockLocation
}

export interface OrderTracking extends BaseEntity {
  po_id: string
  status: string
  status_date: string
  location?: string
  notes?: string
  updated_by: string
}

export interface SupplierPenalty extends BaseEntity {
  hospital_id: string
  supplier_id: string
  po_id?: string
  penalty_type: PenaltyType
  penalty_amount?: number
  penalty_percentage?: number
  days_delayed?: number
  issue_date: string
  status: PenaltyStatus
  enforced_by?: string
  enforced_at?: string
  waiver_reason?: string
  notes?: string
}

export interface SupplierPenaltyWithRelations extends SupplierPenalty {
  supplier?: Supplier
  purchase_order?: PurchaseOrder
  enforced_by_user?: User
}

export interface LOU extends BaseEntity {
  hospital_id: string
  lou_number: string
  supplier_id: string
  po_id?: string
  issue_date: string
  valid_until?: string
  amount?: number
  purpose?: string
  terms?: string
  status: 'draft' | 'pending' | 'approved' | 'issued' | 'expired' | 'cancelled'
  created_by: string
  approved_by?: string
  approved_at?: string
}

export interface LOUWithRelations extends LOU {
  hospital?: Hospital
  supplier?: Supplier
  purchase_order?: PurchaseOrder
  created_by_user?: User
  approved_by_user?: User
}

export interface ProcurementSummary {
  pending_orders: number
  pending_value: number
  orders_this_month: number
  orders_value_this_month: number
  pending_deliveries: number
  pending_receipts: number
  overdue_deliveries: number
  supplier_count: number
  top_suppliers: {
    supplier_id: string
    supplier_name: string
    order_count: number
    total_value: number
  }[]
}

export interface ProcurementStats {
  total_orders: number
  total_value: number
  pending_orders: number
  completed_orders: number
  total_items?: number
  by_status: Record<string, number>
  by_category: Record<string, number>
  by_department: Record<string, number>
  by_vote_code: Record<string, number>
  items_breakdown?: Record<string, number>
  department_breakdown?: DepartmentBreakdownItem[]
  total_sq?: number
  total_regular_po?: number
}

export interface DepartmentBreakdownItem {
  department: string
  vote_codes: {
    code: string
    total_orders: number
    total_items: number
    activities?: {
      code: string
      total_orders: number
      total_items: number
    }[]
  }[]
}



// =====================================================
// DISTRIBUTION TYPES
// =====================================================

export interface TransferRequest extends BaseEntity {
  transfer_number: string
  transfer_type: TransferType
  from_hospital_id?: string
  to_hospital_id?: string
  from_department_id?: string
  to_department_id?: string
  from_location_id?: string
  to_location_id?: string
  request_date: string
  required_date?: string
  status: TransferStatus
  priority: 'low' | 'normal' | 'high' | 'urgent'
  requested_by: string
  approved_by?: string
  approved_at?: string
  received_by?: string
  received_at?: string
  notes?: string
  rejection_reason?: string
}

export interface TransferRequestWithRelations extends TransferRequest {
  from_hospital?: Hospital
  to_hospital?: Hospital
  from_department?: Department
  to_department?: Department
  from_location?: StockLocation
  to_location?: StockLocation
  items?: TransferRequestItem[]
  requested_by_user?: User
  approved_by_user?: User
  received_by_user?: User
}

export interface TransferRequestItem extends BaseEntity {
  transfer_id: string
  item_type: 'drug' | 'non_drug'
  item_id: string
  batch_id?: string
  quantity_requested: number
  quantity_approved?: number
  quantity_sent?: number
  quantity_received?: number
  notes?: string
}

export interface TransferRequestItemWithRelations extends TransferRequestItem {
  drug?: Drug
  non_drug?: NonDrug
  batch?: StockBatch
}

export interface DistributionSummary {
  pending_requests: number
  in_transit: number
  completed_today: number
  completed_this_month: number
  inter_facility_pending: number
  intra_facility_pending: number
}

// =====================================================
// CATALOG TYPES
// =====================================================

// Contract Catalog - Excel Upload Approach
export type ContractCatalogStatus = 'active' | 'inactive' | 'expired' | 'expiring' | 'pending'

export interface Contract extends BaseEntity {
  hospital_id: string
  item_name: string // Item/Product name
  item_code?: string // Optional item identification code
  contract_number: string // No Kontrak - Unique contract identifier
  contract_type?: ContractType // Type of contract (mof, kkm, hospital)
  supplier_id?: string // Link to suppliers table
  supplier_name?: string // Pembekal - Denormalized supplier name
  start_date?: string // Kontrak Mula - Contract start date
  end_date?: string // Kontrak Tamat - Contract end date
  unit?: string // Unit of measure (Box, Pack, Each)
  unit_price?: number // Harga (RM) - Price per unit in Ringgit Malaysia
  currency?: string // Currency (default: MYR)
  delivery_period?: string // Tempoh Serahan - Expected delivery timeframe
  sst_rate?: string // SST - Sales and Service Tax rate/amount
  status: ContractCatalogStatus
  metadata?: Record<string, unknown> // Additional fields (notes, custom fields)
  uploaded_file_id?: string // Link to uploaded_files table
  document_url?: string // Optional contract document URL
}

export interface ContractWithRelations extends Contract {
  hospital?: Hospital
  supplier?: Supplier
  uploaded_file?: UploadedFile
}

// For backward compatibility - legacy contract items
export interface ContractItem extends BaseEntity {
  contract_id: string
  item_type: 'drug' | 'non_drug'
  item_id: string
  contract_price: number
  min_order_quantity?: number
  max_order_quantity?: number
  delivery_lead_time_days?: number
}

export interface ContractItemWithRelations extends ContractItem {
  drug?: Drug
  non_drug?: NonDrug
}

// Contract Catalog KPIs
export interface ContractCatalogKPIs {
  total: number
  active: number
  expired: number
  expiring_soon: number // Expiring within 30 days
  pending: number
  total_value: number // Sum of all contract values
  contracts_by_supplier: { supplier_name: string; count: number }[]
}

// Contract Catalog Filters
export interface ContractCatalogFilter {
  search?: string
  supplier_id?: string
  supplier_name?: string
  status?: ContractCatalogStatus | 'all'
  contract_type?: ContractType | 'all'
  date_from?: string
  date_to?: string
  min_price?: number
  max_price?: number
}

// Uploaded Files Type (for contract tracking)
export interface UploadedFile extends BaseEntity {
  id: string
  hospital_id: string
  file_name: string
  file_hash: string
  file_size: number
  file_type: 'excel' | 'pdf' | 'image'
  catalog_type: 'drug' | 'non_drug' | 'contract'
  upload_status: 'pending' | 'processing' | 'completed' | 'failed'
  items_imported: number
  errors_count: number
  error_details?: Record<string, unknown>
  uploaded_by?: string
  uploaded_at: string
}

export interface MOFCatalogItem extends BaseEntity {
  mof_code: string
  item_name: string
  item_type: 'drug' | 'non_drug' | 'equipment'
  description?: string
  unit_of_measure?: string
  standard_price?: number
  contract_reference?: string
  panel_suppliers?: string[]
  status: 'active' | 'inactive'
  effective_date?: string
  expiry_date?: string
}

export interface KKMFacility extends BaseEntity {
  facility_code: string
  facility_name: string
  facility_type: 'hospital' | 'clinic'
  state: string
  address?: string
  phone?: string
  email?: string
  is_active: boolean
}

// =====================================================
// HOSPITAL FACILITY CATALOG TYPES
// =====================================================

export type HospitalFacilityStatus = 'active' | 'inactive'

export interface HospitalFacility extends BaseEntity {
  hospital_id: string
  name: string // Hospital name
  address?: string // Alamat 1
  city?: string // Bandar
  state?: string // Negeri
  phone?: string // Phone number
  email?: string // Email address
  facility_code?: string // Optional facility code
  status: HospitalFacilityStatus
  moh_id?: string // ID from MOH website if fetched from there
  metadata?: Record<string, unknown> // Additional fields
}

export interface HospitalFacilityWithRelations extends HospitalFacility {
  hospital?: Hospital
}

export interface HospitalFacilityCatalogKPIs {
  total: number
  by_state: { state: string; count: number }[]
  by_city: { city: string; count: number }[]
}

export interface HospitalFacilityCatalogFilter {
  search?: string
  state?: string | 'all'
  city?: string | 'all'
  status?: HospitalFacilityStatus | 'all'
}

// =====================================================
// CLINIC FACILITY CATALOG TYPES
// =====================================================

export type ClinicFacilityStatus = 'active' | 'inactive'

export interface ClinicFacility extends BaseEntity {
  hospital_id: string
  name: string // Clinic name
  address?: string // Alamat 1
  city?: string // Bandar
  state?: string // Negeri
  phone?: string // Phone number
  email?: string // Email address
  facility_code?: string // Optional facility code
  status: ClinicFacilityStatus
  moh_id?: string // ID from MOH website if fetched from there
  metadata?: Record<string, unknown> // Additional fields
}

export interface ClinicFacilityWithRelations extends ClinicFacility {
  hospital?: Hospital
}

export interface ClinicFacilityCatalogKPIs {
  total: number
  by_state: { state: string; count: number }[]
  by_city: { city: string; count: number }[]
}

export interface ClinicFacilityCatalogFilter {
  search?: string
  state?: string | 'all'
  city?: string | 'all'
  status?: ClinicFacilityStatus | 'all'
}

// =====================================================
// MAINTENANCE TYPES
// =====================================================

export interface UnitOfMeasure extends BaseEntity {
  unit_code: string
  unit_name: string
  unit_type?: 'quantity' | 'volume' | 'weight' | 'pack'
  base_unit_id?: string
  conversion_factor?: number
  is_active: boolean
}

export interface UnitOfMeasureWithRelations extends UnitOfMeasure {
  base_unit?: UnitOfMeasure
}

export interface StockVerification extends BaseEntity {
  hospital_id: string
  verification_number: string
  verification_type: VerificationType
  location_id?: string
  scheduled_date?: string
  started_at?: string
  completed_at?: string
  status: VerificationStatus
  performed_by?: string
  approved_by?: string
  notes?: string
}

export interface StockVerificationWithRelations extends StockVerification {
  location?: StockLocation
  items?: StockVerificationItem[]
  performed_by_user?: User
  approved_by_user?: User
}

export interface StockVerificationItem extends BaseEntity {
  verification_id: string
  item_type: 'drug' | 'non_drug'
  item_id: string
  batch_id?: string
  system_quantity: number
  counted_quantity?: number
  variance?: number
  variance_reason?: string
  adjustment_approved: boolean
}

export interface StockVerificationItemWithRelations extends StockVerificationItem {
  drug?: Drug
  non_drug?: NonDrug
  batch?: StockBatch
}

// =====================================================
// UNIT CATALOG TYPES
// =====================================================

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
  item_id?: string | null
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
  item_id?: string | null
  changed_by_user?: User
  catalog?: UnitCatalog
  item?: UnitCatalogItem
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
  units_with_items: number
  total_drug_items: number
  total_non_drug_items: number
  total_active_drug_items: number
  total_active_non_drug_items: number
}

export interface UnitCatalogFilter {
  search?: string
  module_code?: string | 'all'
  status?: UnitCatalogStatus | 'all'
  department_id?: string
}

// =====================================================
// UNIT CATALOG ITEM TYPES
// =====================================================

export type CatalogItemType = 'drug' | 'non_drug'

export interface UnitCatalogItem extends BaseEntity {
  catalog_id: string
  hospital_id: string
  item_type: CatalogItemType
  drug_id?: string | null
  non_drug_id?: string | null
  is_active: boolean
  min_limit: number
  max_limit?: number | null
  last_updated_at?: string | null
  last_updated_by?: string | null
}

export interface UnitCatalogItemWithRelations extends UnitCatalogItem {
  drug?: Drug
  non_drug?: NonDrug
  last_updated_by_user?: User
  catalog?: UnitCatalog
}

export interface UnitCatalogItemFormData {
  item_type: CatalogItemType
  drug_id?: string | null
  non_drug_id?: string | null
  is_active: boolean
  min_limit: number
  max_limit?: number | null
}

export interface UnitCatalogWithItemCounts extends UnitCatalogWithRelations {
  drug_items_count?: number
  non_drug_items_count?: number
  active_drug_items_count?: number
  active_non_drug_items_count?: number
}

// =====================================================
// ACTIVITY LOG TYPES
// =====================================================

export interface PharmacyActivityLog extends BaseEntity {
  hospital_id: string
  user_id: string
  action: string
  module: string
  entity_type?: string
  entity_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
}

export interface PharmacyActivityLogWithRelations extends PharmacyActivityLog {
  user?: User
}

// =====================================================
// DASHBOARD TYPES
// =====================================================

export interface PharmacyDashboardStats {
  inventory: InventorySummary
  oxygen: OxygenSummary
  budget: BudgetSummary
  procurement: ProcurementSummary
  distribution: DistributionSummary
  alerts: PharmacyAlert[]
  recent_activities: PharmacyActivityLog[]
}

export interface PharmacyAlert {
  id: string
  type: 'critical' | 'warning' | 'info'
  category: 'stock' | 'expiry' | 'procurement' | 'budget' | 'oxygen' | 'system'
  title: string
  message: string
  link?: string
  timestamp: string
  is_read: boolean
}

// =====================================================
// FILTER & SEARCH TYPES
// =====================================================

export interface InventoryFilter {
  search?: string
  item_type?: 'drug' | 'non_drug' | 'all'
  category_id?: string
  location_id?: string
  status?: ItemStatus | 'all'
  stock_status?: 'in_stock' | 'low_stock' | 'critical' | 'out_of_stock' | 'all'
  is_controlled?: boolean
}

export interface ExpiryFilter {
  days_threshold?: number
  item_type?: 'drug' | 'non_drug' | 'all'
  location_id?: string
  status?: 'valid' | 'near_expiry' | 'expired' | 'all'
}

export interface ProcurementFilter {
  search?: string
  status?: POStatus | 'all'
  supplier_id?: string
  po_type?: POType | 'all' | 'po_only'
  vote_code?: string
  vote_activity?: string
  category?: string
  department?: string
  date_from?: string
  date_to?: string
}

export interface TransferFilter {
  search?: string
  status?: TransferStatus | 'all'
  transfer_type?: TransferType | 'all'
  priority?: 'low' | 'normal' | 'high' | 'urgent' | 'all'
  date_from?: string
  date_to?: string
}

// =====================================================
// FORM DATA TYPES
// =====================================================

export interface DrugFormData {
  drug_code: string
  drug_name: string
  generic_name?: string
  brand_name?: string
  dosage_form: DrugDosageForm
  strength?: string
  unit_of_measure: string
  category_id?: string
  is_controlled: boolean
  requires_prescription: boolean
  storage_conditions?: string
  min_stock_level: number
  max_stock_level?: number
  reorder_level?: number
  lead_time_days: number
}

export interface PurchaseOrderFormData {
  po_type?: POType
  supplier_id?: string // Made optional for Manual PO
  manual_supplier_name?: string;
  manual_supplier_address?: string;
  sq_suppliers?: string[]
  budget_id?: string
  vote_code?: string // Optional
  vote_activity?: string // Optional
  category?: string // Optional
  department?: string // Optional
  expected_delivery_date?: string
  payment_terms?: string
  delivery_address?: string
  notes?: string
  status?: POStatus
  kkm_contract_number?: string
  program_name?: string
  items: POItem[]
}

export interface POItem {
  item_type: 'drug' | 'non_drug' | 'manual'
  item_id?: string
  quantity: number
  unit_price: number
  packaging_description?: string
  item_name?: string
  item_code?: string
}

export interface GoodsReceiptFormData {
  po_id: string
  delivery_note_number?: string
  invoice_number?: string
  invoice_amount?: number
  notes?: string
  items: {
    po_item_id: string
    quantity_received: number
    quantity_accepted?: number
    quantity_rejected?: number
    batch_number?: string
    manufacturing_date?: string
    expiry_date?: string
    storage_location_id?: string
    rejection_reason?: string
    notes?: string
  }[]
}

export interface TransferRequestFormData {
  transfer_type: TransferType
  to_hospital_id?: string
  to_department_id?: string
  to_location_id?: string
  required_date?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  notes?: string
  items: {
    item_type: 'drug' | 'non_drug'
    item_id: string
    batch_id?: string
    quantity: number
  }[]
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
