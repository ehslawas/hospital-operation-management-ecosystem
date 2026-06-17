import { BaseEntity } from './base'

export type PRStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'ordered'
export type POStatus = 'draft' | 'sent' | 'partial' | 'completed' | 'cancelled'
export type GRStatus = 'pending_inspection' | 'accepted' | 'partial' | 'rejected'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface PurchaseRequisition extends BaseEntity {
  pr_number: string
  hospital_id: string
  department_id: string
  requested_by: string
  request_date: string
  required_date?: string
  priority: Priority
  status: PRStatus
  approved_by?: string
  approved_at?: string
  notes?: string
  total_estimated_cost?: number
}

export interface PurchaseRequisitionItem extends BaseEntity {
  pr_id: string
  product_id: string
  quantity_requested: number
  quantity_approved?: number
  estimated_unit_price?: number
  notes?: string
}

export interface PurchaseOrder extends BaseEntity {
  po_number: string
  pr_id?: string
  supplier_id: string
  hospital_id: string
  order_date: string
  expected_delivery_date?: string
  status: POStatus
  total_amount?: number
  payment_terms?: string
  delivery_address?: string
  notes?: string
  created_by: string
  approved_by?: string
}

export interface PurchaseOrderItem extends BaseEntity {
  po_id: string
  product_id: string
  quantity_ordered: number
  quantity_received: number
  unit_price: number
  total_price: number
}

export interface GoodsReceipt extends BaseEntity {
  gr_number: string
  po_id: string
  hospital_id: string
  receipt_date: string
  received_by: string
  delivery_note_number?: string
  invoice_number?: string
  status: GRStatus
  notes?: string
}

export interface GoodsReceiptItem extends BaseEntity {
  gr_id: string
  po_item_id: string
  product_id: string
  quantity_received: number
  quantity_accepted?: number
  quantity_rejected: number
  batch_number?: string
  expiry_date?: string
  storage_location_id?: string
  rejection_reason?: string
}
