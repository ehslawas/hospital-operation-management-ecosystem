-- Migration: Ensure Admin Modules Exist
-- Description: Populates the modules table with core admin modules if they are missing
-- This ensures the frontend RBAC system has data to read from

DO $$
DECLARE
    admin_users_id uuid;
    admin_roles_id uuid;
    admin_depts_id uuid;
    admin_hospitals_id uuid;
    admin_access_id uuid;
    admin_audit_id uuid;
    admin_settings_id uuid;
    admin_modules_id uuid;
    
    role_rec record;
    perm_count integer := 0;
BEGIN
    RAISE NOTICE '=== ENSURING ADMIN MODULES EXIST ===';

    -- 1. Insert Modules
    
    -- Users
    INSERT INTO public.modules (module_code, module_name, route_path, icon_name, is_active, display_order)
    VALUES ('admin.users', 'User Management', '/admin/users', 'Users', true, 1)
    ON CONFLICT (module_code) DO UPDATE SET is_active = true, route_path = '/admin/users'
    RETURNING id INTO admin_users_id;

    -- Roles
    INSERT INTO public.modules (module_code, module_name, route_path, icon_name, is_active, display_order)
    VALUES ('admin.roles', 'Role Management', '/admin/roles', 'Shield', true, 2)
    ON CONFLICT (module_code) DO UPDATE SET is_active = true
    RETURNING id INTO admin_roles_id;

    -- Departments
    INSERT INTO public.modules (module_code, module_name, route_path, icon_name, is_active, display_order)
    VALUES ('admin.depts', 'Departments', '/admin/departments', 'Building2', true, 3)
    ON CONFLICT (module_code) DO UPDATE SET is_active = true
    RETURNING id INTO admin_depts_id;

    -- Hospitals
    INSERT INTO public.modules (module_code, module_name, route_path, icon_name, is_active, display_order)
    VALUES ('admin.hospitals', 'Hospitals', '/admin/hospitals', 'Building', true, 4)
    ON CONFLICT (module_code) DO UPDATE SET is_active = true
    RETURNING id INTO admin_hospitals_id;
    
    -- Access Requests
    INSERT INTO public.modules (module_code, module_name, route_path, icon_name, is_active, display_order)
    VALUES ('admin.access', 'Access Requests', '/admin/access-requests', 'UserPlus', true, 5)
    ON CONFLICT (module_code) DO UPDATE SET is_active = true
    RETURNING id INTO admin_access_id;
    
    -- Audit Logs
    INSERT INTO public.modules (module_code, module_name, route_path, icon_name, is_active, display_order)
    VALUES ('admin.audit', 'Audit Logs', '/admin/audit-logs', 'FileText', true, 6)
    ON CONFLICT (module_code) DO UPDATE SET is_active = true
    RETURNING id INTO admin_audit_id;

    -- System Settings
    INSERT INTO public.modules (module_code, module_name, route_path, icon_name, is_active, display_order)
    VALUES ('admin.settings', 'System Settings', '/admin/settings', 'Settings', true, 7)
    ON CONFLICT (module_code) DO UPDATE SET is_active = true
    RETURNING id INTO admin_settings_id;

    -- Module Management (System Admin Only usually, but adding for completeness)
    INSERT INTO public.modules (module_code, module_name, route_path, icon_name, is_active, display_order)
    VALUES ('admin.modules', 'Module Management', '/admin/modules', 'Box', true, 8)
    ON CONFLICT (module_code) DO UPDATE SET is_active = true
    RETURNING id INTO admin_modules_id;

    RAISE NOTICE 'Modules upserted successfully';

    -- 2. Grant Permissions to System & Hospital Admins
    FOR role_rec IN 
        SELECT id, role_code FROM public.roles 
        WHERE role_code IN ('system_admin', 'hospital_admin')
    LOOP
        -- Grant Users
        INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, granted_by)
        VALUES (role_rec.id, admin_users_id, true, true, true, true, NULL)
        ON CONFLICT (role_id, module_id) DO UPDATE SET can_view = true;
        
        -- Grant Roles
        INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, granted_by)
        VALUES (role_rec.id, admin_roles_id, true, true, true, true, NULL)
        ON CONFLICT (role_id, module_id) DO UPDATE SET can_view = true;
        
        -- Grant Departments
        INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, granted_by)
        VALUES (role_rec.id, admin_depts_id, true, true, true, true, NULL)
        ON CONFLICT (role_id, module_id) DO UPDATE SET can_view = true;
        
        -- Grant Hospitals
        INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, granted_by)
        VALUES (role_rec.id, admin_hospitals_id, true, true, true, true, NULL)
        ON CONFLICT (role_id, module_id) DO UPDATE SET can_view = true;
        
        -- Grant Access Requests
        INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, granted_by)
        VALUES (role_rec.id, admin_access_id, true, true, true, true, NULL)
        ON CONFLICT (role_id, module_id) DO UPDATE SET can_view = true;
        
        -- Grant Audit
        INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, granted_by)
        VALUES (role_rec.id, admin_audit_id, true, true, true, true, NULL)
        ON CONFLICT (role_id, module_id) DO UPDATE SET can_view = true;
        
        -- Grant Settings
        INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, granted_by)
        VALUES (role_rec.id, admin_settings_id, true, true, true, true, NULL)
        ON CONFLICT (role_id, module_id) DO UPDATE SET can_view = true;

        perm_count := perm_count + 7;
    END LOOP;

    RAISE NOTICE 'Permissions granted to admins: %', perm_count;
END $$;
