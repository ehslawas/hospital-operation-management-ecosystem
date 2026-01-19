-- Deep Diagnostic for Pharmacy Staff Access
DO $$
DECLARE
    dept_id uuid;
    role_id uuid;
    menu_count integer;
    perm_count integer;
BEGIN
    -- 1. Check Department
    SELECT id INTO dept_id FROM public.departments WHERE department_code ILIKE 'pharmacy_logistics';
    RAISE NOTICE 'Pharmacy Dept ID: %', dept_id;

    -- 2. Check Role
    SELECT id INTO role_id FROM public.roles WHERE role_code = 'pharmacy_staff';
    RAISE NOTICE 'Pharmacy Staff Role ID: %', role_id;

    -- 3. Check Menus linked to this Dept
    SELECT COUNT(*) INTO menu_count FROM public.menus WHERE allowed_department_id = dept_id;
    RAISE NOTICE 'Menus linked to Pharmacy Dept: %', menu_count;
    
    -- List a few for verification
    FOR role_id IN SELECT id FROM public.menus WHERE allowed_department_id = dept_id LIMIT 3 LOOP
        RAISE NOTICE ' - Menu ID: %', role_id;
    END LOOP;

    -- 4. Check Permissions for this Role
    SELECT INTO role_id id FROM public.roles WHERE role_code = 'pharmacy_staff'; -- reset variable just in case
    
    SELECT COUNT(*) INTO perm_count 
    FROM public.role_menu_access 
    WHERE role_id = role_id;
    
    RAISE NOTICE 'Total Permissions for Pharmacy Staff: %', perm_count;
    
    -- 5. Check Intersection (Dept Menus + Role Perms)
    SELECT COUNT(*) INTO perm_count
    FROM public.role_menu_access rma
    JOIN public.menus m ON rma.menu_id = m.id
    WHERE rma.role_id = role_id
    AND m.allowed_department_id = dept_id;
    
    RAISE NOTICE 'Valid Dept Permissions for Pharmacy Staff: %', perm_count;

END $$;
