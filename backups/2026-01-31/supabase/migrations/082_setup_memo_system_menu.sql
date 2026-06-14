-- Migration 082: Setup Memo & Letter System Navigation
-- Description: Groups Memo Management and Reference Numbers under a single "Memo & Letter System" menu.

DO $$
DECLARE
    admin_dept_id uuid;
    hosp_admin_role_id uuid;
    sys_admin_role_id uuid;
    parent_menu_id uuid;
    memo_list_menu_id uuid;
    ref_num_menu_id uuid;
BEGIN
    RAISE NOTICE '=== MIGRATION 082: ORGANIZING MEMO SYSTEM MENU ===';

    -- 1. Get Context
    SELECT id INTO admin_dept_id FROM public.departments WHERE department_code = 'hospital_admin' LIMIT 1;
    SELECT id INTO hosp_admin_role_id FROM public.roles WHERE role_code = 'hospital_admin';
    SELECT id INTO sys_admin_role_id FROM public.roles WHERE role_code = 'system_admin';

    -- 2. Create/Update Parent Menu "Memo & Letter System"
    parent_menu_id := gen_random_uuid();
    INSERT INTO public.menus (id, label, path, icon, order_index, is_core, module_code, allowed_department_id)
    VALUES (parent_menu_id, 'Memo & Letter System', '/admin/memo-system', 'Mail', 16, true, 'admin', admin_dept_id)
    ON CONFLICT (path) DO UPDATE SET 
        label = 'Memo & Letter System', 
        icon = 'Mail', 
        order_index = 16,
        allowed_department_id = admin_dept_id
    RETURNING id INTO parent_menu_id;

    -- 3. Move "Hospital Memos" under parent
    -- First find it if it exists
    SELECT id INTO memo_list_menu_id FROM public.menus WHERE path = '/admin/memos';
    IF memo_list_menu_id IS NOT NULL THEN
        UPDATE public.menus 
        SET parent_id = parent_menu_id, 
            label = 'Memos & Letters', -- Better label for child
            order_index = 1 
        WHERE id = memo_list_menu_id;
    ELSE
        -- Create it if missing
        INSERT INTO public.menus (label, path, icon, parent_id, order_index, is_core, module_code, allowed_department_id)
        VALUES ('Memos & Letters', '/admin/memos', 'FileText', parent_menu_id, 1, true, 'admin', admin_dept_id);
    END IF;

    -- 4. Move "Reference Numbers" under parent
    SELECT id INTO ref_num_menu_id FROM public.menus WHERE path = '/admin/running-numbers';
    IF ref_num_menu_id IS NOT NULL THEN
        UPDATE public.menus 
        SET parent_id = parent_menu_id, 
            label = 'Reference Numbers',
            order_index = 2 
        WHERE id = ref_num_menu_id;
    ELSE
        -- Create it if missing
        INSERT INTO public.menus (label, path, icon, parent_id, order_index, is_core, module_code, allowed_department_id)
        VALUES ('Reference Numbers', '/admin/running-numbers', 'Hash', parent_menu_id, 2, true, 'admin', admin_dept_id);
    END IF;

    -- 5. Grant permissions to Parent
    -- If Parent is new, roles won't have it in role_menu_access
    INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
    SELECT r.id, parent_menu_id, true
    FROM public.roles r
    WHERE r.role_code IN ('hospital_admin', 'system_admin')
    ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;

    -- 6. Re-assert permissions for children just in case
    INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
    SELECT r.id, m.id, true
    FROM public.roles r, public.menus m
    WHERE r.role_code IN ('hospital_admin', 'system_admin')
    AND m.parent_id = parent_menu_id
    ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;

    -- 7. Adjust Audit Logs order to avoid conflict
    UPDATE public.menus SET order_index = 18 WHERE path = '/admin/audit-logs';

    RAISE NOTICE '=== MIGRATION 082 COMPLETE ===';
END $$;
