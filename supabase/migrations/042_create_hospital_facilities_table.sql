-- Migration: Create Hospital Facilities Table
-- Description: Create table for storing hospital facilities catalog from MOH Malaysia
-- This table stores hospitals from the MOH database: https://www.moh.gov.my/index.php/database_stores/store_view/82

-- ============================================
-- 1. CREATE HOSPITAL FACILITIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS hospital_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  phone TEXT,
  email TEXT,
  facility_code TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  metadata JSONB,
  moh_id TEXT, -- ID from MOH website if fetched from there
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate hospitals with same name in same hospital_id context
  UNIQUE(hospital_id, name)
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

-- Index on hospital_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_hospital_facilities_hospital_id ON hospital_facilities(hospital_id);

-- Index on name for searching
CREATE INDEX IF NOT EXISTS idx_hospital_facilities_name ON hospital_facilities(name);

-- Index on state for filtering
CREATE INDEX IF NOT EXISTS idx_hospital_facilities_state ON hospital_facilities(state);

-- Index on city for filtering
CREATE INDEX IF NOT EXISTS idx_hospital_facilities_city ON hospital_facilities(city);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_hospital_facilities_status ON hospital_facilities(status);

-- Index on MOH ID for tracking
CREATE INDEX IF NOT EXISTS idx_hospital_facilities_moh_id ON hospital_facilities(moh_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_hospital_facilities_hospital_status ON hospital_facilities(hospital_id, status);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE hospital_facilities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Policy: Users can view all hospital facilities in their hospital
CREATE POLICY "Users can view hospital facilities in their hospital"
  ON hospital_facilities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.hospital_id = hospital_facilities.hospital_id
    )
  );

-- Policy: Users can insert hospital facilities in their hospital
CREATE POLICY "Users can insert hospital facilities in their hospital"
  ON hospital_facilities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.hospital_id = hospital_facilities.hospital_id
    )
  );

-- Policy: Users can update hospital facilities in their hospital
CREATE POLICY "Users can update hospital facilities in their hospital"
  ON hospital_facilities
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.hospital_id = hospital_facilities.hospital_id
    )
  );

-- Policy: Users can delete hospital facilities in their hospital
CREATE POLICY "Users can delete hospital facilities in their hospital"
  ON hospital_facilities
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.hospital_id = hospital_facilities.hospital_id
    )
  );

-- ============================================
-- 5. CREATE TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_hospital_facilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hospital_facilities_updated_at
  BEFORE UPDATE ON hospital_facilities
  FOR EACH ROW
  EXECUTE FUNCTION update_hospital_facilities_updated_at();

