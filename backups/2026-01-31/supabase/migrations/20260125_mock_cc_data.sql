-- Migration: Seed Mock CC Penalty Data (Fixed v2)
-- Date: 2026-01-25
-- Description: Inserts a mock CC penalty record for testing with corrected table names and required fields

-- 1. Ensure columns exist (Safeguard)
ALTER TABLE pharmacy_penalties ADD COLUMN IF NOT EXISTS kkm_contract_number TEXT;
ALTER TABLE pharmacy_penalties ADD COLUMN IF NOT EXISTS tarikh_serahan TIMESTAMPTZ;
ALTER TABLE pharmacy_penalties ADD COLUMN IF NOT EXISTS calculated_penalty_amount DECIMAL(12,2);
ALTER TABLE pharmacy_penalties ADD COLUMN IF NOT EXISTS minimum_penalty_amount DECIMAL(12,2) DEFAULT 200.00;
ALTER TABLE pharmacy_penalties ADD COLUMN IF NOT EXISTS selected_penalty_type TEXT CHECK (selected_penalty_type IN ('calculated', 'minimum'));
ALTER TABLE pharmacy_penalties ADD COLUMN IF NOT EXISTS item_name TEXT;
ALTER TABLE pharmacy_penalties ADD COLUMN IF NOT EXISTS item_code TEXT;
ALTER TABLE pharmacy_penalties ADD COLUMN IF NOT EXISTS quantity INTEGER;
ALTER TABLE pharmacy_penalties ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2);
ALTER TABLE pharmacy_penalties ADD COLUMN IF NOT EXISTS penalty_letter_url TEXT;
ALTER TABLE pharmacy_penalties ADD COLUMN IF NOT EXISTS calculation_sheet_url TEXT;

-- 2. Insert Mock Data
DO $$
DECLARE
    v_hospital_id UUID;
    v_supplier_id UUID;
    v_po_id UUID;
    v_lpo_id UUID;
    v_tracking_id UUID;
BEGIN
    -- A. Get a Hospital ID (Required for LPO and PO)
    SELECT id INTO v_hospital_id FROM hospitals LIMIT 1;
    
    IF v_hospital_id IS NULL THEN
        RAISE EXCEPTION 'No hospital found in hospitals table. Please create a hospital first.';
    END IF;

    -- B. Create/Get Mock Supplier
    SELECT id INTO v_supplier_id FROM suppliers WHERE company_name = 'M.S ALLY PHARMA SDN.BHD (MOCK)';
    
    IF v_supplier_id IS NULL THEN
        INSERT INTO suppliers (hospital_id, supplier_code, company_name, address, phone, email, status)
        VALUES (
            v_hospital_id,
            'SUP-MOCK-CC-01', -- Added missing mandatory supplier_code
            'M.S ALLY PHARMA SDN.BHD (MOCK)', 
            'Lorong 5, Jalan Kilang, 93450 Kuching, Sarawak', 
            '082-123456', 
            'mock@msally.com',
            'active'
        )
        RETURNING id INTO v_supplier_id;
    END IF;

    -- C. Create Purchase Order (CC Vote Code: 080702)
    INSERT INTO pharmacy_purchase_orders (
        hospital_id,
        supplier_id, 
        po_number, 
        po_type,
        vote_code, 
        status, 
        order_date,
        created_at
    )
    VALUES (
        v_hospital_id,
        v_supplier_id, 
        'PO-CC-MOCK-2025-01', 
        'cc', 
        '080702', 
        'approved', 
        CURRENT_DATE - INTERVAL '60 days',
        NOW() - INTERVAL '60 days'
    )
    RETURNING id INTO v_po_id;

    -- D. Create LPO
    INSERT INTO pharmacy_lpo (
        hospital_id,
        po_id, 
        lpo_number, 
        document_date, 
        status
    )
    VALUES (
        v_hospital_id,
        v_po_id, 
        'LPO-CC-MOCK-001', 
        CURRENT_DATE - INTERVAL '60 days', 
        'generated'
    )
    RETURNING id INTO v_lpo_id;

    -- E. Create Order Tracking (Overdue Item)
    INSERT INTO pharmacy_order_tracking (
        lpo_id, 
        item_id,
        item_type,
        item_code, 
        item_category,
        expected_delivery_date, 
        actual_delivery_date,
        order_placed_date,
        status, 
        is_overdue, 
        days_overdue
    )
    VALUES (
        v_lpo_id, 
        '00000000-0000-0000-0000-000000000000'::UUID, -- Mock ID
        'drug',
        'DDR10', 
        'CC',
        CURRENT_DATE - INTERVAL '40 days', 
        CURRENT_DATE - INTERVAL '10 days', 
        CURRENT_DATE - INTERVAL '60 days',
        'delivered', 
        true, 
        30
    )
    RETURNING id INTO v_tracking_id;

    -- F. Create Penalty Record
    INSERT INTO pharmacy_penalties (
        lpo_id, 
        order_tracking_id, 
        days_overdue, 
        penalty_amount, 
        status,
        kkm_contract_number, 
        tarikh_serahan, 
        calculated_penalty_amount, 
        minimum_penalty_amount, 
        selected_penalty_type,
        item_name, 
        item_code, 
        quantity, 
        unit_price
    )
    VALUES (
        v_lpo_id, 
        v_tracking_id, 
        30, 
        200.00, 
        'issued',
        'KKM-3446/2024/F(U)', 
        CURRENT_DATE - INTERVAL '40 days', 
        44.20 * 10 * (30.0/30.0) * 0.10, 
        200.00, 
        'minimum',
        'DYDROGESTERONE 10MG TABLET', 
        'DDR10', 
        10, 
        44.20
    );

END $$;
