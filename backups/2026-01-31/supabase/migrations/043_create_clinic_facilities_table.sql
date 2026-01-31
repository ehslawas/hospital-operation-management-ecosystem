-- Migration: Create Clinic Facilities Table
-- Description: Create table for storing clinic facilities catalog from MOH Malaysia
-- This table stores clinics from the MOH database: https://www.moh.gov.my/index.php/pages/view/4378?mid=1451

-- ============================================
-- 1. CREATE CLINIC FACILITIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS clinic_facilities (
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
  
  -- Prevent duplicate clinics with same name in same hospital_id context
  UNIQUE(hospital_id, name)
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

-- Index on hospital_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_clinic_facilities_hospital_id ON clinic_facilities(hospital_id);

-- Index on name for searching
CREATE INDEX IF NOT EXISTS idx_clinic_facilities_name ON clinic_facilities(name);

-- Index on state for filtering
CREATE INDEX IF NOT EXISTS idx_clinic_facilities_state ON clinic_facilities(state);

-- Index on city for filtering
CREATE INDEX IF NOT EXISTS idx_clinic_facilities_city ON clinic_facilities(city);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_clinic_facilities_status ON clinic_facilities(status);

-- Index on MOH ID for tracking
CREATE INDEX IF NOT EXISTS idx_clinic_facilities_moh_id ON clinic_facilities(moh_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_clinic_facilities_hospital_status ON clinic_facilities(hospital_id, status);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE clinic_facilities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Policy: Users can view all clinic facilities in their hospital
CREATE POLICY "Users can view clinic facilities in their hospital"
  ON clinic_facilities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.hospital_id = clinic_facilities.hospital_id
    )
  );

-- Policy: Users can insert clinic facilities in their hospital
CREATE POLICY "Users can insert clinic facilities in their hospital"
  ON clinic_facilities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.hospital_id = clinic_facilities.hospital_id
    )
  );

-- Policy: Users can update clinic facilities in their hospital
CREATE POLICY "Users can update clinic facilities in their hospital"
  ON clinic_facilities
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.hospital_id = clinic_facilities.hospital_id
    )
  );

-- Policy: Users can delete clinic facilities in their hospital
CREATE POLICY "Users can delete clinic facilities in their hospital"
  ON clinic_facilities
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.hospital_id = clinic_facilities.hospital_id
    )
  );

-- ============================================
-- 5. CREATE TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_clinic_facilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clinic_facilities_updated_at
  BEFORE UPDATE ON clinic_facilities
  FOR EACH ROW
  EXECUTE FUNCTION update_clinic_facilities_updated_at();

