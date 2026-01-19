-- Migration: Universal Pharmacy Access
-- Description: Ensures ALL pharmacy-related roles have access to Pharmacy Logistics menus.
-- Fixes: "Empty menu" issue when switching to Pharmacist/Assistant view modes.

DO $$
DECLARE
    pharmacy_dept_id uuid;
    target_role_code text;
    role_rec record;
    menu_rec record;
    roles_list text[] := ARRAY[
        'pharmacy_director', 
        'pharmacy_manager', 
        'pharmacist', 
        'pharmacy_assistant', 
        'pharmacy_storekeeper', 
        'pharmacy_staff'
    ];
BEGIN
    -- 1. Get Pharmacy Department ID
    SELECT id INTO pharmacy_dept_id 
    FROM public.departments 
    WHERE department_code ILIKE 'pharmacy_logistics';

    IF pharmacy_dept_id IS NULL THEN
        RAISE EXCEPTION 'Pharmacy Department not found';
    END IF;

    -- 2. Iterate through all Pharmacy Roles
    FOREACH target_role_code IN ARRAY roles_list
    LOOP
        -- Get Role ID (if exists)
        FOR role_rec IN SELECT id FROM public.roles WHERE role_code = target_role_code
        LOOP
            RAISE NOTICE 'Granting access for role: % (ID: %)', target_role_code, role_rec.id;

            -- 3. Grant Access to ALL menus belonging to Pharmacy Department
            FOR menu_rec IN 
                SELECT id 
                FROM public.menus 
                WHERE allowed_department_id = pharmacy_dept_id 
                   OR path = '/dashboard' -- Everyone needs dashboard
            LOOP
                INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
                VALUES (role_rec.id, menu_rec.id, true)
                ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
            END LOOP;
        END LOOP;
    END LOOP;

END $$;
