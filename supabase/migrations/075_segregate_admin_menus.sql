-- Migration 075: Segregate Admin Menus
-- Description: Strictly assigns Admin menus to 'hospital_admin' dept so they don't leak into other modules.

DO $$
DECLARE
    admin_dept_id uuid;
    hospital_id_for_admin uuid;
    menu_count integer := 0;
BEGIN
    RAISE NOTICE '=== MIGRATION 075: SEGREGATING ADMIN MENUS ===';

    -- 1. Get or Create Hospital Admin Department
    SELECT id INTO admin_dept_id FROM public.departments WHERE department_code = 'hospital_admin' LIMIT 1;
    
    IF admin_dept_id IS NULL THEN
        SELECT id INTO hospital_id_for_admin FROM public.hospitals LIMIT 1;
        INSERT INTO public.departments (department_name, department_code, hospital_id, status)
        VALUES ('Hospital Administration', 'hospital_admin', hospital_id_for_admin, 'active')
        RETURNING id INTO admin_dept_id;
        RAISE NOTICE '  Created Hospital Admin Dept ID: %', admin_dept_id;
    ELSE
        RAISE NOTICE '  Found Hospital Admin Dept ID: %', admin_dept_id;
    END IF;

    -- 2. Strictly Assign Admin Menus to Admin Dept
    -- These menus should ONLY appear when the user is in "Hospital Administration" module context
    UPDATE public.menus 
    SET allowed_department_id = admin_dept_id
    WHERE path LIKE '/admin%'
       OR label IN (
           'Manage Users', 
           'Access Requests', 
           'Departments', 
           'Roles & Permissions', 
           'Hospitals', 
           'Hospital Memos',
           'Audit Logs', 
           'System Settings'
       );
       
    GET DIAGNOSTICS menu_count = ROW_COUNT;
    RAISE NOTICE '  Strictly assigned % menus to Hospital Admin department', menu_count;

    -- 3. Ensure Shared Permission for Admin Role
    -- Admins need access to these menus, but they are now strictly departmental.
    -- We need to ensure the role_menu_access table reflects this.
    INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
    SELECT r.id, m.id, true
    FROM public.roles r, public.menus m
    WHERE r.role_code IN ('system_admin', 'hospital_admin')
    AND m.allowed_department_id = admin_dept_id
    ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;

    RAISE NOTICE '=== MIGRATION 075 COMPLETE ===';
END $$;
