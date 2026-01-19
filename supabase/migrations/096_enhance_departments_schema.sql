-- Add detailed fields to departments table
ALTER TABLE departments
ADD COLUMN IF NOT EXISTS kkm_unit_code text, -- e.g. "CK-01" standard code
ADD COLUMN IF NOT EXISTS location text, -- e.g. "Level 3, Main Block"
ADD COLUMN IF NOT EXISTS unit_type text CHECK (unit_type IN ('clinical', 'clinical_support', 'non_clinical', 'admin')); -- Classification

-- Add description for FK if not exists
COMMENT ON COLUMN departments.kkm_unit_code IS 'Standard Ministry of Health unit code for reporting';
