-- Migration: Fix Contracts Table
-- Description: Ensures the contracts table exists and has all the necessary columns for the Google Sheets sync.

-- 1. Create the table if it doesn't exist (minimal structure)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  contract_number TEXT,
  contract_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Add columns if they are missing
DO $$ 
BEGIN
  -- contract_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'contract_type') THEN
    ALTER TABLE contracts ADD COLUMN contract_type TEXT;
  END IF;

  -- supplier_name (denormalized name from sheet)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'supplier_name') THEN
    ALTER TABLE contracts ADD COLUMN supplier_name TEXT;
  END IF;

  -- supplier_id (link to suppliers table)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'supplier_id') THEN
    ALTER TABLE contracts ADD COLUMN supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
  END IF;

  -- start_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'start_date') THEN
    ALTER TABLE contracts ADD COLUMN start_date DATE;
  END IF;

  -- end_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'end_date') THEN
    ALTER TABLE contracts ADD COLUMN end_date DATE;
  END IF;

  -- total_value
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'total_value') THEN
    ALTER TABLE contracts ADD COLUMN total_value DECIMAL(15,2);
  END IF;

  -- currency
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'currency') THEN
    ALTER TABLE contracts ADD COLUMN currency TEXT DEFAULT 'MYR';
  END IF;

  -- metadata (for JSON data like sst, tempoh_serahan)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'metadata') THEN
    ALTER TABLE contracts ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- google_sheet_row_index
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'google_sheet_row_index') THEN
    ALTER TABLE contracts ADD COLUMN google_sheet_row_index INTEGER;
  END IF;

  -- sync_hash
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'sync_hash') THEN
    ALTER TABLE contracts ADD COLUMN sync_hash TEXT;
  END IF;

  -- last_synced_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'last_synced_at') THEN
    ALTER TABLE contracts ADD COLUMN last_synced_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- document_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'document_url') THEN
    ALTER TABLE contracts ADD COLUMN document_url TEXT;
  END IF;

END $$;

-- 3. Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contracts' AND policyname = 'hospital_scoped_contracts') THEN
    CREATE POLICY hospital_scoped_contracts ON contracts
      FOR ALL USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- 5. Create Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_hospital_id ON contracts(hospital_id);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
