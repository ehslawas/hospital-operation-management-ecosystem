-- Migration: Seed Mock Penalty Data (v3 - For Testing)
-- Date: 2026-01-25
-- Description: Inserts pending penalties for both APPL and CC to test the UI workflow

DO $$
DECLARE
    v_hospital_id UUID;
    v_supplier_id UUID;
    v_po_appl_id UUID;
    v_lpo_appl_id UUID;
    v_tracking_appl_id UUID;
    v_po_cc_id UUID;
    v_lpo_cc_id UUID;
    v_tracking_cc_id UUID;
BEGIN
    -- 1. Get Hospital (Default)
    SELECT id INTO v_hospital_id FROM hospitals LIMIT 1;
    IF v_hospital_id IS NULL THEN
        RAISE EXCEPTION 'No hospital found.';
    END IF;

    -- 2. Get/Create Mock Supplier
    SELECT id INTO v_supplier_id FROM suppliers WHERE company_name = 'TEST SUPPLIER SDN. BHD.';
    IF v_supplier_id IS NULL THEN
        INSERT INTO suppliers (hospital_id, supplier_code, company_name, address, phone, email, status)
        VALUES (v_hospital_id, 'SUP-TEST-001', 'TEST SUPPLIER SDN. BHD.', '123 Test Street', '03-12345678', 'test@supplier.com', 'active')
        RETURNING id INTO v_supplier_id;
    END IF;

    -- ==========================================
    -- SCENARIO A: APPL PENALTY (Vote 990102)
    -- ==========================================
    
    -- A1. Create PO (APPL)
    INSERT INTO pharmacy_purchase_orders (hospital_id, supplier_id, po_number, po_type, vote_code, status, order_date)
    VALUES (v_hospital_id, v_supplier_id, 'PO-APPL-TEST-01', 'appl', '990102', 'approved', CURRENT_DATE - INTERVAL '30 days')
    RETURNING id INTO v_po_appl_id;

    -- A2. Create LPO
    INSERT INTO pharmacy_lpo (hospital_id, po_id, lpo_number, document_date, status)
    VALUES (v_hospital_id, v_po_appl_id, 'LPO-APPL-TEST-01', CURRENT_DATE - INTERVAL '30 days', 'generated')
    RETURNING id INTO v_lpo_appl_id;

    -- A3. Create Tracking Item (Overdue)
    INSERT INTO pharmacy_order_tracking (lpo_id, item_id, item_type, item_code, item_category, expected_delivery_date, order_placed_date, status, is_overdue, days_overdue)
    VALUES (v_lpo_appl_id, '00000000-0000-0000-0000-000000000000', 'drug', 'APPL-DRUG-01', 'APPL', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '30 days', 'delayed', true, 10)
    RETURNING id INTO v_tracking_appl_id;

    -- A4. Create Penalty (PENDING)
    INSERT INTO pharmacy_penalties (lpo_id, order_tracking_id, days_overdue, penalty_amount, status, item_name, item_code, quantity, unit_price, total_order_value)
    VALUES (
        v_lpo_appl_id, 
        v_tracking_appl_id, 
        10, 
        50.00, -- Initial estimated amount
        'pending', -- IMPORTANT: Pending for testing
        'PARACETAMOL 500MG TABLET', 
        'APPL-DRUG-01', 
        1000, 
        0.50,
        500.00
    );

    -- ==========================================
    -- SCENARIO B: CC PENALTY (Vote 080702)
    -- ==========================================

    -- B1. Create PO (CC)
    INSERT INTO pharmacy_purchase_orders (hospital_id, supplier_id, po_number, po_type, vote_code, status, order_date)
    VALUES (v_hospital_id, v_supplier_id, 'PO-CC-TEST-01', 'cc', '080702', 'approved', CURRENT_DATE - INTERVAL '40 days')
    RETURNING id INTO v_po_cc_id;

    -- B2. Create LPO
    INSERT INTO pharmacy_lpo (hospital_id, po_id, lpo_number, document_date, status)
    VALUES (v_hospital_id, v_po_cc_id, 'LPO-CC-TEST-01', CURRENT_DATE - INTERVAL '40 days', 'generated')
    RETURNING id INTO v_lpo_cc_id;

    -- B3. Create Tracking Item
    INSERT INTO pharmacy_order_tracking (lpo_id, item_id, item_type, item_code, item_category, expected_delivery_date, order_placed_date, status, is_overdue, days_overdue)
    VALUES (v_lpo_cc_id, '00000000-0000-0000-0000-000000000000', 'drug', 'CC-DRUG-01', 'CC', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '40 days', 'delivered', true, 15)
    RETURNING id INTO v_tracking_cc_id;

    -- B4. Create Penalty (PENDING)
    INSERT INTO pharmacy_penalties (
        lpo_id, 
        order_tracking_id, 
        days_overdue, 
        penalty_amount, 
        status, 
        kkm_contract_number,
        item_name, 
        item_code, 
        quantity, 
        unit_price
    )
    VALUES (
        v_lpo_cc_id, 
        v_tracking_cc_id, 
        15, 
        200.00, -- Minimum amount
        'pending', 
        'KKM-CONTRACT-TEST-01',
        'DYDROGESTERONE 10MG TABLET', 
        'CC-DRUG-01', 
        50, 
        44.20
    );

END $$;
