-- Migration: Fix Visibility for APPL & LP Catalog Menus
-- Description: Grants view permissions to relevant roles in public.role_menu_access
-- Date: 2026-01-14

DO $$
DECLARE
    role_record RECORD;
    menu_record RECORD;
    v_role_codes text[] := ARRAY[
        'pharmacy_director', 
        'pharmacy_manager', 
        'pharmacist', 
        'pharmacy_assistant', 
        'pharmacy_storekeeper', 
        'pharmacy_staff',
        'hospital_admin',
        'system_admin'
    ];
    v_menu_paths text[] := ARRAY[
        '/pharmacy/catalog/appl',
        '/pharmacy/catalog/appl-drugs',
        '/pharmacy/catalog/appl-non-drugs',
        '/pharmacy/catalog/lp',
        '/pharmacy/catalog/lp-drugs',
        '/pharmacy/catalog/lp-non-drugs'
    ];
BEGIN
    -- Loop through relevant roles
    FOR role_record IN 
        SELECT id, role_code FROM public.roles WHERE role_code = ANY(v_role_codes)
    LOOP
        -- Loop through new catalog menus
        FOR menu_record IN 
            SELECT id, path FROM public.menus WHERE path = ANY(v_menu_paths)
        LOOP
            -- Grant view access if not already present
            -- Corrected columns: can_view, can_edit, can_delete
            INSERT INTO public.role_menu_access (role_id, menu_id, can_view, can_edit, can_delete)
            VALUES (role_record.id, menu_record.id, true, true, true)
            ON CONFLICT (role_id, menu_id) DO UPDATE 
            SET can_view = true, can_edit = true, can_delete = true;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Permissions granted for APPL and LP catalogs to relevant roles.';
END $$;
