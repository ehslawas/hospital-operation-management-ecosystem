-- Migration: Global Permission Fix for Pharmacy Logistics
-- Description: Ensures all pharmacy-related roles have explicit view access to all necessary menus.

DO $$
DECLARE
    role_id_var uuid;
    menu_id_var uuid;
BEGIN
    -- 1. Ensure all pharmacy roles exist and have access
    FOR role_id_var IN 
        SELECT id FROM public.roles 
        WHERE role_code IN (
            'system_admin', 
            'hospital_admin', 
            'pharmacy_director', 
            'pharmacy_manager', 
            'pharmacist', 
            'pharmacy_assistant', 
            'pharmacy_storekeeper', 
            'pharmacy_staff'
        )
    LOOP
        -- Grant access to every menu that lacks specific department restrictions 
        -- OR is specifically allowed for Pharmacy Logistics
        FOR menu_id_var IN 
            SELECT id FROM public.menus 
            WHERE allowed_department_id IS NULL 
               OR allowed_department_id IN (SELECT id FROM public.departments WHERE department_code = 'PHARMACY_LOGISTICS')
        LOOP
            INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
            VALUES (role_id_var, menu_id_var, true)
            ON CONFLICT (role_id, menu_id) 
            DO UPDATE SET can_view = true;
        END LOOP;
    END LOOP;
    
    -- 2. Standardize paths to have leading slash just in case
    UPDATE public.menus SET path = '/' || ltrim(path, '/') WHERE path != '#' AND path NOT LIKE '/%';

END $$;
