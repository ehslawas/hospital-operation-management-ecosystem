-- Migration 074: Universal Menu Access
-- Description: Grants baseline and department-specific menu access to all hospital roles.

DO $$
DECLARE
    emergency_dept_id uuid;
    pharmacy_dept_id uuid;
    role_id_var uuid;
    menu_id_var uuid;
BEGIN
    RAISE NOTICE '=== MIGRATION 074: GRANTING UNIVERSAL MENU ACCESS ===';

    -- 1. Get Department IDs
    SELECT id INTO pharmacy_dept_id FROM public.departments WHERE department_code = 'PHARMACY_LOGISTICS' LIMIT 1;
    SELECT id INTO emergency_dept_id FROM public.departments WHERE department_code = 'EMERGENCY_TRAUMA' LIMIT 1;

    -- ============================================
    -- 2. ADMIN ACCESS (FULL)
    -- ============================================
    RAISE NOTICE '  Granting full access to Admins...';
    FOR role_id_var IN 
        SELECT id FROM public.roles WHERE role_code IN ('system_admin', 'hospital_admin')
    LOOP
        INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
        SELECT role_id_var, id, true FROM public.menus
        ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
    END LOOP;

    -- ============================================
    -- 3. BASELINE ACCESS FOR ALL PROFESSIONAL ROLES
    -- ============================================
    RAISE NOTICE '  Granting baseline access to professional roles...';
    FOR role_id_var IN 
        SELECT id FROM public.roles 
        WHERE role_code IN (
            'medical_officer', 'chief_medical_officer', 'assistant_medical_officer',
            'nurse', 'matron', 'sister', 'pharmacist', 'assistant_pharmacist',
            'medical_lab_tech', 'chief_medical_lab_tech', 'pathologist', 'chemist',
            'radiologist', 'radiology_technician', 'health_care_assistant', 'staff',
            'administration', 'civil_service_assistant', 'driver'
        )
    LOOP
        -- Grant access to Shared Menus (Dashboard, Catalogs, etc. - items with NO department restriction)
        INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
        SELECT role_id_var, id, true 
        FROM public.menus 
        WHERE allowed_department_id IS NULL
        ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
    END LOOP;

    -- ============================================
    -- 4. EMERGENCY DEPARTMENT CORE ACCESS
    -- ============================================
    IF emergency_dept_id IS NOT NULL THEN
        RAISE NOTICE '  Granting core access to Emergency roles...';
        FOR role_id_var IN 
            SELECT id FROM public.roles 
            WHERE role_code IN (
                'medical_officer', 'chief_medical_officer', 'assistant_medical_officer',
                'nurse', 'matron', 'sister', 'health_care_assistant'
            )
        LOOP
            INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
            SELECT role_id_var, id, true 
            FROM public.menus 
            WHERE allowed_department_id = emergency_dept_id
            ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
        END LOOP;
    END IF;

    -- ============================================
    -- 5. PHARMACY DEPARTMENT CORE ACCESS (Including Emergency Roles)
    -- ============================================
    IF pharmacy_dept_id IS NOT NULL THEN
        RAISE NOTICE '  Granting core access to Pharmacy roles...';
        FOR role_id_var IN 
            SELECT id FROM public.roles 
            WHERE role_code IN (
                'pharmacist', 'assistant_pharmacist', 'pharmacy_manager', 
                'pharmacy_director', 'pharmacy_assistant', 'pharmacy_storekeeper', 'pharmacy_staff'
            )
        LOOP
            INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
            SELECT role_id_var, id, true 
            FROM public.menus 
            WHERE allowed_department_id = pharmacy_dept_id
            ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
        END LOOP;

        RAISE NOTICE '  Granting Pharmacy access to Emergency roles (Medical/Nursing)...';
        FOR role_id_var IN 
            SELECT id FROM public.roles 
            WHERE role_code IN (
                'medical_officer', 'chief_medical_officer', 'assistant_medical_officer',
                'nurse', 'matron', 'sister', 'health_care_assistant'
            )
        LOOP
            INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
            SELECT role_id_var, id, true 
            FROM public.menus 
            WHERE allowed_department_id = pharmacy_dept_id
            ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
        END LOOP;
    END IF;

    RAISE NOTICE '=== MIGRATION 074 COMPLETE ===';
END $$;
