-- CLEANUP MOULD: Run this to clear existing tables before re-running the migration
-- WARNING: This will delete data in the listed tables!

-- 0. Cleanup existing broken or old tables
DROP TABLE IF EXISTS pharmacy_lou CASCADE;
DROP TABLE IF EXISTS pharmacy_penalties CASCADE;
DROP TABLE IF EXISTS pharmacy_payments CASCADE;
DROP TABLE IF EXISTS pharmacy_credit_notes CASCADE;
DROP TABLE IF EXISTS pharmacy_receiving_items CASCADE;
DROP TABLE IF EXISTS pharmacy_receiving CASCADE;
DROP TABLE IF EXISTS pharmacy_order_tracking CASCADE;
DROP TABLE IF EXISTS pharmacy_lpo CASCADE;

-- 1. Enable uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Letter of Purchase Order (LPO)
CREATE TABLE pharmacy_lpo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id),
  po_id UUID NOT NULL REFERENCES pharmacy_purchase_orders(id),
  lpo_number VARCHAR(50) UNIQUE NOT NULL,
  document_date DATE NOT NULL,
  document_url TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lpo_number ON pharmacy_lpo(lpo_number);
CREATE INDEX idx_lpo_po_id ON pharmacy_lpo(po_id);

-- 3. Order Tracking
CREATE TABLE pharmacy_order_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lpo_id UUID NOT NULL REFERENCES pharmacy_lpo(id),
  item_id UUID NOT NULL,
  item_type VARCHAR(20) NOT NULL,
  item_code VARCHAR(20) NOT NULL,
  item_category VARCHAR(10) NOT NULL,
  expected_delivery_date DATE NOT NULL,
  actual_delivery_date DATE,
  order_placed_date DATE NOT NULL,
  kkm_contract_number VARCHAR(100),
  tarikh_serahan DATE,
  status VARCHAR(20) DEFAULT 'pending',
  is_overdue BOOLEAN DEFAULT FALSE,
  days_overdue INT DEFAULT 0,
  last_reminder_sent TIMESTAMPTZ,
  reminder_count INT DEFAULT 0,
  delivery_duration_days INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_tracking_lpo ON pharmacy_order_tracking(lpo_id);
CREATE INDEX idx_order_tracking_status ON pharmacy_order_tracking(status);
CREATE INDEX idx_order_tracking_overdue ON pharmacy_order_tracking(is_overdue);

-- 4. Receiving Module
CREATE TABLE pharmacy_receiving (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lpo_id UUID NOT NULL REFERENCES pharmacy_lpo(id),
  receiving_date DATE NOT NULL,
  receiving_type VARCHAR(20) NOT NULL,
  do_document_url TEXT,
  invoice_document_url TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  is_fully_received BOOLEAN DEFAULT FALSE,
  received_by UUID REFERENCES auth.users(id),
  verified_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pharmacy_receiving_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receiving_id UUID NOT NULL REFERENCES pharmacy_receiving(id),
  lpo_item_id UUID NOT NULL,
  item_id UUID NOT NULL,
  item_type VARCHAR(20) NOT NULL,
  ordered_quantity INT NOT NULL,
  received_quantity INT NOT NULL,
  outstanding_quantity INT DEFAULT 0,
  batch_number VARCHAR(100),
  expiry_date DATE,
  qr_code TEXT,
  is_fully_received BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pharmacy_credit_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lpo_id UUID NOT NULL REFERENCES pharmacy_lpo(id),
  receiving_id UUID REFERENCES pharmacy_receiving(id),
  issue_date DATE NOT NULL,
  reason TEXT NOT NULL,
  credit_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Payment Module
CREATE TABLE pharmacy_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lpo_id UUID NOT NULL REFERENCES pharmacy_lpo(id),
  lpo_number VARCHAR(50) NOT NULL,
  payment_amount DECIMAL(12,2) NOT NULL,
  payment_issued_date DATE,
  payment_received_date DATE,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  data_source VARCHAR(20) DEFAULT 'manual',
  scraped_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_lpo ON pharmacy_payments(lpo_id);
CREATE INDEX idx_payment_status ON pharmacy_payments(status);

-- 6. Penalty Module
CREATE TABLE pharmacy_penalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lpo_id UUID NOT NULL REFERENCES pharmacy_lpo(id),
  order_tracking_id UUID NOT NULL REFERENCES pharmacy_order_tracking(id),
  days_overdue INT NOT NULL,
  penalty_rate DECIMAL(10,2),
  penalty_amount DECIMAL(12,2) NOT NULL,
  penalty_notice_url TEXT,
  penalty_paid BOOLEAN DEFAULT FALSE,
  payment_method VARCHAR(50),
  payment_date DATE,
  payment_reference VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  email_sent_at TIMESTAMPTZ,
  email_sent_to VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_penalty_lpo ON pharmacy_penalties(lpo_id);
CREATE INDEX idx_penalty_status ON pharmacy_penalties(status);

-- 7. Letters of Undertaking (LOU)
CREATE TABLE pharmacy_lou (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lpo_id UUID NOT NULL REFERENCES pharmacy_lpo(id),
  receiving_id UUID NOT NULL REFERENCES pharmacy_receiving(id),
  requires_lou BOOLEAN DEFAULT FALSE,
  lou_reason TEXT,
  lou_letter_url TEXT,
  merged_pdf_url TEXT,
  email_sent_at TIMESTAMPTZ,
  email_sent_to VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lou_lpo ON pharmacy_lou(lpo_id);
CREATE INDEX idx_lou_status ON pharmacy_lou(status);

-- 8. RLS Policies
ALTER TABLE pharmacy_lpo ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_receiving ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_receiving_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_lou ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON pharmacy_lpo FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON pharmacy_order_tracking FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON pharmacy_receiving FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON pharmacy_receiving_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON pharmacy_credit_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON pharmacy_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON pharmacy_penalties FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON pharmacy_lou FOR ALL TO authenticated USING (true) WITH CHECK (true);
