-- Migration: Universal Pharmacy Access (Version 2 - Force Fix)
-- Description: Aggressively ensures ALL pharmacy-related roles have access to Pharmacy Logistics menus.
-- Fixes: "Empty menu" issue due to potential case-sensitivity or missing role mappings.

DO $$
DECLARE
    pharmacy_dept_id uuid;
    role_rec record;
    menu_rec record;
    permission_count integer := 0;
BEGIN
    -- 1. Get Pharmacy Department ID
    SELECT id INTO pharmacy_dept_id 
    FROM public.departments 
    WHERE department_code ILIKE 'pharmacy_logistics';

    IF pharmacy_dept_id IS NULL THEN
        RAISE EXCEPTION 'Pharmacy Department not found';
    END IF;
    
    RAISE NOTICE 'Target Pharmacy Dept ID: %', pharmacy_dept_id;

    -- 2. Loop through ANY role that looks like a pharmacy role
    -- This catches 'pharmacy_staff', 'Pharmacy_Staff', 'PHARMACY_STAFF', 'pharmacist', etc.
    FOR role_rec IN 
        SELECT id, role_code 
        FROM public.roles 
        WHERE role_code ILIKE '%pharmacy%' 
           OR role_code ILIKE '%pharmacist%'
    LOOP
        RAISE NOTICE 'Processing Role: % (ID: %)', role_rec.role_code, role_rec.id;

        -- 3. Grant Access to ALL menus restricted to Pharmacy Dept + Dashboard
        FOR menu_rec IN 
            SELECT id, label, path
            FROM public.menus 
            WHERE allowed_department_id = pharmacy_dept_id 
               OR path = '/dashboard'
        LOOP
            INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
            VALUES (role_rec.id, menu_rec.id, true)
            ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
            
            permission_count := permission_count + 1;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Universal Access Update Complete. Total permissions processed: %', permission_count;

END $$;
