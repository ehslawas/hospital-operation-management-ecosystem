-- Migration: Procurement Tables and Columns (Revised)
-- Description: Creates missing tables and adds missing columns for the procurement module with accurate field names.

-- ============================================
-- 1. Pharmacy Budgets Table
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  budget_type VARCHAR(30) NOT NULL, -- appl, cc, dp, lp
  category VARCHAR(50) NOT NULL, -- drug, non_drug, equipment, operational
  allocated_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  utilized_amount DECIMAL(15,2) DEFAULT 0,
  committed_amount DECIMAL(15,2) DEFAULT 0,
  available_amount DECIMAL(15,2) GENERATED ALWAYS AS (allocated_amount - utilized_amount - committed_amount) STORED,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for pharmacy_budgets
CREATE INDEX IF NOT EXISTS idx_pharmacy_budgets_hospital_id ON pharmacy_budgets(hospital_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_budgets_fiscal_year ON pharmacy_budgets(fiscal_year);

-- ============================================
-- 2. Pharmacy Warrants Table
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_warrants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  warrant_date DATE NOT NULL,
  document_no TEXT NOT NULL,
  vote_code TEXT NOT NULL,
  vote_activity TEXT NOT NULL,
  category TEXT NOT NULL,
  department TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, document_no, vote_code, department)
);

-- Index for pharmacy_warrants
CREATE INDEX IF NOT EXISTS idx_pharmacy_warrants_hospital_id ON pharmacy_warrants(hospital_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_warrants_vote_code ON pharmacy_warrants(vote_code);

-- ============================================
-- 3. Update Pharmacy Purchase Orders Table
-- ============================================
-- Ensure the table exists
CREATE TABLE IF NOT EXISTS pharmacy_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  po_type TEXT NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, po_number)
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- budget_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'budget_id') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN budget_id UUID REFERENCES pharmacy_budgets(id);
  END IF;

  -- vote_code
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'vote_code') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN vote_code TEXT;
  END IF;

  -- vote_activity
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'vote_activity') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN vote_activity TEXT;
  END IF;

  -- category
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'category') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN category TEXT;
  END IF;

  -- department
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'department') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN department TEXT;
  END IF;

  -- expected_delivery_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'expected_delivery_date') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN expected_delivery_date DATE;
  END IF;

  -- actual_delivery_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'actual_delivery_date') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN actual_delivery_date DATE;
  END IF;

  -- subtotal
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'subtotal') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN subtotal DECIMAL(15,2) DEFAULT 0;
  END IF;

  -- tax_amount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'tax_amount') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN tax_amount DECIMAL(15,2) DEFAULT 0;
  END IF;

  -- total_amount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'total_amount') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN total_amount DECIMAL(15,2) DEFAULT 0;
  END IF;

  -- payment_terms
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'payment_terms') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN payment_terms TEXT;
  END IF;

  -- delivery_address
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'delivery_address') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN delivery_address TEXT;
  END IF;

  -- approved_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'approved_by') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN approved_by UUID REFERENCES users(id);
  END IF;

  -- approved_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'approved_at') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'notes') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN notes TEXT;
  END IF;

  -- kkm_contract_number
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'kkm_contract_number') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN kkm_contract_number TEXT;
  END IF;
END $$;

-- ============================================
-- 4. Pharmacy Purchase Order Items Table
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES pharmacy_purchase_orders(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL, -- drug, non_drug
  item_id UUID NOT NULL,
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  packaging_description TEXT,
  expected_delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for pharmacy_purchase_order_items
CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON pharmacy_purchase_order_items(po_id);

-- ============================================
-- 5. Pharmacy Goods Receipts Table
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_goods_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  po_id UUID REFERENCES pharmacy_purchase_orders(id),
  gr_number TEXT NOT NULL,
  receipt_date DATE NOT NULL,
  delivery_note_number TEXT,
  invoice_number TEXT,
  invoice_amount DECIMAL(15,2),
  received_by UUID REFERENCES users(id),
  inspected_by UUID REFERENCES users(id),
  inspected_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, gr_number)
);

-- Index for pharmacy_goods_receipts
CREATE INDEX IF NOT EXISTS idx_gr_hospital_id ON pharmacy_goods_receipts(hospital_id);
CREATE INDEX IF NOT EXISTS idx_gr_po_id ON pharmacy_goods_receipts(po_id);

-- ============================================
-- 6. Pharmacy Goods Receipt Items Table
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_goods_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gr_id UUID NOT NULL REFERENCES pharmacy_goods_receipts(id) ON DELETE CASCADE,
  po_item_id UUID REFERENCES pharmacy_purchase_order_items(id),
  item_type VARCHAR(20) NOT NULL, -- drug, non_drug
  item_id UUID NOT NULL,
  quantity_received INTEGER NOT NULL,
  quantity_accepted INTEGER,
  quantity_rejected INTEGER DEFAULT 0,
  batch_number TEXT,
  manufacturing_date DATE,
  expiry_date DATE,
  storage_location_id UUID, -- References stock_locations(id) if exists
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for pharmacy_goods_receipt_items
CREATE INDEX IF NOT EXISTS idx_gr_items_gr_id ON pharmacy_goods_receipt_items(gr_id);

-- ============================================
-- 7. RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE pharmacy_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_warrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_goods_receipt_items ENABLE ROW LEVEL SECURITY;

-- Scoped Policies (Hospital Level)
DO $$
BEGIN
  -- pharmacy_budgets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pharmacy_budgets' AND policyname = 'hospital_scoped_pharmacy_budgets') THEN
    CREATE POLICY hospital_scoped_pharmacy_budgets ON pharmacy_budgets
      FOR ALL USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));
  END IF;

  -- pharmacy_warrants
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pharmacy_warrants' AND policyname = 'hospital_scoped_pharmacy_warrants') THEN
    CREATE POLICY hospital_scoped_pharmacy_warrants ON pharmacy_warrants
      FOR ALL USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));
  END IF;

  -- pharmacy_purchase_orders
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pharmacy_purchase_orders' AND policyname = 'hospital_scoped_pharmacy_purchase_orders') THEN
    CREATE POLICY hospital_scoped_pharmacy_purchase_orders ON pharmacy_purchase_orders
      FOR ALL USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));
  END IF;

  -- pharmacy_purchase_order_items (linked via po_id)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pharmacy_purchase_order_items' AND policyname = 'hospital_scoped_po_items') THEN
    CREATE POLICY hospital_scoped_po_items ON pharmacy_purchase_order_items
      FOR ALL USING (po_id IN (SELECT id FROM pharmacy_purchase_orders WHERE hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())));
  END IF;

  -- pharmacy_goods_receipts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pharmacy_goods_receipts' AND policyname = 'hospital_scoped_goods_receipts') THEN
    CREATE POLICY hospital_scoped_goods_receipts ON pharmacy_goods_receipts
      FOR ALL USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));
  END IF;

  -- pharmacy_goods_receipt_items (linked via gr_id)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pharmacy_goods_receipt_items' AND policyname = 'hospital_scoped_gr_items') THEN
    CREATE POLICY hospital_scoped_gr_items ON pharmacy_goods_receipt_items
      FOR ALL USING (gr_id IN (SELECT id FROM pharmacy_goods_receipts WHERE hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())));
  END IF;
END $$;

-- ============================================
-- 8. Triggers for updated_at
-- ============================================

-- Ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_pharmacy_budgets_updated_at ON pharmacy_budgets;
CREATE TRIGGER update_pharmacy_budgets_updated_at
  BEFORE UPDATE ON pharmacy_budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pharmacy_warrants_updated_at ON pharmacy_warrants;
CREATE TRIGGER update_pharmacy_warrants_updated_at
  BEFORE UPDATE ON pharmacy_warrants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pharmacy_purchase_orders_updated_at ON pharmacy_purchase_orders;
CREATE TRIGGER update_pharmacy_purchase_orders_updated_at
  BEFORE UPDATE ON pharmacy_purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pharmacy_goods_receipts_updated_at ON pharmacy_goods_receipts;
CREATE TRIGGER update_pharmacy_goods_receipts_updated_at
  BEFORE UPDATE ON pharmacy_goods_receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
