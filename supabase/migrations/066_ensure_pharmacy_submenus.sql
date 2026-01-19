-- Migration: Ensure Pharmacy Submenus
-- Description: Explicitly ensures all children of pharmacy modules have correct department and role access.
-- Fixes: Missing chevrons/submenus for Inventory, Distribution, and Medical Oxygen.

DO $$
DECLARE
    pharmacy_dept_id uuid;
    permission_count integer;
    update_count integer;
BEGIN
    -- 1. Get Pharmacy Department ID
    SELECT id INTO pharmacy_dept_id FROM public.departments WHERE department_code = 'pharmacy_logistics';
    
    IF pharmacy_dept_id IS NULL THEN
        RAISE EXCEPTION 'Pharmacy Logistics department not found';
    END IF;

    -- 2. RECURSIVE DEPARTMENT FIX
    -- Ensure every child, grandchild, etc. of the main pharmacy sections belongs to the pharmacy department.
    WITH RECURSIVE pharmacy_hierarchy AS (
        -- Root segments
        SELECT id FROM public.menus 
        WHERE path IN ('/inventory', '/procurement', '/financial', '/distribution', '/oxygen', '/catalogs')
        OR label IN ('Inventory', 'Distribution', 'Medical Oxygen', 'Financial', 'Procurement', 'Catalogs')
        
        UNION ALL
        
        -- Children
        SELECT m.id FROM public.menus m
        JOIN pharmacy_hierarchy ph ON m.parent_id = ph.id
    )
    UPDATE public.menus 
    SET allowed_department_id = pharmacy_dept_id
    WHERE id IN (SELECT id FROM pharmacy_hierarchy);
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE 'Department Link Fix: % menus updated.', update_count;

    -- 3. FORCED PERMISSION GRANT
    -- Ensure every pharmacy role has view access to every menu linked to the pharmacy department.
    INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
    SELECT r.id, m.id, true
    FROM public.roles r, public.menus m
    WHERE (r.role_code ILIKE '%pharmacy%' OR r.role_code ILIKE '%pharmacist%')
    AND m.allowed_department_id = pharmacy_dept_id
    ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
    
    GET DIAGNOSTICS permission_count = ROW_COUNT;
    RAISE NOTICE 'Permission Grant Fix: % entries updated.', permission_count;

    RAISE NOTICE 'Pharmacy submenus have been restored.';
END $$;
