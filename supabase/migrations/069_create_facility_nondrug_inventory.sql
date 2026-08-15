-- Migration: 069_create_facility_nondrug_inventory.sql
-- Stores which non-drug items a facility has explicitly selected for their
-- inventory, along with facility-specific fields (stock, buffer level, notes).
-- This replaces the previous localStorage-only approach so data is shared
-- across all browsers and devices (localhost, production, mobile).
-- Mirrors the pattern used in 063_create_facility_drug_inventory.sql.

CREATE TABLE IF NOT EXISTS facility_nondrug_inventory (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id       UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  nondrug_id        UUID NOT NULL REFERENCES non_drugs(id) ON DELETE CASCADE,
  facility_stock    INTEGER NOT NULL DEFAULT 0,
  min_buffer_level  INTEGER NOT NULL DEFAULT 10,
  notes             TEXT,
  added_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (hospital_id, nondrug_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fndi_hospital_id ON facility_nondrug_inventory(hospital_id);
CREATE INDEX IF NOT EXISTS idx_fndi_nondrug_id  ON facility_nondrug_inventory(nondrug_id);
CREATE INDEX IF NOT EXISTS idx_fndi_added_at    ON facility_nondrug_inventory(added_at DESC);

-- Auto-update updated_at on row change (reuses existing trigger function)
CREATE TRIGGER update_facility_nondrug_inventory_updated_at
  BEFORE UPDATE ON facility_nondrug_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE facility_nondrug_inventory ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own hospital's facility non-drug inventory
CREATE POLICY "facility_nondrug_inventory_select"
  ON facility_nondrug_inventory FOR SELECT
  TO authenticated
  USING (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  );

CREATE POLICY "facility_nondrug_inventory_insert"
  ON facility_nondrug_inventory FOR INSERT
  TO authenticated
  WITH CHECK (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  );

CREATE POLICY "facility_nondrug_inventory_update"
  ON facility_nondrug_inventory FOR UPDATE
  TO authenticated
  USING (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  )
  WITH CHECK (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  );

CREATE POLICY "facility_nondrug_inventory_delete"
  ON facility_nondrug_inventory FOR DELETE
  TO authenticated
  USING (
    hospital_id = (auth.jwt() ->> 'hospital_id')::UUID
    OR (auth.jwt() ->> 'role') = 'super_admin'
  );

COMMENT ON TABLE facility_nondrug_inventory IS
  'Tracks which non-drug items a facility has explicitly selected for their inventory. '
  'Replaces localStorage so data is consistent across all browsers and devices.';
