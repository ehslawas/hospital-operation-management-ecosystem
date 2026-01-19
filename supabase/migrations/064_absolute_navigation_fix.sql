-- Migration: Absolute Navigation Fix
-- Description: 1. Grants pharmacy permissions to all pharmacy roles.
--              2. Fixes RLS policies to allow "View Mode" role switching.

DO $$
DECLARE
    pharmacy_dept_id uuid;
    permission_count integer;
BEGIN
    -- 1. Get Pharmacy Department ID
    SELECT id INTO pharmacy_dept_id FROM public.departments WHERE department_code = 'pharmacy_logistics';
    
    IF pharmacy_dept_id IS NULL THEN
        RAISE NOTICE 'Warning: pharmacy_logistics department not found. Skipping permission grant portion.';
    ELSE
        -- 2. Force Insert Permissions for all pharmacy-related roles
        -- This covers pharmacist, assistant, staff, etc.
        INSERT INTO public.role_menu_access (role_id, menu_id, can_view)
        SELECT r.id, m.id, true
        FROM public.roles r, public.menus m
        WHERE (r.role_code ILIKE '%pharmacy%' OR r.role_code ILIKE '%pharmacist%')
        AND (m.allowed_department_id IS NULL OR m.allowed_department_id = pharmacy_dept_id)
        ON CONFLICT (role_id, menu_id) DO UPDATE SET can_view = true;
        
        GET DIAGNOSTICS permission_count = ROW_COUNT;
        RAISE NOTICE 'Permission Grant: % rows inserted/updated.', permission_count;
    END IF;

    -- 3. BROADEN RLS POLICIES
    -- For "View Mode" to work, an Admin must be able to read what a Pharmacist sees.
    -- If the policy is "only see your own role", switching view breaks.
    
    RAISE NOTICE 'Updating RLS Policies for cross-role visibility...';

    -- Enable RLS just in case it's disabled or needed
    ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.role_menu_access ENABLE ROW LEVEL SECURITY;

    -- Drop restrictive policies if they exist (common names used in Supabase)
    DROP POLICY IF EXISTS "Users can view their own role access" ON public.role_menu_access;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.role_menu_access;
    DROP POLICY IF EXISTS "Authenticated users can read all menu access" ON public.role_menu_access;
    
    DROP POLICY IF EXISTS "Users can view menus" ON public.menus;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.menus;

    -- Create clean, permissive policies for READ ONLY
    CREATE POLICY "Allow authenticated read for role_menu_access" 
    ON public.role_menu_access FOR SELECT 
    USING (auth.role() = 'authenticated');

    CREATE POLICY "Allow authenticated read for menus" 
    ON public.menus FOR SELECT 
    USING (auth.role() = 'authenticated');

    RAISE NOTICE 'Absolute Navigation Fix Complete.';
END $$;
