-- Migration: Add Stock Reconciliation Menu to Medical Oxygen
-- Description: Inserts the Stock Reconciliation menu item under the Medical Oxygen parent menu.

DO $$
DECLARE
    v_parent_id UUID;
    v_reconciliation_id UUID;
BEGIN
    -- 1. Find the 'Medical Oxygen' parent menu
    -- We assume the label is 'Medical Oxygen'
    SELECT id INTO v_parent_id 
    FROM menus 
    WHERE label = 'Medical Oxygen' 
    LIMIT 1;

    IF v_parent_id IS NOT NULL THEN
        -- 2. Insert Stock Reconciliation Menu
        -- Path matches the route defined in routes.tsx: /pharmacy/medical-oxygen/reconciliation
        INSERT INTO menus (
            label, 
            path, 
            icon, 
            parent_id, 
            order_index, 
            is_core, 
            module_code,
            allowed_department_id
        ) VALUES (
            'Stock Reconciliation',
            '/pharmacy/medical-oxygen/reconciliation',
            'ClipboardCheck',
            v_parent_id,
            5, -- Position after Request/QR Gen
            true, -- Core module
            'pharmacy_management.stock', -- Use existing accessible module code
            NULL
        )
        ON CONFLICT (path) DO UPDATE SET
            label = EXCLUDED.label,
            icon = EXCLUDED.icon,
            parent_id = EXCLUDED.parent_id,
            module_code = EXCLUDED.module_code,
            is_core = EXCLUDED.is_core;
            
        RAISE NOTICE 'Stock Reconciliation menu added successfully.';
    ELSE
        RAISE WARNING 'Parent menu "Medical Oxygen" not found. Menu item not added.';
    END IF;
END $$;
