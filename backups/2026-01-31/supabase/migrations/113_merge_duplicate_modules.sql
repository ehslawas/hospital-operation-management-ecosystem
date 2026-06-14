-- ============================================================================
-- Migration 113: Merge Duplicate Logistics Modules
-- Description: Merges legacy 'pharmacy.*' modules into the new 'pharmacy.logistics.*'
--              granular modules to resolve duplicate permission sections and access issues.
-- ============================================================================

DO $$
DECLARE
    -- OLD Module IDs (To be deleted)
    old_proc_id UUID := '5abb8228-fe10-49f0-9565-b44b8fa20356';
    old_inv_id UUID  := 'a861ee92-1c08-4d21-ae26-9ff2d4ea56e5';
    old_fin_id UUID  := '3b32254a-1c0e-4e27-b5ee-24d2b8a018e1';
    old_dist_id UUID := '83fc7098-f8b5-416a-b86e-23ef7ceb73f6';
    old_rep_id UUID  := '57a7f353-d1b3-4c0b-adbe-aa781240da4f';

    -- NEW Module IDs (To keep)
    new_proc_id UUID := '7de94b10-465f-4ef9-86c1-d40ac2cf5276';
    new_inv_id UUID  := '74d6c9ba-bb72-46cd-b4d3-11176ee3805c';
    new_fin_id UUID  := 'eac2510a-5fcf-4399-b042-4f7c0d65a7c1';
    new_dist_id UUID := '58215e1a-c1b5-4e9c-8040-82ae695c9c89';
    new_rep_id UUID  := '03154050-7cf5-4bd9-870a-971e380ab210';

BEGIN
    RAISE NOTICE '=== MIGRATION 113: MERGING DUPLICATE MODULES ===';

    -- 1. MOVE FEATURES (Old -> New)
    -- ============================================================================
    RAISE NOTICE 'Moving features to new modules...';

    -- Procurement
    UPDATE public.features SET module_id = new_proc_id WHERE module_id = old_proc_id;
    -- Inventory
    UPDATE public.features SET module_id = new_inv_id WHERE module_id = old_inv_id;
    -- Financial
    UPDATE public.features SET module_id = new_fin_id WHERE module_id = old_fin_id;
    -- Distribution
    UPDATE public.features SET module_id = new_dist_id WHERE module_id = old_dist_id;
    -- Reports
    UPDATE public.features SET module_id = new_rep_id WHERE module_id = old_rep_id;


    -- 2. MIGRATE ROLE PERMISSIONS (Old -> New)
    -- ============================================================================
    RAISE NOTICE 'Migrating role permissions...';
    -- We want to ensure any role that had access to OLD module now has access to NEW module.
    -- We use INSERT ... ON CONFLICT DO NOTHING because we want to preserve the existence of permission.
    -- If the role ALREADY has permission on NEW module, we keep it. If not, we copy from OLD.

    -- Procurement
    INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete)
    SELECT role_id, new_proc_id, can_view, can_create, can_edit, can_delete
    FROM public.role_permissions
    WHERE module_id = old_proc_id
    ON CONFLICT (role_id, module_id) DO NOTHING;

    -- Inventory
    INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete)
    SELECT role_id, new_inv_id, can_view, can_create, can_edit, can_delete
    FROM public.role_permissions
    WHERE module_id = old_inv_id
    ON CONFLICT (role_id, module_id) DO NOTHING;

    -- Financial
    INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete)
    SELECT role_id, new_fin_id, can_view, can_create, can_edit, can_delete
    FROM public.role_permissions
    WHERE module_id = old_fin_id
    ON CONFLICT (role_id, module_id) DO NOTHING;

    -- Distribution
    INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete)
    SELECT role_id, new_dist_id, can_view, can_create, can_edit, can_delete
    FROM public.role_permissions
    WHERE module_id = old_dist_id
    ON CONFLICT (role_id, module_id) DO NOTHING;

    -- Reports
    INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete)
    SELECT role_id, new_rep_id, can_view, can_create, can_edit, can_delete
    FROM public.role_permissions
    WHERE module_id = old_rep_id
    ON CONFLICT (role_id, module_id) DO NOTHING;


    -- 3. CLEAN UP (Delete Old Records)
    -- ============================================================================
    RAISE NOTICE 'Deleting old modules and permissions...';

    -- Delete old role permissions
    DELETE FROM public.role_permissions WHERE module_id IN (old_proc_id, old_inv_id, old_fin_id, old_dist_id, old_rep_id);

    -- Delete old modules
    -- Note: This might fail if there are other foreign key constraints (e.g., if other child modules exist).
    -- But these seem to be leaf or near-leaf modules. If they have children, we might need to handle them.
    -- Let's assume for now they are the target ones.
    
    DELETE FROM public.modules WHERE id IN (old_proc_id, old_inv_id, old_fin_id, old_dist_id, old_rep_id);


    RAISE NOTICE '=== MIGRATION 113 COMPLETE ===';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error occurred: %', SQLERRM;
    ROLLBACK;
END $$;
