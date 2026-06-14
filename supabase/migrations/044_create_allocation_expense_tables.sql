-- Migration: Create Allocation Expense Tables
-- Description: Ensures tables exist and handles deduplication before applying the UNIQUE constraint.

-- 1. APPL Expenses Table
CREATE TABLE IF NOT EXISTS pharmacy_appl_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL,
    warrant_id UUID REFERENCES pharmacy_warrants(id) ON DELETE SET NULL,
    po_id UUID NOT NULL REFERENCES pharmacy_purchase_orders(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL,
    po_number TEXT NOT NULL,
    lpo_number TEXT,
    po_type TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    category TEXT,
    vote_activity TEXT,
    department TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Deduplicate APPL Expenses (Fixed for UUID)
DELETE FROM pharmacy_appl_expenses
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY hospital_id, fiscal_year, po_id
                   ORDER BY created_at DESC
               ) AS row_num
        FROM pharmacy_appl_expenses
    ) t
    WHERE t.row_num > 1
);

-- Add unique constraint for APPL
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pharmacy_appl_expenses_hospital_year_po_unique') THEN
        ALTER TABLE pharmacy_appl_expenses 
        ADD CONSTRAINT pharmacy_appl_expenses_hospital_year_po_unique 
        UNIQUE (hospital_id, fiscal_year, po_id);
    END IF;
END $$;

-- 2. CC Expenses Table
CREATE TABLE IF NOT EXISTS pharmacy_cc_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL,
    warrant_id UUID REFERENCES pharmacy_warrants(id) ON DELETE SET NULL,
    po_id UUID NOT NULL REFERENCES pharmacy_purchase_orders(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL,
    po_number TEXT NOT NULL,
    lpo_number TEXT,
    po_type TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    category TEXT,
    vote_activity TEXT,
    department TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Deduplicate CC Expenses (Fixed for UUID)
DELETE FROM pharmacy_cc_expenses
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY hospital_id, fiscal_year, po_id
                   ORDER BY created_at DESC
               ) AS row_num
        FROM pharmacy_cc_expenses
    ) t
    WHERE t.row_num > 1
);

-- Add unique constraint for CC
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pharmacy_cc_expenses_hospital_year_po_unique') THEN
        ALTER TABLE pharmacy_cc_expenses 
        ADD CONSTRAINT pharmacy_cc_expenses_hospital_year_po_unique 
        UNIQUE (hospital_id, fiscal_year, po_id);
    END IF;
END $$;

-- Enable RLS and Policies (if not already set)
ALTER TABLE pharmacy_appl_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_cc_expenses ENABLE ROW LEVEL SECURITY;

-- Scoped Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pharmacy_appl_expenses' AND policyname = 'hospital_scoped_pharmacy_appl_expenses') THEN
        CREATE POLICY hospital_scoped_pharmacy_appl_expenses ON pharmacy_appl_expenses
            FOR ALL USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pharmacy_cc_expenses' AND policyname = 'hospital_scoped_pharmacy_cc_expenses') THEN
        CREATE POLICY hospital_scoped_pharmacy_cc_expenses ON pharmacy_cc_expenses
            FOR ALL USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));
    END IF;
END $$;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_pharmacy_appl_expenses_updated_at ON pharmacy_appl_expenses;
CREATE TRIGGER update_pharmacy_appl_expenses_updated_at
    BEFORE UPDATE ON pharmacy_appl_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pharmacy_cc_expenses_updated_at ON pharmacy_cc_expenses;
CREATE TRIGGER update_pharmacy_cc_expenses_updated_at
    BEFORE UPDATE ON pharmacy_cc_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
