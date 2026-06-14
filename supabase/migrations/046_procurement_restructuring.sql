-- Enable uuid-ossp if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Letter of Purchase Order (LPO)
CREATE TABLE IF NOT EXISTS pharmacy_lpo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id),
  po_id UUID NOT NULL REFERENCES pharmacy_purchase_orders(id),
  lpo_number VARCHAR(50) UNIQUE NOT NULL,
  document_date DATE NOT NULL,
  document_url TEXT, -- Storage path for generated PDF
  status VARCHAR(20) DEFAULT 'draft', -- draft, generated, uploaded, archived
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lpo_number ON pharmacy_lpo(lpo_number);
CREATE INDEX IF NOT EXISTS idx_lpo_po_id ON pharmacy_lpo(po_id);

-- 2. Order Tracking
CREATE TABLE IF NOT EXISTS pharmacy_order_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lpo_id UUID NOT NULL REFERENCES pharmacy_lpo(id),
  item_id UUID NOT NULL, -- References drugs or non_drugs (loose reference as they are in different tables)
  item_type VARCHAR(20) NOT NULL, -- 'drug' or 'non_drug'
  item_code VARCHAR(20) NOT NULL,
  item_category VARCHAR(10) NOT NULL, -- 'APPL' or 'CC'
  
  -- Delivery timeline
  expected_delivery_date DATE NOT NULL,
  actual_delivery_date DATE,
  
  -- Tracking metadata
  order_placed_date DATE NOT NULL,
  kkm_contract_number VARCHAR(100), -- For CC items
  tarikh_serahan DATE, -- From contract catalog for CC items
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending', -- pending, in_transit, delivered, overdue
  is_overdue BOOLEAN DEFAULT FALSE,
  days_overdue INT DEFAULT 0,
  
  -- Reminder system
  last_reminder_sent TIMESTAMPTZ,
  reminder_count INT DEFAULT 0,
  
  -- Analytics
  delivery_duration_days INT, -- Actual days taken for delivery
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_tracking_lpo ON pharmacy_order_tracking(lpo_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_status ON pharmacy_order_tracking(status);
CREATE INDEX IF NOT EXISTS idx_order_tracking_overdue ON pharmacy_order_tracking(is_overdue);

-- 3. Receiving Module
CREATE TABLE IF NOT EXISTS pharmacy_receiving (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lpo_id UUID NOT NULL REFERENCES pharmacy_lpo(id),
  receiving_date DATE NOT NULL,
  receiving_type VARCHAR(20) NOT NULL, -- 'full' or 'partial'
  
  -- Document uploads
  do_document_url TEXT, -- Delivery Order
  invoice_document_url TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, verified, completed
  is_fully_received BOOLEAN DEFAULT FALSE,
  
  received_by UUID REFERENCES auth.users(id),
  verified_by UUID REFERENCES auth.users(id),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pharmacy_receiving_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receiving_id UUID NOT NULL REFERENCES pharmacy_receiving(id),
  lpo_item_id UUID NOT NULL, -- Reference to the specific line item in PO (loose ref usually)
  item_id UUID NOT NULL,
  item_type VARCHAR(20) NOT NULL,
  
  -- Quantities
  ordered_quantity INT NOT NULL,
  received_quantity INT NOT NULL,
  outstanding_quantity INT DEFAULT 0,
  
  -- Batch tracking
  batch_number VARCHAR(100),
  expiry_date DATE,
  qr_code TEXT, -- Generated QR code for this specific batch
  
  -- Status
  is_fully_received BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pharmacy_credit_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lpo_id UUID NOT NULL REFERENCES pharmacy_lpo(id),
  receiving_id UUID REFERENCES pharmacy_receiving(id),
  
  issue_date DATE NOT NULL,
  reason TEXT NOT NULL,
  credit_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, applied
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Payment Module
CREATE TABLE IF NOT EXISTS pharmacy_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lpo_id UUID NOT NULL REFERENCES pharmacy_lpo(id),
  lpo_number VARCHAR(50) NOT NULL,
  
  -- Payment details
  payment_amount DECIMAL(12,2) NOT NULL,
  payment_issued_date DATE,
  payment_received_date DATE, -- When supplier confirms receipt
  payment_method VARCHAR(50), -- e.g., 'Bank Transfer', 'Cheque'
  payment_reference VARCHAR(100),
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending', -- pending, issued, received, completed
  
  -- Data source
  data_source VARCHAR(20) DEFAULT 'manual', -- 'manual' or 'scraped'
  scraped_at TIMESTAMPTZ,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_lpo ON pharmacy_payments(lpo_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON pharmacy_payments(status);

-- 5. Penalty Module
CREATE TABLE IF NOT EXISTS pharmacy_penalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lpo_id UUID NOT NULL REFERENCES pharmacy_lpo(id),
  order_tracking_id UUID NOT NULL REFERENCES pharmacy_order_tracking(id),
  
  -- Penalty calculation
  days_overdue INT NOT NULL,
  penalty_rate DECIMAL(10,2), -- Penalty rate per day (based on contract)
  penalty_amount DECIMAL(12,2) NOT NULL,
  
  -- Document
  penalty_notice_url TEXT, -- Generated PDF path
  
  -- Payment tracking
  penalty_paid BOOLEAN DEFAULT FALSE,
  payment_method VARCHAR(50),
  payment_date DATE,
  payment_reference VARCHAR(100),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, issued, paid, waived
  
  -- Email tracking
  email_sent_at TIMESTAMPTZ,
  email_sent_to VARCHAR(255),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_penalty_lpo ON pharmacy_penalties(lpo_id);
CREATE INDEX IF NOT EXISTS idx_penalty_status ON pharmacy_penalties(status);

-- 6. Letters of Undertaking (LOU)
CREATE TABLE IF NOT EXISTS pharmacy_lou (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lpo_id UUID NOT NULL REFERENCES pharmacy_lpo(id),
  receiving_id UUID NOT NULL REFERENCES pharmacy_receiving(id),
  
  -- LOU requirement
  requires_lou BOOLEAN DEFAULT FALSE,
  lou_reason TEXT,
  
  -- Documents
  lou_letter_url TEXT, -- Generated LOU letter
  merged_pdf_url TEXT, -- Final merged package
  
  -- Email tracking
  email_sent_at TIMESTAMPTZ,
  email_sent_to VARCHAR(255),
  
  status VARCHAR(20) DEFAULT 'pending', -- pending, generated, sent, acknowledged
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lou_lpo ON pharmacy_lou(lpo_id);
CREATE INDEX IF NOT EXISTS idx_lou_status ON pharmacy_lou(status);

-- Add simple RLS policies to allow authenticated access (adjust as needed for specific roles)
ALTER TABLE pharmacy_lpo ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_receiving ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_receiving_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_lou ENABLE ROW LEVEL SECURITY;

-- Basic policy: Allow all actions for authenticated users (restrict later if needed)
CREATE POLICY "Allow all for authenticated users" ON pharmacy_lpo FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON pharmacy_order_tracking FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON pharmacy_receiving FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON pharmacy_receiving_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON pharmacy_credit_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON pharmacy_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON pharmacy_penalties FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON pharmacy_lou FOR ALL TO authenticated USING (true) WITH CHECK (true);
