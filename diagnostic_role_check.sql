
-- 1. Get the Role ID for 'Assistant Pharmacist'
DO $$
DECLARE
    v_role_id uuid;
    v_role_name text := 'Assistant Pharmacist'; -- Adjust if necessary based on exact name from screenshot
    v_role_code text;
    v_count integer;
BEGIN
    SELECT id, role_code INTO v_role_id, v_role_code
    FROM roles
    WHERE role_name = v_role_name OR role_code = 'assistant_pharmacist'
    LIMIT 1;

    RAISE NOTICE 'Role Info: ID=%, Name=%, Code=%', v_role_id, v_role_name, v_role_code;

    -- 2. Check Role Permissions for this Role
    RAISE NOTICE '--- Role Permissions ---';
    FOR v_count IN 
        SELECT count(*) 
        FROM role_permissions 
        WHERE role_id = v_role_id
    LOOP
        RAISE NOTICE 'Total Permission Entries: %', v_count;
    END LOOP;
    
    -- List distinct modules they have view access to
    RAISE NOTICE '--- Accessible Modules (can_view = true) ---';
    -- This is a simplified check, adjust table names if using 'role_modules' vs 'role_permissions' logic
    -- Assuming role_permissions links to modules via module_id
    
    -- If using the new RBAC schema where permissions are directly on role_permissions
    -- Check what the user *should* see
    
    -- 3. Check Modules Table existence
    RAISE NOTICE '--- Modules Table Check ---';
    SELECT count(*) INTO v_count FROM modules;
    RAISE NOTICE 'Total Modules in System: %', v_count;
    
END $$;
