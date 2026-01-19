-- Migration: 095_create_maintenance_tables.sql
-- Description: Creates tables for maintenance module (Units, Locations, Verifications) and missing inventory tables (Batches, Transactions).

-- ============================================
-- 1. Units of Measure
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_units_of_measure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_code VARCHAR(20) UNIQUE NOT NULL,
  unit_name VARCHAR(100) NOT NULL,
  unit_type VARCHAR(50), -- quantity, volume, weight, pack
  base_unit_id UUID REFERENCES pharmacy_units_of_measure(id),
  conversion_factor DECIMAL(10,4),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. Stock Locations
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_stock_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  location_code VARCHAR(50) NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  location_type VARCHAR(50) NOT NULL, -- warehouse, pharmacy, ward, cold_room, controlled
  parent_location_id UUID REFERENCES pharmacy_stock_locations(id),
  capacity INTEGER,
  temperature_required VARCHAR(50), -- ambient, 2-8C, -20C, etc.
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hospital_id, location_code)
);

CREATE INDEX IF NOT EXISTS idx_stock_locations_hospital ON pharmacy_stock_locations(hospital_id);

-- ============================================
-- 3. Stock Batches
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_stock_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL, -- drug, non_drug
  item_id UUID NOT NULL,
  batch_number VARCHAR(100) NOT NULL,
  manufacturing_date DATE,
  expiry_date DATE,
  quantity_received INTEGER NOT NULL DEFAULT 0,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,
  unit_cost DECIMAL(15,2),
  location_id UUID REFERENCES pharmacy_stock_locations(id),
  status VARCHAR(30) DEFAULT 'available', -- available, quarantine, expired, depleted
  received_date DATE DEFAULT CURRENT_DATE,
  supplier_id UUID REFERENCES suppliers(id),
  po_id UUID REFERENCES pharmacy_purchase_orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_batches_hospital ON pharmacy_stock_batches(hospital_id);
CREATE INDEX IF NOT EXISTS idx_stock_batches_item ON pharmacy_stock_batches(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_stock_batches_expiry ON pharmacy_stock_batches(expiry_date);

-- ============================================
-- 4. Stock Transactions
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  transaction_type VARCHAR(30) NOT NULL, -- receipt, issue, transfer_in, transfer_out, adjust, return, dispose
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  item_type VARCHAR(20) NOT NULL, -- drug, non_drug
  item_id UUID NOT NULL,
  batch_id UUID REFERENCES pharmacy_stock_batches(id),
  quantity INTEGER NOT NULL,
  from_location_id UUID REFERENCES pharmacy_stock_locations(id),
  to_location_id UUID REFERENCES pharmacy_stock_locations(id),
  reference_type VARCHAR(50), -- PO, transfer_request, requisition, etc.
  reference_id UUID,
  reason TEXT,
  performed_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_transactions_hospital ON pharmacy_stock_transactions(hospital_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_item ON pharmacy_stock_transactions(item_id, item_type);

-- ============================================
-- 5. Stock Verifications
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_stock_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  verification_number VARCHAR(50) UNIQUE NOT NULL,
  verification_type VARCHAR(30) NOT NULL, -- full, cycle, spot
  location_id UUID REFERENCES pharmacy_stock_locations(id),
  scheduled_date DATE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(30) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  performed_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_verifications_hospital ON pharmacy_stock_verifications(hospital_id);

-- ============================================
-- 6. Stock Verification Items
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_stock_verification_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID REFERENCES pharmacy_stock_verifications(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL,
  item_id UUID NOT NULL,
  batch_id UUID REFERENCES pharmacy_stock_batches(id),
  system_quantity INTEGER NOT NULL,
  counted_quantity INTEGER,
  variance INTEGER,
  variance_reason TEXT,
  adjustment_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. RLS Policies
-- ============================================
ALTER TABLE pharmacy_units_of_measure ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_stock_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_stock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_stock_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_stock_verification_items ENABLE ROW LEVEL SECURITY;

-- Public read for units
CREATE POLICY "Public read units" ON pharmacy_units_of_measure FOR SELECT USING (true);

-- Hospital Scoped Policies
DO $$
BEGIN
    -- pharmacy_stock_locations
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pharmacy_stock_locations' AND policyname = 'hospital_scoped_locations') THEN
        CREATE POLICY hospital_scoped_locations ON pharmacy_stock_locations
            FOR ALL USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));
    END IF;

    -- pharmacy_stock_batches
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pharmacy_stock_batches' AND policyname = 'hospital_scoped_batches') THEN
        CREATE POLICY hospital_scoped_batches ON pharmacy_stock_batches
            FOR ALL USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));
    END IF;

    -- pharmacy_stock_transactions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pharmacy_stock_transactions' AND policyname = 'hospital_scoped_transactions') THEN
        CREATE POLICY hospital_scoped_transactions ON pharmacy_stock_transactions
            FOR ALL USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));
    END IF;

    -- pharmacy_stock_verifications
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pharmacy_stock_verifications' AND policyname = 'hospital_scoped_verifications') THEN
        CREATE POLICY hospital_scoped_verifications ON pharmacy_stock_verifications
            FOR ALL USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));
    END IF;

    -- pharmacy_stock_verification_items
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pharmacy_stock_verification_items' AND policyname = 'hospital_scoped_verification_items') THEN
        CREATE POLICY hospital_scoped_verification_items ON pharmacy_stock_verification_items
            FOR ALL USING (verification_id IN (SELECT id FROM pharmacy_stock_verifications WHERE hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())));
    END IF;
END $$;

-- ============================================
-- 8. Updated At Triggers
-- ============================================
CREATE TRIGGER update_pharmacy_stock_locations_updated_at BEFORE UPDATE ON pharmacy_stock_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pharmacy_stock_batches_updated_at BEFORE UPDATE ON pharmacy_stock_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pharmacy_stock_verifications_updated_at BEFORE UPDATE ON pharmacy_stock_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. Seed Units of Measure
-- ============================================
INSERT INTO pharmacy_units_of_measure (unit_code, unit_name, unit_type) VALUES
('EA', 'Each', 'quantity'),
('BOX', 'Box', 'pack'),
('BTL', 'Bottle', 'quantity'),
('TAB', 'Tablet', 'quantity'),
('CAP', 'Capsule', 'quantity'),
('KIT', 'Kit', 'pack'),
('ML', 'Milliliter', 'volume'),
('L', 'Liter', 'volume'),
('MG', 'Milligram', 'weight'),
('G', 'Gram', 'weight'),
('KG', 'Kilogram', 'weight')
ON CONFLICT (unit_code) DO NOTHING;
