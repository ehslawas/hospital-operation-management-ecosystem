-- Supabase Migration: 061_appl_sync_tables.sql
-- Prepare schema for Google Sheets APPL Sync module

-- 1. Extend dosage_form check constraint on drugs table
ALTER TABLE drugs DROP CONSTRAINT IF EXISTS drugs_dosage_form_check;

ALTER TABLE drugs ADD CONSTRAINT drugs_dosage_form_check CHECK (
  dosage_form IN (
    'tablet', 'capsule', 'injection', 'syrup', 'suspension', 
    'cream', 'ointment', 'drops', 'inhaler', 'patch', 'suppository', 
    'powder', 'solution', 'lotion', 'liquid', 'granules', 'spray', 
    'enema', 'gel', 'aerosol', 'other'
  )
);

-- 2. Add APPL-specific metadata fields to drugs table
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS appl_kod TEXT;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS appl_code TEXT;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS mal_mda_number TEXT;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS moq TEXT;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS price_transition DECIMAL(10, 2);
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS price_next DECIMAL(10, 2);
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS appl_effective_date DATE;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS country_of_origin TEXT;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS last_synced_from_sheet TIMESTAMP WITH TIME ZONE;
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS sheet_source TEXT;

-- 3. Create approved suppliers table for APPL items
CREATE TABLE IF NOT EXISTS appl_approved_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  drug_code TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  manufacturer_name TEXT,
  country_of_origin TEXT,
  brand_name TEXT,
  mal_mda_number TEXT,
  procurement_scheme TEXT,
  appl_effective_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (hospital_id, drug_code, supplier_name)
);

-- Indexes for appl_approved_suppliers
CREATE INDEX IF NOT EXISTS idx_appl_approved_suppliers_hospital ON appl_approved_suppliers(hospital_id);
CREATE INDEX IF NOT EXISTS idx_appl_approved_suppliers_drug_id ON appl_approved_suppliers(drug_id);
CREATE INDEX IF NOT EXISTS idx_appl_approved_suppliers_code ON appl_approved_suppliers(drug_code);
CREATE INDEX IF NOT EXISTS idx_appl_approved_suppliers_name ON appl_approved_suppliers(supplier_name);

-- 4. Create sync logs table
CREATE TABLE IF NOT EXISTS appl_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  sheet_tab TEXT NOT NULL DEFAULT 'Lampiran B',
  rows_fetched INTEGER DEFAULT 0,
  drugs_upserted INTEGER DEFAULT 0,
  suppliers_upserted INTEGER DEFAULT 0,
  error_details JSONB,
  triggered_by TEXT DEFAULT 'cron' CHECK (triggered_by IN ('cron', 'manual', 'system'))
);

-- Indexes for appl_sync_logs
CREATE INDEX IF NOT EXISTS idx_appl_sync_logs_hospital ON appl_sync_logs(hospital_id);
CREATE INDEX IF NOT EXISTS idx_appl_sync_logs_synced_at ON appl_sync_logs(synced_at DESC);

-- Enable RLS for new tables
ALTER TABLE appl_approved_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appl_sync_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies (following the pattern of existing catalog/inventory tables)
CREATE POLICY "Allow authenticated users to read approved suppliers"
  ON appl_approved_suppliers FOR SELECT
  TO authenticated
  USING (hospital_id = (auth.jwt() ->> 'hospital_id')::UUID OR (auth.jwt() ->> 'role'::text) = 'super_admin');

CREATE POLICY "Allow authenticated users to insert/update approved suppliers"
  ON appl_approved_suppliers FOR ALL
  TO authenticated
  USING (hospital_id = (auth.jwt() ->> 'hospital_id')::UUID OR (auth.jwt() ->> 'role'::text) = 'super_admin')
  WITH CHECK (hospital_id = (auth.jwt() ->> 'hospital_id')::UUID OR (auth.jwt() ->> 'role'::text) = 'super_admin');

CREATE POLICY "Allow authenticated users to read sync logs"
  ON appl_sync_logs FOR SELECT
  TO authenticated
  USING (hospital_id = (auth.jwt() ->> 'hospital_id')::UUID OR (auth.jwt() ->> 'role'::text) = 'super_admin');

CREATE POLICY "Allow authenticated users to write sync logs"
  ON appl_sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (hospital_id = (auth.jwt() ->> 'hospital_id')::UUID OR (auth.jwt() ->> 'role'::text) = 'super_admin');

-- Add triggers for updated_at on approved suppliers
CREATE TRIGGER update_appl_approved_suppliers_updated_at
  BEFORE UPDATE ON appl_approved_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
