-- Migration: Oxygen Reception Items
-- Description: Creates a table to link reception records with specific cylinders and their pricing at the time of reception.

-- ============================================
-- 1. Oxygen Reception Items Table
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_oxygen_reception_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reception_id UUID NOT NULL REFERENCES pharmacy_oxygen_reception_records(id) ON DELETE CASCADE,
    cylinder_id UUID NOT NULL REFERENCES pharmacy_oxygen_cylinder_inventory(id),
    cylinder_size_id UUID NOT NULL REFERENCES pharmacy_oxygen_cylinder_sizes(id),
    cylinder_type_id UUID NOT NULL REFERENCES pharmacy_oxygen_cylinder_types(id),
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. RLS Policies
-- ============================================
ALTER TABLE pharmacy_oxygen_reception_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hospital_scoped_oxygen_reception_items') THEN
        CREATE POLICY hospital_scoped_oxygen_reception_items ON pharmacy_oxygen_reception_items
            FOR ALL USING (reception_id IN (SELECT id FROM pharmacy_oxygen_reception_records WHERE hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())));
    END IF;
END $$;
