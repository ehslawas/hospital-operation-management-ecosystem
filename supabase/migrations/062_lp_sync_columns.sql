-- Supabase Migration: 062_lp_sync_columns.sql
-- Prepare schema for Google Sheets LP Sync module

-- 1. Add LP-specific metadata fields to drugs table
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS lp_quota INTEGER;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS lp_balance INTEGER;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS lp_rx_category TEXT;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS lp_type TEXT CHECK (lp_type IN ('sebut_harga_lq', 'cfln'));
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS lp_start_date DATE;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS lp_end_date DATE;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS lp_remarks TEXT;

-- 2. Add LP-specific metadata fields to non_drugs table
ALTER TABLE non_drugs ADD COLUMN IF NOT EXISTS lp_quota INTEGER;
ALTER TABLE non_drugs ADD COLUMN IF NOT EXISTS lp_balance INTEGER;
ALTER TABLE non_drugs ADD COLUMN IF NOT EXISTS lp_type TEXT DEFAULT 'non_drug';
ALTER TABLE non_drugs ADD COLUMN IF NOT EXISTS lp_start_date DATE;
ALTER TABLE non_drugs ADD COLUMN IF NOT EXISTS lp_end_date DATE;
ALTER TABLE non_drugs ADD COLUMN IF NOT EXISTS lp_remarks TEXT;

-- 3. Create sync logs table for LP items
CREATE TABLE IF NOT EXISTS lp_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  sheet_tab TEXT NOT NULL,
  rows_fetched INTEGER DEFAULT 0,
  drugs_upserted INTEGER DEFAULT 0,
  non_drugs_upserted INTEGER DEFAULT 0,
  error_details JSONB,
  triggered_by TEXT DEFAULT 'manual' CHECK (triggered_by IN ('cron', 'manual', 'system'))
);

-- Indexes for lp_sync_logs
CREATE INDEX IF NOT EXISTS idx_lp_sync_logs_hospital ON lp_sync_logs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_lp_sync_logs_synced_at ON lp_sync_logs(synced_at DESC);

-- Enable RLS for lp_sync_logs
ALTER TABLE lp_sync_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies (following the pattern of existing sync logs tables)
CREATE POLICY "Allow authenticated users to read LP sync logs"
  ON lp_sync_logs FOR SELECT
  TO authenticated
  USING (hospital_id = (auth.jwt() ->> 'hospital_id')::UUID OR (auth.jwt() ->> 'role'::text) = 'super_admin');

CREATE POLICY "Allow authenticated users to write LP sync logs"
  ON lp_sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (hospital_id = (auth.jwt() ->> 'hospital_id')::UUID OR (auth.jwt() ->> 'role'::text) = 'super_admin');
