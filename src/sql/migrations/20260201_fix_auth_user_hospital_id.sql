/**
 * Fix for missing hospital ID helper function
 * This version uses the 'public' schema to avoid permission issues with the 'auth' schema.
 */

-- 1. Create helper function in public schema
CREATE OR REPLACE FUNCTION public.get_user_hospital_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER -- Essential for function to have permissions to read public.users
SET search_path = public
AS $$
  SELECT hospital_id FROM users WHERE id = auth.uid()
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_hospital_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_hospital_id() TO service_role;

-- 2. Update RLS Policies for pharmacy_loan_records
-- We drop and recreate them to point to the new public function
DROP POLICY IF EXISTS "Users can view loan records of their hospital" ON pharmacy_loan_records;
CREATE POLICY "Users can view loan records of their hospital" ON pharmacy_loan_records
    FOR SELECT USING (hospital_id = public.get_user_hospital_id());

DROP POLICY IF EXISTS "Users can insert loan records for their hospital" ON pharmacy_loan_records;
CREATE POLICY "Users can insert loan records for their hospital" ON pharmacy_loan_records
    FOR INSERT WITH CHECK (hospital_id = public.get_user_hospital_id());

DROP POLICY IF EXISTS "Users can update loan records of their hospital" ON pharmacy_loan_records;
CREATE POLICY "Users can update loan records of their hospital" ON pharmacy_loan_records
    FOR UPDATE USING (hospital_id = public.get_user_hospital_id());

-- 3. Update RLS Policies for pharmacy_loan_returns
DROP POLICY IF EXISTS "Users can view loan returns of their hospital" ON pharmacy_loan_returns;
CREATE POLICY "Users can view loan returns of their hospital" ON pharmacy_loan_returns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pharmacy_loan_records
            WHERE pharmacy_loan_records.id = pharmacy_loan_returns.loan_id
            AND pharmacy_loan_records.hospital_id = public.get_user_hospital_id()
        )
    );

DROP POLICY IF EXISTS "Users can insert loan returns for their hospital" ON pharmacy_loan_returns;
CREATE POLICY "Users can insert loan returns for their hospital" ON pharmacy_loan_returns
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM pharmacy_loan_records
            WHERE pharmacy_loan_records.id = pharmacy_loan_returns.loan_id
            AND pharmacy_loan_records.hospital_id = public.get_user_hospital_id()
        )
    );

-- 4. Update RLS Policies for pharmacy_loan_return_items
DROP POLICY IF EXISTS "Users can view loan return items of their hospital" ON pharmacy_loan_return_items;
CREATE POLICY "Users can view loan return items of their hospital" ON pharmacy_loan_return_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pharmacy_loan_returns
            JOIN pharmacy_loan_records ON pharmacy_loan_records.id = pharmacy_loan_returns.loan_id
            WHERE pharmacy_loan_returns.id = pharmacy_loan_return_items.return_id
            AND pharmacy_loan_records.hospital_id = public.get_user_hospital_id()
        )
    );

DROP POLICY IF EXISTS "Users can insert loan return items for their hospital" ON pharmacy_loan_return_items;
CREATE POLICY "Users can insert loan return items for their hospital" ON pharmacy_loan_return_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM pharmacy_loan_returns
            JOIN pharmacy_loan_records ON pharmacy_loan_records.id = pharmacy_loan_returns.loan_id
            WHERE pharmacy_loan_returns.id = pharmacy_loan_return_items.return_id
            AND pharmacy_loan_records.hospital_id = public.get_user_hospital_id()
        )
    );
