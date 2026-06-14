-- =============================================================================
-- PENALTY SYSTEM MIGRATION
-- Adds late delivery tracking and penalty management
-- =============================================================================

-- 1. Add expected delivery date to LPO
ALTER TABLE pharmacy_lpo 
ADD COLUMN IF NOT EXISTS expected_delivery_date DATE;

-- 2. Add late tracking to receiving items
ALTER TABLE pharmacy_receiving_items 
ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS days_late INTEGER DEFAULT 0;

-- 3. Create Penalties Table
CREATE TABLE IF NOT EXISTS pharmacy_penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lpo_id UUID NOT NULL REFERENCES pharmacy_lpo(id) ON DELETE CASCADE,
  receiving_id UUID REFERENCES pharmacy_receiving(id) ON DELETE SET NULL,
  receiving_item_id UUID REFERENCES pharmacy_receiving_items(id) ON DELETE SET NULL,
  
  -- Item Details (denormalized for reporting)
  item_id UUID,
  item_name TEXT NOT NULL,
  item_code TEXT,
  item_type TEXT, -- 'drug' or 'non_drug'
  
  -- Penalty Calculation
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  days_late INTEGER NOT NULL,
  penalty_rate DECIMAL(5,4) DEFAULT 0.001, -- 0.1% per day default
  penalty_amount DECIMAL(12,2) NOT NULL,
  
  -- Workflow
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'waived', 'paid')),
  waiver_reason TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_penalties_lpo_id ON pharmacy_penalties(lpo_id);
CREATE INDEX IF NOT EXISTS idx_penalties_status ON pharmacy_penalties(status);
CREATE INDEX IF NOT EXISTS idx_penalties_created_at ON pharmacy_penalties(created_at);

-- 5. Add RLS policies
ALTER TABLE pharmacy_penalties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON pharmacy_penalties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON pharmacy_penalties
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON pharmacy_penalties
  FOR UPDATE TO authenticated USING (true);
