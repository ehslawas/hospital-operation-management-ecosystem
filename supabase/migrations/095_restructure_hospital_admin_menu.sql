-- Migration to restructure Hospital Admin menu
DO $$
DECLARE
    roles_menu_id uuid;
    audit_log_id uuid;
    module_code_val text := 'hospital_admin';
BEGIN
    -- 1. Remove "Hospitals" menu
    DELETE FROM menus WHERE path = '/admin/hospitals' AND module_code = module_code_val;

    -- 2. Update "Manage Users" -> "User Management" (Order 10)
    UPDATE menus 
    SET label = 'User Management', 
        order_index = 10 
    WHERE path = '/admin/users' AND module_code = module_code_val;

    -- 3. Update "Departments" -> "Department Management" (Order 20)
    UPDATE menus 
    SET label = 'Department Management', 
        order_index = 20 
    WHERE path = '/admin/departments' AND module_code = module_code_val;

    -- 4. Update "Roles & Permissions" -> "Roles Management" (Order 30)
    UPDATE menus 
    SET label = 'Roles Management', 
        order_index = 30 
    WHERE path = '/admin/roles' AND module_code = module_code_val
    RETURNING id INTO roles_menu_id;

    -- 5. Handle "Access Request" (Order 5)
    -- Check if exists, update or insert
    IF EXISTS (SELECT 1 FROM menus WHERE path = '/admin/access-requests' AND module_code = module_code_val) THEN
        UPDATE menus 
        SET label = 'Access Requests', 
            order_index = 5 
        WHERE path = '/admin/access-requests' AND module_code = module_code_val;
    ELSE
        INSERT INTO menus (label, path, icon, module_code, order_index, parent_id)
        VALUES ('Access Requests', '/admin/access-requests', 'user-plus', module_code_val, 5, NULL);
    END IF;

    -- 6. Reparent and Rename Submenus under "Roles Management"
    
    -- Permission Matrix
    UPDATE menus 
    SET label = 'Permission Matrix', 
        parent_id = roles_menu_id,
        order_index = 1
    WHERE path = '/admin/permissions' AND module_code = module_code_val;

    -- Module (Manage Modules -> Module)
    UPDATE menus 
    SET label = 'Module', 
        parent_id = roles_menu_id,
        order_index = 2
    WHERE path = '/admin/modules' AND module_code = module_code_val;

    -- Feature (Manage Features -> Feature)
    UPDATE menus 
    SET label = 'Feature', 
        parent_id = roles_menu_id,
        order_index = 3
    WHERE path = '/admin/features' AND module_code = module_code_val;

    -- Workflow (Approval Workflows -> Workflow)
    UPDATE menus 
    SET label = 'Workflow', 
        parent_id = roles_menu_id,
        order_index = 4
    WHERE path = '/admin/workflows' AND module_code = module_code_val;

    -- 7. Audit Logs (Order 40) - Remove duplicates first
    -- Find the main one
    SELECT id INTO audit_log_id FROM menus WHERE path = '/admin/audit-logs' AND module_code = module_code_val LIMIT 1;
    
    -- Delete others
    DELETE FROM menus WHERE path = '/admin/audit-logs' AND module_code = module_code_val AND id != audit_log_id;
    DELETE FROM menus WHERE label = 'Audit Logs' AND module_code = module_code_val AND id != audit_log_id;

    -- Update the main one
    UPDATE menus 
    SET label = 'Audit Logs', 
        order_index = 40 
    WHERE id = audit_log_id;

    -- 8. System Settings (Order 50)
    UPDATE menus 
    SET label = 'System Setting', 
        order_index = 50 
    WHERE path = '/admin/settings' AND module_code = module_code_val;

    -- 9. Remove any other unexpected top-level menus for this module if needed?
    -- The user said "other than this list, can remove the menu".
    -- I should probably delete anything else that is top level (parent_id IS NULL) and not in the approved list.
    -- Approved Paths: 
    -- /dashboard (in dashboard module, so safe)
    -- /admin/access-requests
    -- /admin/users
    -- /admin/departments
    -- /admin/roles
    -- /admin/audit-logs
    -- /admin/settings
    
    DELETE FROM menus 
    WHERE module_code = module_code_val 
      AND parent_id IS NULL 
      AND path NOT IN (
        '/admin/access-requests',
        '/admin/users',
        '/admin/departments',
        '/admin/roles',
        '/admin/audit-logs',
        '/admin/settings'
      );

END $$;
