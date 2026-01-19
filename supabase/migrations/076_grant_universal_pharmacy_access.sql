-- Migration 076: Grant Universal Pharmacy Menu Access to All Professional Roles
-- Description: Ensures all professional roles can access Pharmacy Logistics menus by default.
-- Hospital Admin can then fine-tune via Roles & Permissions UI.

DO $$
DECLARE
    pharmacy_dept_id uuid;
    emergency_dept_id uuid;
    role_rec record;
    menu_count integer := 0;
BEGIN
    RAISE NOTICE '=== MIGRATION 076: UNIVERSAL PHARMACY ACCESS ===';

    -- 1. Get Department IDs
    SELECT id INTO pharmacy_dept_id FROM public.departments WHERE department_code ILIKE '%pharmacy%logistics%' LIMIT 1;
    SELECT id INTO emergency_dept_id FROM public.departments WHERE department_code ILIKE '%emergency%trauma%' LIMIT 1;

    IF pharmacy_dept_id IS NULL THEN
        RAISE EXCEPTION 'Pharmacy Logistics department not found!';
    END IF;

    RAISE NOTICE '  Pharmacy Dept ID: %', pharmacy_dept_id;
    RAISE NOTICE '  Emergency Dept ID: %', emergency_dept_id;

    -- ============================================
    -- 2. Grant ALL Professional Roles Access to ALL Pharmacy Menus
    -- ============================================
    RAISE NOTICE '  Granting Pharmacy menu access to all professional roles...';
    
    FOR role_rec IN 
        SELECT id, role_code FROM public.roles 
        WHERE role_code IN (
            -- Medical Roles
            'medical_officer', 'chief_medical_officer', 'assistant_medical_officer',
            -- Nursing Roles
            'nurse', 'matron', 'sister', 'health_care_assistant',
            -- Pharmacy Roles
            'pharmacist', 'assistant_pharmacist', 'pharmacy_manager', 
            'pharmacy_director', 'pharmacy_assistant', 'pharmacy_storekeeper', 'pharmacy_staff',
            -- Lab Roles
            'medical_lab_tech', 'chief_medical_lab_tech', 'pathologist', 'chemist',
            -- Other Clinical Roles
            'radiologist', 'radiology_technician',
            -- Support Roles
            'administration', 'civil_service_assistant', 'staff', 'driver'
        )
    LOOP
        -- Grant access to ALL Pharmacy menus (allowed_department_id = pharmacy_dept_id)
        INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
        SELECT role_rec.id, m.id, true
        FROM public.menus m
        WHERE m.allowed_department_id = pharmacy_dept_id
        ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
        
        GET DIAGNOSTICS menu_count = ROW_COUNT;
        RAISE NOTICE '    % → granted % Pharmacy menus', role_rec.role_code, menu_count;
    END LOOP;

    -- ============================================
    -- 3. Grant ALL Professional Roles Access to Shared Menus (Dashboard)
    -- ============================================
    RAISE NOTICE '  Granting shared menu access to all professional roles...';
    
    FOR role_rec IN 
        SELECT id, role_code FROM public.roles 
        WHERE role_code IN (
            'medical_officer', 'chief_medical_officer', 'assistant_medical_officer',
            'nurse', 'matron', 'sister', 'health_care_assistant',
            'pharmacist', 'assistant_pharmacist', 'pharmacy_manager', 
            'pharmacy_director', 'pharmacy_assistant', 'pharmacy_storekeeper', 'pharmacy_staff',
            'medical_lab_tech', 'chief_medical_lab_tech', 'pathologist', 'chemist',
            'radiologist', 'radiology_technician',
            'administration', 'civil_service_assistant', 'staff', 'driver'
        )
    LOOP
        -- Grant access to shared menus (allowed_department_id IS NULL)
        INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
        SELECT role_rec.id, m.id, true
        FROM public.menus m
        WHERE m.allowed_department_id IS NULL
        ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
        
        GET DIAGNOSTICS menu_count = ROW_COUNT;
        RAISE NOTICE '    % → granted % shared menus', role_rec.role_code, menu_count;
    END LOOP;

    -- ============================================
    -- 4. Grant Emergency Roles Access to Emergency Menus
    -- ============================================
    IF emergency_dept_id IS NOT NULL THEN
        RAISE NOTICE '  Granting Emergency menu access to clinical roles...';
        
        FOR role_rec IN 
            SELECT id, role_code FROM public.roles 
            WHERE role_code IN (
                'medical_officer', 'chief_medical_officer', 'assistant_medical_officer',
                'nurse', 'matron', 'sister', 'health_care_assistant'
            )
        LOOP
            INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
            SELECT role_rec.id, m.id, true
            FROM public.menus m
            WHERE m.allowed_department_id = emergency_dept_id
            ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
            
            GET DIAGNOSTICS menu_count = ROW_COUNT;
            RAISE NOTICE '    % → granted % Emergency menus', role_rec.role_code, menu_count;
        END LOOP;
    END IF;

    RAISE NOTICE '=== MIGRATION 076 COMPLETE ===';
    RAISE NOTICE 'All professional roles now have default access to Pharmacy menus.';
    RAISE NOTICE 'Hospital Admin can fine-tune via Roles & Permissions UI.';
END $$;
