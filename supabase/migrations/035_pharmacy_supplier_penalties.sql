-- 035_pharmacy_supplier_penalties.sql

CREATE TABLE IF NOT EXISTS pharmacy_supplier_penalties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    supplier_id UUID REFERENCES suppliers(id),
    po_id UUID REFERENCES pharmacy_purchase_orders(id),
    gr_id UUID REFERENCES pharmacy_goods_receipts(id),
    lpo_id UUID,
    penalty_type TEXT NOT NULL CHECK (penalty_type IN ('late_delivery', 'quality_issue', 'incomplete_delivery')),
    penalty_amount DECIMAL(15,2),
    penalty_percentage DECIMAL(5,2),
    days_delayed INTEGER DEFAULT 0,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'enforced', 'waived')),
    enforced_by UUID REFERENCES users(id),
    enforced_at TIMESTAMPTZ,
    waiver_reason TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for pharmacy_supplier_penalties
ALTER TABLE pharmacy_supplier_penalties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for hospital staff on penalties"
ON pharmacy_supplier_penalties FOR SELECT
USING (hospital_id IN (
  SELECT hospital_id FROM user_hospitals WHERE user_id = auth.uid()
));

CREATE POLICY "Enable insert for hospital staff on penalties"
ON pharmacy_supplier_penalties FOR INSERT
WITH CHECK (hospital_id IN (
  SELECT hospital_id FROM user_hospitals WHERE user_id = auth.uid()
));

CREATE POLICY "Enable update for hospital staff on penalties"
ON pharmacy_supplier_penalties FOR UPDATE
USING (hospital_id IN (
  SELECT hospital_id FROM user_hospitals WHERE user_id = auth.uid()
));

-- Alter credit note items to add item details
ALTER TABLE pharmacy_credit_note_items
ADD COLUMN IF NOT EXISTS item_name TEXT,
ADD COLUMN IF NOT EXISTS item_code TEXT;
