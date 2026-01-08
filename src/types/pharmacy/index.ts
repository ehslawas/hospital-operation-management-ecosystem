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

export type POType = 'regular' | 'lpo' | 'emergency'

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

export type OxygenCylinderStatus = 'full' | 'empty' | 'in_use' | 'maintenance' | 'disposed'
export type OxygenCylinderType = 'B' | 'D' | 'E' | 'M' | 'G' | 'K' | 'T'

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
}

export interface NonDrugWithRelations extends NonDrug {
  category?: NonDrugCategory
  hospital?: Hospital
  supplier?: Supplier
  current_stock?: number
  stock_status?: 'in_stock' | 'low_stock' | 'critical' | 'out_of_stock'
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

export interface OxygenCylinderTypeInfo extends BaseEntity {
  type_code: OxygenCylinderType
  type_name: string
  capacity_liters: number
  weight_kg?: number
  description?: string
}

export interface OxygenCylinder extends BaseEntity {
  hospital_id: string
  serial_number: string
  type_id: string
  status: OxygenCylinderStatus
  current_location_id?: string
  assigned_ward_id?: string
  last_fill_date?: string
  next_maintenance_date?: string
  certification_expiry?: string
  supplier_id?: string
  notes?: string
}

export interface OxygenCylinderWithRelations extends OxygenCylinder {
  type_info?: OxygenCylinderTypeInfo
  current_location?: StockLocation
  assigned_ward?: Department
  supplier?: Supplier
}

export interface OxygenConsumption extends BaseEntity {
  hospital_id: string
  cylinder_id?: string
  department_id: string
  consumption_date: string
  quantity_used: number
  unit: 'liters' | 'cylinders'
  recorded_by: string
  notes?: string
}

export interface OxygenConsumptionWithRelations extends OxygenConsumption {
  cylinder?: OxygenCylinder
  department?: Department
  recorded_by_user?: User
}

export interface OxygenSummary {
  total_cylinders: number
  full_cylinders: number
  empty_cylinders: number
  in_use_cylinders: number
  maintenance_cylinders: number
  cylinders_by_type: { type: OxygenCylinderType; count: number }[]
  daily_consumption: number
  monthly_consumption: number
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
  created_by?: string
}

export interface APPLExpenseWithRelations extends APPLExpense {
  warrant?: Warrant
  purchase_order?: PurchaseOrder
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
  created_by?: string
}

export interface CCExpenseWithRelations extends CCExpense {
  warrant?: Warrant
  purchase_order?: PurchaseOrder
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
  item_type: 'drug' | 'non_drug'
  item_id: string
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

export interface Contract extends BaseEntity {
  contract_number: string
  contract_name: string
  contract_type: ContractType
  supplier_id?: string
  start_date: string
  end_date: string
  total_value?: number
  status: ContractStatus
  document_url?: string
}

export interface ContractWithRelations extends Contract {
  supplier?: Supplier
  items?: ContractItem[]
}

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
  po_type?: POType | 'all'
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
  supplier_id: string
  budget_id?: string
  vote_code: string // Required: 080702 or 990102
  vote_activity: string // Required: 27401, 27499, 27404, 27403, 27402, 27501
  category: string // Required: drug, non_drug, non_standard, reagent, vaccine, insulin, hepc, medical_oxygen
  department: string // Required: department code
  expected_delivery_date?: string
  payment_terms?: string
  delivery_address?: string
  notes?: string
  items: {
    item_type: 'drug' | 'non_drug'
    item_id: string
    quantity: number
    unit_price: number
    packaging_description?: string
  }[]
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

