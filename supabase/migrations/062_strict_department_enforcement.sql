-- Migration: Strict Department Enforcement
-- Description: Recursively ensures all children of Pharmacy menus are also restricted to the Pharmacy Logistics department.

DO $$
DECLARE
    pharmacy_dept_id uuid;
    admin_dept_id uuid;
    hosp_admin_role_id uuid;
    sys_admin_role_id uuid;
BEGIN
    -- 1. Get Department IDs
    SELECT id INTO pharmacy_dept_id FROM public.departments WHERE department_code ILIKE 'pharmacy_logistics';
    
    -- 2. Recursive Update for ALL descendants of Pharmacy Modules
    -- This sets allowed_department_id for children, grandchildren, etc.
    IF pharmacy_dept_id IS NOT NULL THEN
        WITH RECURSIVE pharmacy_tree AS (
            -- Base case: The known top-level modules
            SELECT id, path 
            FROM public.menus 
            WHERE path IN (
                '/financial', 
                '/procurement', 
                '/pharmacy/inventory', 
                '/distribution', 
                '/oxygen', 
                '/catalogs', 
                '/maintenance', 
                '/pharmacy/reports'
            )
            
            UNION ALL
            
            -- Recursive step: Find children of the base set
            SELECT m.id, m.path
            FROM public.menus m
            INNER JOIN pharmacy_tree pt ON m.parent_id = pt.id
        )
        UPDATE public.menus
        SET allowed_department_id = pharmacy_dept_id
        WHERE id IN (SELECT id FROM pharmacy_tree)
        AND allowed_department_id IS DISTINCT FROM pharmacy_dept_id;
    END IF;

    -- 3. Cleanup Permissions for Hospital/System Admins
    -- Remove 'can_view' for any menu restricted to Pharmacy Department
    SELECT id INTO hosp_admin_role_id FROM public.roles WHERE role_code = 'hospital_admin';
    SELECT id INTO sys_admin_role_id FROM public.roles WHERE role_code = 'system_admin';

    IF hosp_admin_role_id IS NOT NULL AND pharmacy_dept_id IS NOT NULL THEN
        DELETE FROM public.role_menu_access 
        WHERE role_id IN (hosp_admin_role_id, sys_admin_role_id)
        AND menu_id IN (
            SELECT id FROM public.menus 
            WHERE allowed_department_id = pharmacy_dept_id
        );
    END IF;

END $$;
