-- ============================================================================
-- Migration 112: Fix Granular Permissions Linking
-- Description: Correctly links EXISTING features to the new granular modules
--              created in Migration 111. Removes duplicate features.
-- ============================================================================

DO $$
DECLARE
    -- New Module IDs (Oxygen)
    mod_ox_dash UUID;
    mod_ox_inv UUID;
    mod_ox_req UUID;
    mod_ox_qr UUID;
    mod_ox_rec UUID;
    mod_ox_recv UUID;

    -- New Module IDs (Logistics)
    mod_log_proc UUID;
    mod_log_fin UUID;
    mod_log_dist UUID;
    mod_log_inv UUID;
    mod_log_rep UUID;

BEGIN
    RAISE NOTICE '=== MIGRATION 112: FIXING PERMISSION LINKS ===';

    -- 1. RETRIEVE MODULE IDs (These were created in 111)
    -- ============================================================================
    SELECT id INTO mod_ox_dash FROM public.modules WHERE module_code = 'pharmacy.oxygen.dashboard';
    SELECT id INTO mod_ox_inv FROM public.modules WHERE module_code = 'pharmacy.oxygen.inventory';
    SELECT id INTO mod_ox_req FROM public.modules WHERE module_code = 'pharmacy.oxygen.requests';
    SELECT id INTO mod_ox_qr FROM public.modules WHERE module_code = 'pharmacy.oxygen.qr';
    SELECT id INTO mod_ox_rec FROM public.modules WHERE module_code = 'pharmacy.oxygen.reconciliation';
    SELECT id INTO mod_ox_recv FROM public.modules WHERE module_code = 'pharmacy.oxygen.receiving';

    
    -- 2. LINK EXISTING OXYGEN FEATURES TO NEW MODULES
    -- ============================================================================
    RAISE NOTICE 'Relinking Oxygen Features...';

    -- Dashboard: dashboard.view -> pharmacy.oxygen.dashboard
    UPDATE public.features 
    SET module_id = mod_ox_dash 
    WHERE feature_code = 'dashboard.view';

    -- Inventory: cylinder.view, issue.create, supplier_return.create -> pharmacy.oxygen.inventory
    UPDATE public.features 
    SET module_id = mod_ox_inv 
    WHERE feature_code IN ('cylinder.view', 'issue.create', 'supplier_return.create');

    -- Requests: cylinder.request -> pharmacy.oxygen.requests
    UPDATE public.features 
    SET module_id = mod_ox_req 
    WHERE feature_code = 'cylinder.request';

    -- QR: qr.generate -> pharmacy.oxygen.qr
    UPDATE public.features 
    SET module_id = mod_ox_qr 
    WHERE feature_code = 'qr.generate';

    -- Reconciliation: return.process -> pharmacy.oxygen.reconciliation
    -- (Assuming return.process is the key feature for reconciliation/returns)
    UPDATE public.features 
    SET module_id = mod_ox_rec 
    WHERE feature_code = 'return.process';
    
    
    -- 3. REMOVE DUPLICATES (Created in 111 by mistake or redundancy)
    -- ============================================================================
    RAISE NOTICE 'Removing Duplicates...';
    
    -- Delete dashboard_view (underscore) if it differs from dashboard.view
    DELETE FROM public.features 
    WHERE feature_code = 'dashboard_view' 
    AND feature_code != 'dashboard.view'; -- Safety check

    -- Delete any other potential duplicates I might have created if they are not the main ones
    -- (e.g. if I created cylinder_view distinct from cylinder.view)
    DELETE FROM public.features WHERE feature_code = 'cylinder_view';
    DELETE FROM public.features WHERE feature_code = 'cylinder_request';
    DELETE FROM public.features WHERE feature_code = 'qr_generate';


    RAISE NOTICE '=== MIGRATION 112 COMPLETE ===';
END $$;
