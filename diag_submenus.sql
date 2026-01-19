-- Diagnostic: Check children of Inventory, Distribution, and Medical Oxygen
DO $$
DECLARE
    dept_id uuid;
    role_id uuid := '08f2d9c7-2a2b-448c-9345-13fb30fc8bef'; -- Pharmacy Staff from logs
BEGIN
    SELECT id INTO dept_id FROM public.departments WHERE department_code = 'pharmacy_logistics';
    
    RAISE NOTICE 'Pharmacy Dept ID: %', dept_id;

    -- Check Parent Menus
    RAISE NOTICE '--- Parent Menus ---';
    FOR role_id IN SELECT id, label, path FROM public.menus WHERE label IN ('Inventory', 'Distribution', 'Medical Oxygen') LOOP
        RAISE NOTICE 'Parent: % (%) ID: %', role_id.label, role_id.path, role_id.id;
        
        -- Check Children in Menus Table
        RAISE NOTICE '   --- Children in Menus Table ---';
        FOR dept_id IN SELECT id, label, path, allowed_department_id FROM public.menus WHERE parent_id = role_id.id LOOP
            RAISE NOTICE '   Child: % (%) DeptID: %', dept_id.label, dept_id.path, dept_id.allowed_department_id;
            
            -- Check Permission for this child
            IF EXISTS (SELECT 1 FROM public.role_menu_access WHERE role_id = '08f2d9c7-2a2b-448c-9345-13fb30fc8bef' AND menu_id = dept_id.id AND can_view = true) THEN
                RAISE NOTICE '      Permission: OK';
            ELSE
                RAISE NOTICE '      Permission: MISSING';
            END IF;
        END LOOP;
    END LOOP;

END $$;
