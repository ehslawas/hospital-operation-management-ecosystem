-- Migration: 063_create_facility_drug_inventory.sql
-- Stores which drugs a facility has explicitly selected for their inventory,
-- along with facility-specific fields (stock, buffer level, batch, expiry).
-- This replaces the previous localStorage-only approach so data is shared
-- across all browsers and devices (localhost, production, mobile).

CREATE TABLE IF NOT EXISTS facility_drug_inventory (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id       UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  drug_id           UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
  facility_stock    INTEGER NOT NULL DEFAULT 0,
  min_buffer_level  INTEGER NOT NULL DEFAULT 20,
  batch_number      TEXT,
  expiry_date       TEXT,
  location          TEXT,
  notes             TEXT,
  added_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (hospital_id, drug_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fdi_hospital_id ON facility_drug_inventory(hospital_id);
CREATE INDEX IF NOT EXISTS idx_fdi_drug_id     ON facility_drug_inventory(drug_id);
CREATE INDEX IF NOT EXISTS idx_fdi_added_at    ON facility_drug_inventory(added_at DESC);

-- Auto-update updated_at on row change
CREATE TRIGGER update_facility_drug_inventory_updated_at
  BEFORE UPDATE ON facility_drug_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE facility_drug_inventory ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read/write their own hospital's facility inventory
CREATE POLICY "facility_drug_inventory_select"
  ON facility_drug_inventory FOR SELECT
  TO authenticated
  USING (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  );

CREATE POLICY "facility_drug_inventory_insert"
  ON facility_drug_inventory FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  );

CREATE POLICY "facility_drug_inventory_update"
  ON facility_drug_inventory FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  )
  WITH CHECK (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  );

CREATE POLICY "facility_drug_inventory_delete"
  ON facility_drug_inventory FOR DELETE
  TO authenticated
  USING (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  );

COMMENT ON TABLE facility_drug_inventory IS
  'Tracks which drugs a facility has explicitly selected for their inventory. '
  'Replaces localStorage so data is consistent across all browsers and devices.';
