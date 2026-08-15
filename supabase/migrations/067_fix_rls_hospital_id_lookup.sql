-- Migration: 067_fix_rls_hospital_id_lookup.sql
-- Root cause: All RLS policies that used auth.jwt() ->> 'hospital_id' were broken
-- because hospital_id is NOT stored as a JWT claim — it lives in public.users table.
--
-- Fix: Create a SECURITY DEFINER helper function get_my_hospital_id() that
-- safely resolves the current user's hospital_id from public.users using auth.uid().
-- All affected policies are rebuilt to use this function instead.

-- ── Helper function ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_my_hospital_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT hospital_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- ── facility_drug_inventory ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS facility_drug_inventory_insert ON facility_drug_inventory;
DROP POLICY IF EXISTS facility_drug_inventory_select ON facility_drug_inventory;
DROP POLICY IF EXISTS facility_drug_inventory_update ON facility_drug_inventory;
DROP POLICY IF EXISTS facility_drug_inventory_delete ON facility_drug_inventory;

CREATE POLICY facility_drug_inventory_select
  ON facility_drug_inventory FOR SELECT
  USING (hospital_id = get_my_hospital_id());

CREATE POLICY facility_drug_inventory_insert
  ON facility_drug_inventory FOR INSERT
  WITH CHECK (hospital_id = get_my_hospital_id());

CREATE POLICY facility_drug_inventory_update
  ON facility_drug_inventory FOR UPDATE
  USING (hospital_id = get_my_hospital_id())
  WITH CHECK (hospital_id = get_my_hospital_id());

CREATE POLICY facility_drug_inventory_delete
  ON facility_drug_inventory FOR DELETE
  USING (hospital_id = get_my_hospital_id());

-- ── appl_approved_suppliers ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow authenticated users to insert/update approved suppliers" ON appl_approved_suppliers;
DROP POLICY IF EXISTS "Allow authenticated users to read approved suppliers" ON appl_approved_suppliers;

CREATE POLICY "appl_approved_suppliers_select"
  ON appl_approved_suppliers FOR SELECT
  USING (hospital_id = get_my_hospital_id());

CREATE POLICY "appl_approved_suppliers_all"
  ON appl_approved_suppliers FOR ALL
  USING (hospital_id = get_my_hospital_id())
  WITH CHECK (hospital_id = get_my_hospital_id());

-- ── appl_sync_logs ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow authenticated users to write sync logs" ON appl_sync_logs;
DROP POLICY IF EXISTS "Allow authenticated users to read sync logs" ON appl_sync_logs;

CREATE POLICY "appl_sync_logs_select"
  ON appl_sync_logs FOR SELECT
  USING (hospital_id = get_my_hospital_id());

CREATE POLICY "appl_sync_logs_insert"
  ON appl_sync_logs FOR INSERT
  WITH CHECK (hospital_id = get_my_hospital_id());
