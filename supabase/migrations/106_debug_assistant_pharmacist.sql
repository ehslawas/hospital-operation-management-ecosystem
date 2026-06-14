-- ============================================================================
-- Migration 106: Force Grant Assistant Pharmacist Permissions
-- Description: Targeted fix for missing menus for role_id 38fc9449-4d05-4ea3-aeb8-05de39913f25
-- ============================================================================

DO $$
DECLARE
    v_role_id UUID := '38fc9449-4d05-4ea3-aeb8-05de39913f25';
    v_module_id UUID;
    v_feature_id UUID;
BEGIN
    -- 1. Ensure the role ID exists and has the correct code
    UPDATE public.roles SET role_code = 'assistant_pharmacist', role_name = 'Assistant Pharmacist'
    WHERE id = v_role_id;

    -- 2. Grant module-level view permissions for core modules
    -- Dashboard
    SELECT id INTO v_module_id FROM public.modules WHERE module_code = 'dashboard';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, module_id, can_view)
        VALUES (v_role_id, v_module_id, true)
        ON CONFLICT (role_id, module_id) DO UPDATE SET can_view = true;
    END IF;

    -- Pharmacy Management (Parent)
    SELECT id INTO v_module_id FROM public.modules WHERE module_code = 'pharmacy_management';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, module_id, can_view)
        VALUES (v_role_id, v_module_id, true)
        ON CONFLICT (role_id, module_id) DO UPDATE SET can_view = true;
    END IF;

    -- Stock Management
    SELECT id INTO v_module_id FROM public.modules WHERE module_code = 'pharmacy_management.stock';
    IF v_module_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit)
        VALUES (v_role_id, v_module_id, true, true, true)
        ON CONFLICT (role_id, module_id) DO UPDATE SET can_view = true, can_create = true, can_edit = true;
    END IF;

    -- 3. Grant feature-level permissions for all pharmacy modules
    -- This is a broader fix to ensure "Implicit Visibility" works
    INSERT INTO public.role_feature_permissions (role_id, feature_id, is_enabled)
    SELECT 
        v_role_id,
        f.id,
        true
    FROM public.features f
    JOIN public.modules m ON m.id = f.module_id
    WHERE m.module_code LIKE 'pharmacy_%' OR m.module_code = 'dashboard'
    ON CONFLICT (role_id, feature_id) DO UPDATE SET is_enabled = true;

    RAISE NOTICE 'Forced permissions for Assistant Pharmacist role %', v_role_id;
END $$;
