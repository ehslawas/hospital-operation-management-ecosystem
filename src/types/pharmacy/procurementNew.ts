import { BaseEntity, User } from '@/types'
import { PurchaseOrderWithRelations, Drug, NonDrug } from './index'

// =====================================================
// LPO TYPES
// =====================================================

export interface LPO extends BaseEntity {
    hospital_id: string
    po_id: string
    lpo_number: string
    document_date: string
    document_url?: string
    status: 'draft' | 'generated' | 'uploaded' | 'sent' | 'verified' | 'archived'
    created_by?: string
}

export interface LPOWithRelations extends LPO {
    purchase_order?: PurchaseOrderWithRelations
    created_by_user?: User
    tracking_items?: OrderTracking[] | { count: number }[]
    receiving_records?: Receiving[]
    payment?: Payment
    lou?: LOU
}

// =====================================================
// ORDER TRACKING TYPES
// =====================================================

export interface OrderTracking extends BaseEntity {
    lpo_id: string
    item_id: string
    item_type: 'drug' | 'non_drug'
    item_code: string
    item_category: 'APPL' | 'CC'

    expected_delivery_date: string
    actual_delivery_date?: string

    order_placed_date: string
    kkm_contract_number?: string
    tarikh_serahan?: string

    status: 'pending' | 'in_transit' | 'delivered' | 'overdue'
    is_overdue: boolean
    days_overdue: number

    last_reminder_sent?: string
    reminder_count: number

    delivery_duration_days?: number
}

export interface OrderTrackingWithRelations extends OrderTracking {
    lpo?: LPOWithRelations
    drug?: Drug
    non_drug?: NonDrug
    penalties?: Penalty[]
}

// =====================================================
// RECEIVING TYPES
// =====================================================

export interface Receiving extends BaseEntity {
    lpo_id: string
    receiving_date: string
    receiving_type: 'full' | 'partial'

    do_document_url?: string
    invoice_document_url?: string

    status: 'pending' | 'verified' | 'completed'
    is_fully_received: boolean

    received_by?: string
    verified_by?: string
    notes?: string
}

export interface ReceivingItem extends BaseEntity {
    receiving_id: string
    lpo_item_id: string
    item_id: string
    item_type: 'drug' | 'non_drug'

    ordered_quantity: number
    received_quantity: number
    outstanding_quantity: number

    batch_number?: string
    expiry_date?: string
    storage_location?: string
    qr_code?: string

    is_fully_received: boolean
}

export interface CreditNote extends BaseEntity {
    lpo_id: string
    receiving_id?: string
    issue_date: string
    reason: string
    credit_amount: number
    status: 'pending' | 'approved' | 'applied'
    created_by?: string
}

// =====================================================
// PAYMENT TYPES
// =====================================================

export interface Payment extends BaseEntity {
    lpo_id: string
    lpo_number: string
    payment_amount: number
    payment_issued_date?: string
    payment_received_date?: string
    payment_method?: string
    payment_reference?: string
    status: 'pending' | 'issued' | 'received' | 'completed'
    data_source: 'manual' | 'scraped'
    scraped_at?: string
    notes?: string
}

// =====================================================
// PENALTY TYPES
// =====================================================

export interface Penalty extends BaseEntity {
    lpo_id: string
    order_tracking_id: string
    days_overdue: number
    penalty_rate?: number
    penalty_amount: number
    penalty_notice_url?: string
    penalty_paid: boolean
    payment_method?: string
    payment_date?: string
    payment_reference?: string
    status: 'pending' | 'issued' | 'paid' | 'waived'
    email_sent_at?: string
    email_sent_to?: string
    notes?: string
}

// =====================================================
// LOU TYPES
// =====================================================

export interface LOU extends BaseEntity {
    lpo_id: string
    receiving_id: string
    requires_lou: boolean
    lou_reason?: string
    lou_letter_url?: string
    merged_pdf_url?: string
    email_sent_at?: string
    email_sent_to?: string
    status: 'pending' | 'generated' | 'sent' | 'acknowledged'
}

// =====================================================
// LPO EXTRACTION TYPES
// =====================================================


export interface ExtractedLPOItem {
    itemCode?: string
    itemName: string
    quantity: number
    unitPrice: number
    amount: number
}

export interface ExtractedLPOData {
    documentNumber: string       // e.g., "CO260000000028505"
    documentDate: string        // e.g., "2026-01-09"
    supplierName: string        // e.g., "LF MERU SDN BHD"
    supplierAddress?: string
    contractNumber?: string     // e.g., "KKM.S.400-10/3/3101-20"
    ptjCode?: string            // e.g., "42152701"
    voteCode?: string           // e.g., "080702"
    voteActivity?: string       // e.g., "27401"
    documentControlNumber?: string // No. Dokumen Kawalan
    items: ExtractedLPOItem[]
    totalAmount: number
    confidence: number          // Extraction confidence 0-100
    rawText?: string           // Original extracted text for debugging
}

export interface LPOMatchResult {
    extractedData: ExtractedLPOData
    matchedPO?: PurchaseOrderWithRelations
    confidenceScore: number
    matchReasons: string[]
    alternativePOs?: PurchaseOrderWithRelations[]
}
