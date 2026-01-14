-- Migration 070: Fix Emergency Menus leaking into Pharmacy
-- Description: Ensures Triage and Patient Management are strictly linked to Emergency Department

DO $$
DECLARE
    emergency_dept_id uuid;
    pharmacy_dept_id uuid;
    hospital_id uuid;
    update_count integer := 0;
BEGIN
    RAISE NOTICE '=== MIGRATION 070: FIX LEAKING EMERGENCY MENUS ===';

    -- 1. Get Departments
    SELECT id INTO pharmacy_dept_id FROM public.departments WHERE department_code = 'pharmacy_logistics' LIMIT 1;
    
    -- Get or Create Emergency Department
    SELECT id INTO emergency_dept_id FROM public.departments WHERE department_code = 'emergency_trauma' LIMIT 1;
    
    IF emergency_dept_id IS NULL THEN
        SELECT id INTO hospital_id FROM public.hospitals LIMIT 1;
        INSERT INTO public.departments (department_name, department_code, hospital_id, description, status)
        VALUES ('Emergency & Trauma', 'emergency_trauma', hospital_id, 'Emergency Department', 'active')
        RETURNING id INTO emergency_dept_id;
        RAISE NOTICE '  Created Emergency Dept ID: %', emergency_dept_id;
    ELSE
         RAISE NOTICE '  Found Emergency Dept ID: %', emergency_dept_id;
    END IF;

    -- ============================================
    -- 2. MOVE MENUS TO EMERGENCY DEPT
    -- ============================================
    UPDATE public.menus 
    SET allowed_department_id = emergency_dept_id 
    WHERE path LIKE '/emergency%' 
       OR label IN ('Triage', 'Patient Management');
       
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE '  Moved % menus to Emergency Department', update_count;

    -- ============================================
    -- 3. REVOKE PHARMACY ACCESS
    -- ============================================
    -- Delete any role_menu_access for pharmacy roles pointing to these menus
    DELETE FROM public.role_menu_access 
    WHERE menu_id IN (
        SELECT id FROM public.menus 
        WHERE path LIKE '/emergency%' OR label IN ('Triage', 'Patient Management')
    )
    AND role_id IN (
        SELECT id FROM public.roles 
        WHERE role_code ILIKE '%pharmacy%' OR role_code ILIKE '%pharmacist%'
    );
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE '  Revoked % permission entries from Pharmacy roles', update_count;
    
    RAISE NOTICE '=== COMPLETE ===';
END $$;
