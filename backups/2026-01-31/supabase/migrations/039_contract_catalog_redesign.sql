-- Migration: Contract Catalog Redesign
-- Description: Restructure contracts table for Excel upload approach
-- Remove Google Sheets specific columns and add contract catalog specific fields

-- ============================================
-- 1. CLEAN UP GOOGLE SHEETS COLUMNS
-- ============================================

-- Drop Google Sheets specific columns (no longer needed)
ALTER TABLE contracts DROP COLUMN IF EXISTS google_sheet_row_index;
ALTER TABLE contracts DROP COLUMN IF EXISTS sync_hash;
ALTER TABLE contracts DROP COLUMN IF EXISTS last_synced_at;

-- ============================================
-- 2. RESTRUCTURE EXISTING COLUMNS
-- ============================================

-- Rename contract_name to item_name for consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'contract_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'item_name'
  ) THEN
    ALTER TABLE contracts RENAME COLUMN contract_name TO item_name;
  END IF;
END $$;

-- Rename total_value to unit_price for clarity
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'total_value'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'unit_price'
  ) THEN
    ALTER TABLE contracts RENAME COLUMN total_value TO unit_price;
  END IF;
END $$;

-- ============================================
-- 3. ADD NEW COLUMNS FOR CONTRACT CATALOG
-- ============================================

DO $$
BEGIN
  -- item_code: Item identification code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'item_code'
  ) THEN
    ALTER TABLE contracts ADD COLUMN item_code TEXT;
  END IF;

  -- unit: Unit of measure (e.g., Box, Pack, Each)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'unit'
  ) THEN
    ALTER TABLE contracts ADD COLUMN unit TEXT;
  END IF;

  -- delivery_period: Expected delivery timeframe (Tempoh Serahan)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'delivery_period'
  ) THEN
    ALTER TABLE contracts ADD COLUMN delivery_period TEXT;
  END IF;

  -- sst_rate: Sales and Service Tax rate or amount
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'sst_rate'
  ) THEN
    ALTER TABLE contracts ADD COLUMN sst_rate TEXT;
  END IF;

  -- uploaded_file_id: Link to uploaded_files table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'uploaded_file_id'
  ) THEN
    ALTER TABLE contracts ADD COLUMN uploaded_file_id UUID REFERENCES uploaded_files(id) ON DELETE SET NULL;
  END IF;

END $$;

-- ============================================
-- 4. UPDATE COLUMN CONSTRAINTS
-- ============================================

-- Make item_name NOT NULL if it isn't already
ALTER TABLE contracts ALTER COLUMN item_name SET NOT NULL;

-- Set default for status if not set
ALTER TABLE contracts ALTER COLUMN status SET DEFAULT 'active';

-- Ensure currency defaults to MYR
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'currency'
  ) THEN
    ALTER TABLE contracts ALTER COLUMN currency SET DEFAULT 'MYR';
  END IF;
END $$;

-- ============================================
-- 5. UPDATE UPLOADED_FILES CATALOG TYPE
-- ============================================

-- Add 'contract' to catalog_type enum
ALTER TABLE uploaded_files DROP CONSTRAINT IF EXISTS uploaded_files_catalog_type_check;
ALTER TABLE uploaded_files ADD CONSTRAINT uploaded_files_catalog_type_check 
  CHECK (catalog_type IN ('drug', 'non_drug', 'contract'));

-- ============================================
-- 6. CREATE/UPDATE INDEXES
-- ============================================

-- Index on item_code for fast lookups
CREATE INDEX IF NOT EXISTS idx_contracts_item_code ON contracts(item_code);

-- Index on supplier_name for filtering
CREATE INDEX IF NOT EXISTS idx_contracts_supplier_name ON contracts(supplier_name);

-- Index on dates for expiry queries
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);

-- Index on uploaded_file_id for tracking
CREATE INDEX IF NOT EXISTS idx_contracts_uploaded_file_id ON contracts(uploaded_file_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_contracts_hospital_status ON contracts(hospital_id, status);

-- ============================================
-- 7. UPDATE ROW LEVEL SECURITY
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Drop old policy if exists and recreate
DROP POLICY IF EXISTS hospital_scoped_contracts ON contracts;

CREATE POLICY hospital_scoped_contracts ON contracts
  FOR ALL USING (
    hospital_id = (
      SELECT hospital_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================
-- 8. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get contract status based on dates
CREATE OR REPLACE FUNCTION get_contract_status(
  p_start_date DATE,
  p_end_date DATE,
  p_current_status TEXT
) RETURNS TEXT AS $$
BEGIN
  -- If manually set to inactive, respect that
  IF p_current_status = 'inactive' THEN
    RETURN 'inactive';
  END IF;

  -- If end_date is in the past, mark as expired
  IF p_end_date IS NOT NULL AND p_end_date < CURRENT_DATE THEN
    RETURN 'expired';
  END IF;

  -- If end_date is within 30 days, mark as expiring
  IF p_end_date IS NOT NULL AND p_end_date <= CURRENT_DATE + INTERVAL '30 days' THEN
    RETURN 'expiring';
  END IF;

  -- If start_date is in the future, mark as pending
  IF p_start_date IS NOT NULL AND p_start_date > CURRENT_DATE THEN
    RETURN 'pending';
  END IF;

  -- Otherwise, active
  RETURN 'active';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 9. CREATE VIEW FOR ENHANCED CONTRACT DATA
-- ============================================

CREATE OR REPLACE VIEW contracts_view AS
SELECT 
  c.*,
  get_contract_status(c.start_date, c.end_date, c.status) as computed_status,
  CASE 
    WHEN c.end_date IS NOT NULL AND c.end_date < CURRENT_DATE THEN 
      'Expired'
    WHEN c.end_date IS NOT NULL AND c.end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 
      'Expiring Soon'
    WHEN c.start_date IS NOT NULL AND c.start_date > CURRENT_DATE THEN 
      'Pending'
    ELSE 
      'Active'
  END as status_label,
  CASE 
    WHEN c.end_date IS NOT NULL THEN 
      c.end_date - CURRENT_DATE
  END as days_until_expiry,
  s.supplier_name as linked_supplier_name,
  s.contact_person as supplier_contact,
  s.contact_email as supplier_email,
  s.contact_phone as supplier_phone,
  uf.file_name as source_file_name,
  uf.uploaded_at as import_date
FROM contracts c
LEFT JOIN suppliers s ON c.supplier_id = s.id
LEFT JOIN uploaded_files uf ON c.uploaded_file_id = uf.id;

-- ============================================
-- 10. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE contracts IS 'Contract catalog for hospital procurement contracts';
COMMENT ON COLUMN contracts.item_name IS 'Name of the contracted item or service';
COMMENT ON COLUMN contracts.item_code IS 'Optional item identification code';
COMMENT ON COLUMN contracts.contract_number IS 'Unique contract identifier (e.g., .31.123.75.22-May-2028)';
COMMENT ON COLUMN contracts.start_date IS 'Contract start date (Kontrak Mula)';
COMMENT ON COLUMN contracts.end_date IS 'Contract end date (Kontrak Tamat)';
COMMENT ON COLUMN contracts.supplier_name IS 'Supplier/vendor name (Pembekal)';
COMMENT ON COLUMN contracts.unit IS 'Unit of measure (e.g., Box, Pack, Each)';
COMMENT ON COLUMN contracts.unit_price IS 'Price per unit in specified currency';
COMMENT ON COLUMN contracts.delivery_period IS 'Expected delivery timeframe (Tempoh Serahan)';
COMMENT ON COLUMN contracts.sst_rate IS 'Sales and Service Tax rate or amount';
COMMENT ON COLUMN contracts.metadata IS 'Additional data stored as JSON (notes, custom fields, etc.)';
COMMENT ON COLUMN contracts.uploaded_file_id IS 'Reference to the file that imported this contract';

-- ============================================
-- 11. GRANT PERMISSIONS
-- ============================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON contracts TO authenticated;
GRANT SELECT ON contracts_view TO authenticated;

-- ============================================
-- Migration Complete
-- ============================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE '✓ Contract Catalog Redesign Migration Complete';
  RAISE NOTICE '  - Removed Google Sheets columns';
  RAISE NOTICE '  - Added Excel upload columns';
  RAISE NOTICE '  - Created indexes and views';
  RAISE NOTICE '  - Updated RLS policies';
END $$;
