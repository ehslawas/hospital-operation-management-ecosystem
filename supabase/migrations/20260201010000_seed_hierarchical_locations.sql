-- Seed Hierarchical Locations for Pharmacy Logistics
-- Root: Pharmacy Logistic (Already exists ID: 84fa2b70-1fd5-4720-bdab-cb4f4dd7bd31)

DO $$ 
DECLARE
    v_hosp_id UUID := '85bb6adc-b868-428b-83f4-e5af2f5cf904';
    v_root_id UUID := '84fa2b70-1fd5-4720-bdab-cb4f4dd7bd31';
    v_ms_id UUID;
    v_da_id UUID;
    v_ms_amb_id UUID;
    v_ms_cold_id UUID;
    v_da_amb_id UUID;
    v_da_cold_id UUID;
BEGIN
    -- 1. Main Store
    INSERT INTO pharmacy_stock_locations (hospital_id, location_code, location_name, location_type, parent_location_id, is_active)
    VALUES (v_hosp_id, 'MS', 'Main Store', 'store', v_root_id, true)
    RETURNING id INTO v_ms_id;

    -- 1.1 Main Store Zones
    INSERT INTO pharmacy_stock_locations (hospital_id, location_code, location_name, location_type, parent_location_id, temperature_required, is_active)
    VALUES 
    (v_hosp_id, 'MS-AMB', 'Main Store - Ambient Zone', 'zone', v_ms_id, 'ambient', true) RETURNING id INTO v_ms_amb_id;
    
    INSERT INTO pharmacy_stock_locations (hospital_id, location_code, location_name, location_type, parent_location_id, temperature_required, is_active)
    VALUES 
    (v_hosp_id, 'MS-COLD', 'Main Store - Cold Storage', 'zone', v_ms_id, '2-8C', true) RETURNING id INTO v_ms_cold_id;

    -- 1.1.1 Main Store Shelves (Ambient)
    INSERT INTO pharmacy_stock_locations (hospital_id, location_code, location_name, location_type, parent_location_id, is_active)
    VALUES 
    (v_hosp_id, 'MS-SH-A', 'Shelf A (Drug)', 'shelf', v_ms_amb_id, true),
    (v_hosp_id, 'MS-SH-B', 'Shelf B (Non-Drug)', 'shelf', v_ms_amb_id, true);

    -- 1.1.2 Main Store Fridges (Cold)
    INSERT INTO pharmacy_stock_locations (hospital_id, location_code, location_name, location_type, parent_location_id, temperature_required, is_active)
    VALUES 
    (v_hosp_id, 'MS-F1', 'Fridge 1', 'fridge', v_ms_cold_id, '2-8C', true),
    (v_hosp_id, 'MS-F2', 'Fridge 2', 'fridge', v_ms_cold_id, '2-8C', true);

    -- 2. Decanting
    INSERT INTO pharmacy_stock_locations (hospital_id, location_code, location_name, location_type, parent_location_id, is_active)
    VALUES (v_hosp_id, 'DC', 'Decanting', 'store', v_root_id, true)
    RETURNING id INTO v_da_id;

    -- 2.1 Decanting Zones
    INSERT INTO pharmacy_stock_locations (hospital_id, location_code, location_name, location_type, parent_location_id, temperature_required, is_active)
    VALUES 
    (v_hosp_id, 'DC-AMB', 'Decanting - Ambient Zone', 'zone', v_da_id, 'ambient', true) RETURNING id INTO v_da_amb_id;
    
    INSERT INTO pharmacy_stock_locations (hospital_id, location_code, location_name, location_type, parent_location_id, temperature_required, is_active)
    VALUES 
    (v_hosp_id, 'DC-COLD', 'Decanting - Cold Storage', 'zone', v_da_id, '2-8C', true) RETURNING id INTO v_da_cold_id;

    -- 2.1.1 Decanting Shelves
    INSERT INTO pharmacy_stock_locations (hospital_id, location_code, location_name, location_type, parent_location_id, is_active)
    VALUES 
    (v_hosp_id, 'DC-SH-A', 'Shelf A (Drug)', 'shelf', v_da_amb_id, true),
    (v_hosp_id, 'DC-SH-B', 'Shelf B (Non-Drug)', 'shelf', v_da_amb_id, true);

    -- 2.1.2 Decanting Fridge
    INSERT INTO pharmacy_stock_locations (hospital_id, location_code, location_name, location_type, parent_location_id, temperature_required, is_active)
    VALUES 
    (v_hosp_id, 'DC-F1', 'Fridge 1', 'fridge', v_da_cold_id, '2-8C', true);

END $$;
