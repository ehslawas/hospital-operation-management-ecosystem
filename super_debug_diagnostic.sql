-- FINAL DEBUG DIAGNOSTIC
DO $$
DECLARE
    role_id_from_log uuid := '08f2d9c7-2a2b-448c-9345-13fb30fc8bef';
    dept_id uuid;
    role_check_code text;
    rma_count integer;
    accessible_menu_count integer;
    dept_match_count integer;
BEGIN
    -- 1. Check if the Role ID from the log actually exists and what its code is
    SELECT role_code INTO role_check_code FROM public.roles WHERE id = role_id_from_log;
    RAISE NOTICE 'Log Role ID (%) matches Role Code: %', role_id_from_log, role_check_code;

    -- 2. Check the Department ID for 'pharmacy_logistics'
    SELECT id INTO dept_id FROM public.departments WHERE department_code ILIKE 'pharmacy_logistics';
    RAISE NOTICE 'Pharmacy Dept ID found: %', dept_id;

    -- 3. Check how many menus are viewable by this role in role_menu_access
    SELECT COUNT(*) INTO rma_count FROM public.role_menu_access WHERE role_id = role_id_from_log AND can_view = true;
    RAISE NOTICE 'Raw entries in role_menu_access for this role: %', rma_count;

    -- 4. Check how many menus are allowed for this department
    SELECT COUNT(*) INTO dept_match_count FROM public.menus WHERE allowed_department_id = dept_id OR allowed_department_id IS NULL;
    RAISE NOTICE 'Menus in DB matching Dept ID (or null): %', dept_match_count;

    -- 5. The full join check (this is what the frontend does)
    SELECT COUNT(*) INTO accessible_menu_count
    FROM public.menus m
    JOIN public.role_menu_access rma ON m.id = rma.menu_id
    WHERE rma.role_id = role_id_from_log
    AND rma.can_view = true
    AND (m.allowed_department_id = dept_id OR m.allowed_department_id IS NULL);
    
    RAISE NOTICE 'COMPUTED ACCESS (Join of Dept + Role): %', accessible_menu_count;

    -- 6. If 0, let's see why. Are there any rma entries at all?
    IF rma_count > 0 AND accessible_menu_count = 0 THEN
        RAISE NOTICE 'DIAGNOSIS: Role has permissions, but they don''t match the department menus. Checking if RMA links to wrong department ID.';
        
        FOR role_check_code IN 
            SELECT m.label || ' (' || COALESCE(m.allowed_department_id::text, 'NULL') || ')'
            FROM public.role_menu_access rma
            JOIN public.menus m ON rma.menu_id = m.id
            WHERE rma.role_id = role_id_from_log
            LIMIT 5
        LOOP
            RAISE NOTICE ' - User has permission for menu: %', role_check_code;
        END LOOP;
    END IF;

END $$;
