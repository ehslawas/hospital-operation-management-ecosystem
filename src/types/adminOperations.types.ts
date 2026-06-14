export interface AdminPurchaseOrder {
    id: string;
    hospital_id: string;
    order_number: string;
    supplier_id: string | null;
    order_date: string;
    expected_delivery_date: string | null;
    total_amount: number;
    status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'ordered' | 'completed' | 'cancelled';
    created_by: string;
    approved_by: string | null;
    approved_at: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    // Optional fields for template support
    vote_code?: string;
    vote_activity?: string;
    department?: string;
    category?: string;
    // Relationships
    supplier?: {
        id: string;
        company_name: string;
    };
    items?: AdminPurchaseOrderItem[];
}

export interface AdminPurchaseOrderItem {
    id: string;
    purchase_order_id: string;
    item_description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    specifications: string | null;
    created_at: string;
}

export interface AdminWarrant {
    id: string;
    hospital_id: string;
    warrant_date: string;
    document_no: string;
    // Legacy fields (for backward compatibility)
    vote_code: string;
    vote_activity: string;
    category: string;
    // New budget hierarchy fields
    program_code: string | null;
    objek_code: string | null;
    kategori_code: string | null;
    budget_group_id: string | null;
    fiscal_year: number;
    amount: number;
    description: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    // Relationships
    created_by_user?: {
        full_name: string;
        email: string;
    };
}

export interface AdminPurchaseOrderFormData {
    order_date: string;
    expected_delivery_date?: string;
    supplier_id?: string;
    items: {
        item_description: string;
        quantity: number;
        unit_price: number;
        specifications?: string;
    }[];
    notes?: string;
}

export interface AdminWarrantFormData {
    warrant_date: string;
    document_no: string;
    program_code: string;
    objek_code: string;
    kategori_code: string;
    amount: number;
    description?: string;
    fiscal_year?: number;
}

// ==========================================
// Budget Hierarchy Types
// ==========================================

export interface AdminWarrantProgram {
    id: string;
    program_code: string;
    program_name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AdminWarrantObjek {
    id: string;
    program_code: string;
    objek_code: string;
    objek_name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AdminWarrantKategori {
    id: string;
    program_code: string;
    objek_code: string;
    kategori_code: string;
    kategori_name: string;
    description: string | null;
    is_shared_budget: boolean;
    budget_group_code: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AdminWarrantBudgetGroup {
    id: string;
    hospital_id: string;
    program_code: string;
    objek_code: string;
    group_name: string;
    group_code: string;
    description: string | null;
    fiscal_year: number;
    allocated_amount: number;
    created_at: string;
    updated_at: string;
    // Computed fields (from service)
    spent_amount?: number;
    remaining_amount?: number;
}

export interface AdminWarrantAllocation {
    id: string;
    hospital_id: string;
    program_code: string;
    objek_code: string;
    kategori_code: string;
    fiscal_year: number;
    allocated_amount: number;
    created_by: string;
    created_at: string;
    updated_at: string;
    // Computed fields (from service)
    spent_amount?: number;
    remaining_amount?: number;
}

export interface AdminWarrantAllocationFormData {
    program_code: string;
    objek_code: string;
    kategori_code?: string; // Optional for budget groups
    budget_group_code?: string; // For shared budget groups
    fiscal_year: number;
    allocated_amount: number;
}

// ==========================================
// Summary Types
// ==========================================

export interface AdminWarrantSummary {
    total_allocation: number;
    total_expenses: number;
    total_balance: number;
    usage_percentage: number;
    fiscal_year: number;

    // Breakdown by program
    by_program: Array<{
        program_code: string;
        program_name: string;
        allocated: number;
        spent: number;
        balance: number;
        percentage: number;
    }>;

    // Breakdown by objek (within selected program)
    by_objek: Array<{
        program_code: string;
        objek_code: string;
        objek_name: string;
        allocated: number;
        spent: number;
        balance: number;
        percentage: number;
    }>;

    // Budget groups
    budget_groups: Array<{
        group_code: string;
        group_name: string;
        program_code: string;
        objek_code: string;
        allocated: number;
        spent: number;
        balance: number;
        percentage: number;
        kategoris: string[];
    }>;

    // Individual allocations (non-shared)
    individual_allocations: Array<{
        program_code: string;
        objek_code: string;
        kategori_code: string;
        kategori_name: string;
        allocated: number;
        spent: number;
        balance: number;
        percentage: number;
    }>;

    // Recent warrants
    recent_warrants: AdminWarrant[];
    total_count: number;
}

// ==========================================
// Admin Pembangunan Types
// ==========================================

export interface AdminPembangunan {
    id: string;
    hospital_id: string;
    document_no: string;
    pembangunan_date: string;
    fiscal_year: number;

    // Budget Classification
    program_code: string;
    objek_code: string;
    kategori_code: string;

    amount: number;
    description: string | null;

    created_by: string;
    created_at: string;
    updated_at: string;

    // Relationships
    created_by_user?: {
        full_name: string;
        email: string;
    };
}

export interface AdminPembangunanFormData {
    pembangunan_date: string;
    document_no: string;
    program_code: string;
    objek_code: string;
    kategori_code: string;
    amount: number;
    description?: string;
    fiscal_year?: number;
}

export interface AdminPembangunanProgram {
    program_code: string;
    program_name: string;
    description: string | null;
    is_active: boolean;
}

export interface AdminPembangunanObjek {
    program_code: string;
    objek_code: string;
    objek_name: string;
    description: string | null;
    is_active: boolean;
}

export interface AdminPembangunanKategori {
    program_code: string;
    objek_code: string;
    kategori_code: string;
    kategori_name: string;
    description: string | null;
    is_active: boolean;
}

export interface AdminPembangunanSummary {
    total_allocation: number;
    total_expenses: number;
    total_balance: number;
    usage_percentage: number;
    fiscal_year: number;

    // Breakdown by program
    by_program: Array<{
        program_code: string;
        program_name: string;
        allocated: number;
        spent: number;
        balance: number;
        percentage: number;
    }>;

    // Breakdown by objek
    by_objek: Array<{
        program_code: string;
        objek_code: string;
        objek_name: string;
        allocated: number;
        spent: number;
        balance: number;
        percentage: number;
    }>;

    recent_pembangunan: AdminPembangunan[];
    total_count: number;
}


// ==========================================
// Admin LPO Types
// ==========================================

export interface AdminLPO {
    id: string;
    hospital_id: string;
    lpo_number: string;
    purchase_order_id: string;
    lpo_date: string;
    document_date: string | null;
    status: 'pending' | 'verified' | 'sent' | 'received' | 'paid';
    pdf_url: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    // Relationships
    purchase_order?: AdminPurchaseOrder;
}

export interface AdminLPOFormData {
    purchase_order_id: string;
    lpo_date: string;
    document_date?: string;
}

// ==========================================
// Admin Receiving Types
// ==========================================

export interface AdminReceivingRecord {
    id: string;
    hospital_id: string;
    lpo_id: string;
    do_number: string;
    received_date: string;
    received_by: string;
    status: 'pending' | 'partial' | 'complete';
    notes: string | null;
    created_at: string;
    updated_at: string;
    // Relationships
    lpo?: AdminLPO;
    items?: AdminReceivingItem[];
}

export interface AdminReceivingItem {
    id: string;
    receiving_id: string;
    item_description: string;
    ordered_quantity: number;
    received_quantity: number;
    created_at: string;
}

export interface AdminReceivingFormData {
    lpo_id: string;
    do_number: string;
    received_date: string;
    items: {
        item_description: string;
        ordered_quantity: number;
        received_quantity: number;
    }[];
    notes?: string;
}

// ==========================================
// Admin Payment Types
// ==========================================

export interface AdminPayment {
    id: string;
    hospital_id: string;
    lpo_id: string;
    payment_date: string;
    payment_voucher_number: string; // Added to match usage
    payment_method: string;         // Added to match usage
    payment_reference: string;
    amount: number;
    notes: string | null;           // Added to match usage
    status: 'pending' | 'processing' | 'completed';
    created_by: string;
    created_at: string;
    updated_at: string;
    // Relationships
    lpo?: AdminLPO;
}

export interface AdminPaymentFormData {
    lpo_id: string;
    payment_voucher_number: string;
    payment_date: string;
    amount: number;
    payment_method: string;
    reference_number?: string;
    notes?: string;
    // legacy support if needed, but better to align
    payment_reference?: string;
}
