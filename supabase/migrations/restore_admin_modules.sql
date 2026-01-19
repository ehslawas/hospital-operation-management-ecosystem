-- Restore Admin Modules and Permissions
-- This migration restores the core administration modules that were lost during the pharmacy migration

-- 1. Insert System Administration Parent Module
INSERT INTO public.modules (id, module_code, module_name, description, parent_module_id, display_order, icon_name, route_path)
VALUES 
  (gen_random_uuid(), 'admin', 'System Administration', 'Core system management and configuration', NULL, 0, 'Shield', '#')
ON CONFLICT (module_code) DO UPDATE 
SET module_name = EXCLUDED.module_name, description = EXCLUDED.description, icon_name = EXCLUDED.icon_name, route_path = EXCLUDED.route_path;

-- Get the admin parent ID for sub-modules
DO $$
DECLARE
    admin_id UUID;
    r_code TEXT;
BEGIN
    SELECT id INTO admin_id FROM public.modules WHERE module_code = 'admin';

    -- 2. Insert Sub-modules
    -- User Management
    INSERT INTO public.modules (module_code, module_name, description, parent_module_id, display_order, icon_name, route_path)
    VALUES ('admin.users', 'User Management', 'Manage hospital staff and external users', admin_id, 1, 'Users', '/admin/users')
    ON CONFLICT (module_code) DO NOTHING;

    -- Role Management
    INSERT INTO public.modules (module_code, module_name, description, parent_module_id, display_order, icon_name, route_path)
    VALUES ('admin.roles', 'Role Management', 'Configure system roles and access levels', admin_id, 2, 'Lock', '/admin/roles')
    ON CONFLICT (module_code) DO NOTHING;

    -- Module Management
    INSERT INTO public.modules (module_code, module_name, description, parent_module_id, display_order, icon_name, route_path)
    VALUES ('admin.modules', 'Module Management', 'Manage system modules and hierarchy', admin_id, 3, 'Grid', '/admin/modules')
    ON CONFLICT (module_code) DO NOTHING;

    -- Feature Management
    INSERT INTO public.modules (module_code, module_name, description, parent_module_id, display_order, icon_name, route_path)
    VALUES ('admin.features', 'Feature Management', 'Configure granular features for each module', admin_id, 4, 'Cpu', '/admin/features')
    ON CONFLICT (module_code) DO NOTHING;

    -- Permission Management
    INSERT INTO public.modules (module_code, module_name, description, parent_module_id, display_order, icon_name, route_path)
    VALUES ('admin.permissions', 'Permissions Matrix', 'Manage role-based module and feature access', admin_id, 5, 'ShieldCheck', '/admin/permissions')
    ON CONFLICT (module_code) DO NOTHING;

    -- Workflow Management
    INSERT INTO public.modules (module_code, module_name, description, parent_module_id, display_order, icon_name, route_path)
    VALUES ('admin.workflows', 'Workflow Management', 'Configure approval workflows and routing', admin_id, 6, 'GitBranch', '/admin/workflows')
    ON CONFLICT (module_code) DO NOTHING;

    -- Audit Logs
    INSERT INTO public.modules (module_code, module_name, description, parent_module_id, display_order, icon_name, route_path)
    VALUES ('admin.audit_logs', 'Audit Logs', 'View system-wide activity and security logs', admin_id, 7, 'Activity', '/admin/audit-logs')
    ON CONFLICT (module_code) DO NOTHING;

    -- 3. Grant Permissions to Admin Roles
    FOR r_code IN SELECT unnest(ARRAY['system_admin', 'hospital_admin']) LOOP
        -- Grant view and manage to all matching admin modules
        INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete)
        SELECT 
            (SELECT id FROM public.roles WHERE role_code = r_code),
            m.id,
            true, true, true, true
        FROM public.modules m
        WHERE m.module_code LIKE 'admin%'
        ON CONFLICT (role_id, module_id) DO UPDATE 
        SET can_view = true, can_create = true, can_edit = true, can_delete = true;
    END LOOP;
END $$;
