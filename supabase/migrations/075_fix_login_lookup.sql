-- ==========================================================================
-- MIGRATION: FIX LOGIN LOOKUP (RPC FOR ANONYMOUS ACCESS)
-- ==========================================================================
-- Problem: RLS policies prevent the login page (running as 'anon') from 
-- looking up a user's email and status using their Employee ID.
--
-- Solution: Create a SECURITY DEFINER function that allows searching for a 
-- user by employee_id without granting direct table access to 'anon'.
-- ==========================================================================

CREATE OR REPLACE FUNCTION public.get_user_by_employee_id(p_employee_id TEXT)
RETURNS SETOF public.users
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT *
    FROM public.users
    WHERE employee_id = p_employee_id
    LIMIT 1;
$$;

-- Grant access to anonymous users (for login page) and authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_by_employee_id(TEXT) TO anon, authenticated, service_role;

DO $$ 
BEGIN
    RAISE NOTICE '=== LOGIN LOOKUP FIX APPLIED ===';
END $$;
