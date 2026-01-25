-- Add missing column to pharmacy_lpo
ALTER TABLE pharmacy_lpo
ADD COLUMN IF NOT EXISTS sent_for_payment_date TIMESTAMPTZ;

-- Create table for Supplier Assessments
CREATE TABLE IF NOT EXISTS pharmacy_supplier_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lpo_id UUID NOT NULL REFERENCES pharmacy_lpo(id),
    ratings JSONB NOT NULL, -- Stores { support: 5, quality: 4, delivery: 5 }
    total_score NUMERIC NOT NULL,
    percentage NUMERIC NOT NULL,
    performance_level TEXT NOT NULL,
    assessed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE pharmacy_supplier_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON pharmacy_supplier_assessments
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON pharmacy_supplier_assessments
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
