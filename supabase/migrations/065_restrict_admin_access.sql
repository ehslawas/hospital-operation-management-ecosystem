-- Migration: Restrict Admin Access
-- Description: Ensures Admin menus are ONLY visible to Admins and not Pharmacy roles.
-- Fixes: Administrative menus appearing in Pharmacy Logistics view.

DO $$
DECLARE
    admin_dept_id uuid;
    pharmacy_dept_id uuid;
    role_rec record;
    menu_rec record;
BEGIN
    -- 1. Get or Create "Hospital Administration" Department
    SELECT id INTO admin_dept_id FROM public.departments WHERE department_code = 'hospital_admin' OR department_code = 'admin';
    
    IF admin_dept_id IS NULL THEN
        -- We need a hospital_id for the department
        DECLARE
            default_hospital_id uuid;
        BEGIN
            SELECT id INTO default_hospital_id FROM public.hospitals LIMIT 1;
            
            INSERT INTO public.departments (department_name, department_code, hospital_id)
            VALUES ('Hospital Administration', 'hospital_admin', default_hospital_id)
            RETURNING id INTO admin_dept_id;
            RAISE NOTICE 'Created Hospital Administration department (ID: %) for Hospital: %', admin_dept_id, default_hospital_id;
        END;
    END IF;

    -- 2. Get Pharmacy Department ID
    SELECT id INTO pharmacy_dept_id FROM public.departments WHERE department_code = 'pharmacy_logistics';

    -- 3. LINK ADMIN MENUS TO THE ADMIN DEPARTMENT
    -- This prevents them from being seen as "global" (NULL department)
    UPDATE public.menus 
    SET allowed_department_id = admin_dept_id
    WHERE path IN (
        '/admin/users',
        '/admin/access-requests',
        '/admin/departments',
        '/admin/roles',
        '/admin/hospitals',
        '/admin/memos',
        '/admin/audit-logs',
        '/admin/settings'
    ) OR label IN (
        'Manage Users',
        'Access Requests',
        'Departments',
        'Roles & Permissions',
        'Hospitals',
        'Hospital Memos',
        'Audit Logs',
        'System Settings'
    );

    -- 4. CLEAN UP PERMISSIONS
    -- Remove ANY permission for pharmacy roles on these admin menus
    FOR role_rec IN 
        SELECT id FROM public.roles 
        WHERE role_code ILIKE '%pharmacy%' 
           OR role_code ILIKE '%pharmacist%'
    LOOP
        DELETE FROM public.role_menu_access 
        WHERE role_id = role_rec.id 
        AND menu_id IN (
            SELECT id FROM public.menus WHERE allowed_department_id = admin_dept_id
        );
    END LOOP;

    -- 5. ENSURE ADMINS HAVE ACCESS TO THESE NEWLY RESTRICTED MENUS
    FOR role_rec IN 
        SELECT id FROM public.roles 
        WHERE role_code IN ('hospital_admin', 'system_admin')
    LOOP
        INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
        SELECT role_rec.id, id, true
        FROM public.menus 
        WHERE allowed_department_id = admin_dept_id
        ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
    END LOOP;

    RAISE NOTICE 'Admin menus restricted and pharmacy roles cleaned up.';
END $$;
