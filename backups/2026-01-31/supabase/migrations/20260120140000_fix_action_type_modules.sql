-- Standardize Action Types
-- 1. Ensure 'module' column exists and has proper values
-- 2. Consolidate redundant PO action types
-- 3. Set modules for clinical types

DO $$ 
BEGIN
    -- Fix 'purchase_order' typo/redundancy from 102_seed
    -- Move any workflows pointing to 'purchase_order' to 'purchase_order_create'
    UPDATE public.approval_workflows 
    SET action_type_id = (SELECT id FROM public.action_types WHERE type_code = 'purchase_order_create')
    WHERE action_type_id = (SELECT id FROM public.action_types WHERE type_code = 'purchase_order');

    -- Delete the redundant code
    DELETE FROM public.action_types WHERE type_code = 'purchase_order';

    -- Ensure all clinical types have a module label
    UPDATE public.action_types SET module = 'clinical' WHERE type_code IN ('prescription', 'patient_discharge');
    
    -- Ensure stock adjustment and other pharmacy types are correctly labeled
    UPDATE public.action_types SET module = 'pharmacy' WHERE type_code IN ('stock_adjustment', 'supplier_return', 'drug_request_approve', 'oxygen_cylinder_issue');
    
    -- Ensure admin types are correctly labeled
    UPDATE public.action_types SET module = 'admin' WHERE type_code IN ('memo_publish', 'access_request_approve', 'sensitive_data_access', 'user_role_change');

    -- Fix any NULL modules to 'system'
    UPDATE public.action_types SET module = 'system' WHERE module IS NULL;
END $$;
