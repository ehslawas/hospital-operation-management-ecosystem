import { BaseEntity, User } from '@/types'
import { PurchaseOrderWithRelations, Drug, NonDrug } from './index'

export interface LPOReminder extends BaseEntity {
    lpo_id: string
    sent_at: string
    sent_by?: string
    recipient_email?: string
    recipient_name?: string
    pdf_url?: string
    reminder_number: number
}

// =====================================================
// LPO TYPES
// =====================================================

export interface LPO extends BaseEntity {
    hospital_id: string
    po_id: string
    lpo_number: string
    document_date: string
    document_url?: string
    expected_delivery_date?: string
    status: 'draft' | 'generated' | 'uploaded' | 'sent' | 'verified' | 'archived'
    payment_status?: 'pending' | 'sent_for_payment' | 'paid'
    sent_for_payment_date?: string
    created_by?: string
}

export interface LPOWithRelations extends LPO {
    purchase_order?: PurchaseOrderWithRelations
    created_by_user?: User
    tracking_items?: OrderTracking[] | { count: number }[]
    receiving_records?: Receiving[]
    reminders?: LPOReminder[]
    payment?: Payment
    lou?: LOU
    sent_for_payment_date?: string
}

// =====================================================
// ORDER TRACKING TYPES
// =====================================================

export interface OrderTracking extends BaseEntity {
    lpo_id: string
    item_id: string
    item_type: 'drug' | 'non_drug'
    item_code: string
    item_name?: string
    unit_price?: number
    item_category: 'APPL' | 'CC'

    expected_delivery_date: string
    actual_delivery_date?: string

    order_placed_date: string
    kkm_contract_number?: string
    tarikh_serahan?: string

    status: 'pending' | 'in_transit' | 'received' | 'delivered' | 'overdue'
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

export interface ReceivingDocument extends BaseEntity {
    receiving_id: string
    do_number?: string
    do_document_url?: string
    uploaded_at?: string
}

export interface Receiving extends BaseEntity {
    lpo_id: string
    receiving_date: string
    receiving_type: 'full' | 'partial'

    do_document_url?: string // @deprecated use documents array
    invoice_document_url?: string

    documents?: ReceivingDocument[]
    has_missing_details?: boolean
    missing_details_completed_at?: string

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
    manufactured_date?: string
    expiry_date?: string
    storage_location?: string
    qr_code?: string
    requires_lou?: boolean

    is_fully_received: boolean
    is_late?: boolean
    days_late?: number
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

    // Payment Details
    payment_issued_date?: string
    payment_received_date?: string
    payment_keyed_date?: string

    // Manual Input Fields
    payment_method?: string
    payment_reference?: string
    egrn_number?: string
    invoice_number?: string
    phis_status?: 'pending' | 'paid'

    status: 'pending' | 'issued' | 'received' | 'completed'
    data_source: 'manual' | 'scraped'
    scraped_at?: string
    notes?: string
}

// =====================================================
// PENALTY TYPES
// =====================================================

export type PenaltyType = 'appl' | 'cc'

export interface PerformanceStandard extends BaseEntity {
    hospital_id?: string
    code: string // e.g., PS01, PS02
    description_bm: string // Malay description
    description_en?: string // English description
    penalty_formula: string // Formula description
    penalty_type: 'percentage' | 'fixed' | 'per_incident' | 'per_day' | 'custom'
    penalty_rate?: number // e.g., 0.015 for 1.5%
    fixed_amount?: number // e.g., 500.00
    is_active: boolean
    sort_order: number
}

export interface PenaltyCertification {
    user_id?: string
    name: string
    designation: string
    date: string
    signature_url?: string
}

export interface Penalty extends BaseEntity {
    lpo_id: string
    order_tracking_id?: string
    receiving_id?: string
    receiving_item_id?: string

    // Item details
    item_id?: string
    item_name?: string
    item_code?: string
    item_type?: string
    quantity?: number
    unit_price?: number

    // Calculation fields
    days_overdue?: number
    days_late?: number
    penalty_rate?: number
    penalty_amount: number
    total_order_value?: number
    failed_product_value?: number

    // Penalty classification
    penalty_type: PenaltyType // 'appl' or 'cc'
    performance_standards_violated?: string[] // Array of standard IDs

    // Document fields
    penalty_notice_url?: string
    penalty_pdf_url?: string

    // Certification fields (for APPL LAMPIRAN 9)
    prepared_by_user_id?: string
    prepared_by_name?: string
    prepared_by_designation?: string
    prepared_at?: string
    prepared_signature_url?: string

    verified_by_user_id?: string
    verified_by_name?: string
    verified_by_designation?: string
    verified_at?: string
    verified_signature_url?: string

    // Supplier acknowledgment
    supplier_acknowledged_at?: string
    supplier_signature_url?: string
    supplier_signatory_name?: string
    supplier_signatory_designation?: string

    // Payment fields
    penalty_paid: boolean
    payment_method?: string
    payment_date?: string
    payment_reference?: string
    payment_kaedah?: 1 | 2 // 1 = Potongan, 2 = Cek

    // Status and communication
    status: 'pending' | 'approved' | 'issued' | 'paid' | 'waived'
    email_sent_at?: string
    email_sent_to?: string
    notes?: string
    waiver_reason?: string
    approved_by?: string
    approved_at?: string
}

// =====================================================
// LOU TYPES
// =====================================================

export interface LOUItem extends BaseEntity {
    lou_id: string
    receiving_item_id: string

    // Core details
    item_id: string
    item_name: string
    item_code: string
    item_type: 'drug' | 'non_drug'

    // Tracking details
    po_number?: string
    lpo_number?: string
    do_number?: string
    batch_number?: string
    expiry_date?: string
    manufactured_date?: string

    quantity_received: number
    status: 'pending' | 'resolved' | 'acknowledged'
}

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

    // New fields
    po_number?: string
    lpo_number?: string
    do_numbers?: string[]
    items_count?: number
    supplier_name?: string

    items?: LOUItem[] // Relations
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
