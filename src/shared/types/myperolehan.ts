// src/shared/types/myperolehan.ts
// Domain Types for Hospital Administrator Procurement & Budget System

export type BudgetType = 'warrant' | 'pembangunan'

export type POStatus = 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'completed' | 'cancelled'

export type LPOStatus = 'generated' | 'sent' | 'received' | 'completed' | 'cancelled'

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'void'

export interface AdminProgram {
  id: string
  hospital_id: string
  code: string // '020200' | '022300' | 'P42'
  label: string
  description?: string
  budget_type: BudgetType
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface AdminObjek {
  id: string
  hospital_id: string
  program_id: string
  code: string // e.g. '22000', '24000', '25000', '01100 117 4002'
  label: string
  description?: string
  is_active: boolean
  program?: AdminProgram
  created_at?: string
  updated_at?: string
}

export interface AdminKategori {
  id: string
  hospital_id: string
  objek_id: string
  code: string // e.g. '24699', '24000-GA', '28000,29000'
  label: string
  description?: string
  is_shared_budget: boolean
  budget_group_code?: string | null
  is_active: boolean
  objek?: AdminObjek
  created_at?: string
  updated_at?: string
}

export interface AdminWarrant {
  id: string
  hospital_id: string
  warrant_date: string
  document_no: string
  vote_code: string
  vote_activity: string
  category: string
  amount: number
  description?: string
  created_by: string
  created_at?: string
  updated_at?: string
  program_code?: string
  objek_code?: string
  kategori_code?: string
  budget_group_id?: string | null
  fiscal_year: number
}

export interface AdminPembangunan {
  id: string
  hospital_id: string
  document_no: string
  pembangunan_date: string
  fiscal_year: number
  program_code: string
  objek_code: string
  kategori_code: string
  amount: number
  description?: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface AdminSupplier {
  id: string
  hospital_id: string
  supplier_code?: string
  company_name: string
  address?: string
  contact_person?: string
  contact_person_phone?: string
  email?: string
  status: 'active' | 'inactive'
  account_document_url?: string
  mof_certificate_url?: string
  bumiputera_certificate_url?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface AdminPerihalItem {
  id: string
  hospital_id: string
  program_code: string
  objek_code: string
  kategori_code: string
  perihal_name: string
  description?: string
  unit_price: number
  unit?: string
  meal_session?: string | null
  is_active: boolean
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface AdminPurchaseOrderItem {
  id?: string
  purchase_order_id?: string
  perihal_id?: string
  item_description: string
  quantity: number
  unit_price: number
  total_price: number
  specifications?: string
  program_code?: string
  objek_code?: string
  kategori_code?: string
  unit?: string
  created_at?: string
}

export interface AdminPurchaseOrder {
  id: string
  hospital_id: string
  order_number: string
  supplier_id?: string
  order_date: string
  expected_delivery_date?: string
  total_amount: number
  status: POStatus
  created_by: string
  approved_by?: string
  approved_at?: string
  notes?: string
  program_code: string
  objek_code: string
  kategori_code: string
  budget_type: BudgetType
  fiscal_year: number
  created_at?: string
  updated_at?: string
  supplier?: AdminSupplier
  items?: AdminPurchaseOrderItem[]
  creator?: { full_name?: string; email?: string }
  approver?: { full_name?: string; email?: string }
}

export interface AdminLPO {
  id: string
  hospital_id: string
  lpo_number: string
  purchase_order_id: string
  lpo_date: string
  document_date?: string
  status: LPOStatus
  pdf_url?: string
  created_by: string
  created_at?: string
  updated_at?: string
  purchase_order?: AdminPurchaseOrder
}

export interface AdminReceivingItem {
  id?: string
  receiving_id?: string
  item_description: string
  ordered_quantity: number
  received_quantity: number
}

export interface AdminReceivingRecord {
  id: string
  hospital_id: string
  lpo_id: string
  do_number?: string
  received_date: string
  received_by: string
  status: 'received' | 'partial' | 'rejected'
  notes?: string
  created_at?: string
  updated_at?: string
  items?: AdminReceivingItem[]
  lpo?: AdminLPO
}

export interface AdminPayment {
  id: string
  hospital_id: string
  lpo_id: string
  payment_date: string
  payment_reference?: string
  amount: number
  status: PaymentStatus
  created_by: string
  created_at?: string
  updated_at?: string
  lpo?: AdminLPO
}

export interface BudgetHierarchySummary {
  programCode: string
  programLabel: string
  budgetType: BudgetType
  totalAllocated: number
  committedAmount: number
  actualSpent: number
  remainingBalance: number
  utilizationRate: number
  objekSummaries: {
    objekCode: string
    objekLabel: string
    totalAllocated: number
    committedAmount: number
    actualSpent: number
    remainingBalance: number
    utilizationRate: number
    kategoriSummaries: {
      kategoriCode: string
      kategoriLabel: string
      isShared: boolean
      budgetGroupCode?: string | null
      totalAllocated: number
      committedAmount: number
      actualSpent: number
      remainingBalance: number
      utilizationRate: number
    }[]
  }[]
}

export interface OverallPerolehanKPIs {
  totalAllocatedPengurusan: number
  totalAllocatedPembangunan: number
  totalAllocatedGrand: number
  totalCommitted: number
  totalActualSpent: number
  totalNetBalance: number
  overallUtilizationRate: number
  activePOCount: number
  pendingApprovalCount: number
  totalSuppliersCount: number
  fiscalYear: number
}
