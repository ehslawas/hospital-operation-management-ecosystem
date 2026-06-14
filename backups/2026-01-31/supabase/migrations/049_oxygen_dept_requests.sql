-- Migration: Oxygen Department Requests
-- Description: Creates tables for tracking department oxygen requests.

-- ============================================
-- 1. Oxygen Department Requests
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_oxygen_dept_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    request_id TEXT NOT NULL, -- Format: 0C-2026-0001
    department_id UUID REFERENCES departments(id),
    requested_by UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(hospital_id, request_id)
);

-- ============================================
-- 2. Oxygen Department Request Items
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_oxygen_dept_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES pharmacy_oxygen_dept_requests(id) ON DELETE CASCADE,
    cylinder_size_id UUID NOT NULL REFERENCES pharmacy_oxygen_cylinder_sizes(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    quantity_issued INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. RLS Policies
-- ============================================
ALTER TABLE pharmacy_oxygen_dept_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_oxygen_dept_request_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hospital_scoped_oxygen_dept_requests') THEN
        CREATE POLICY hospital_scoped_oxygen_dept_requests ON pharmacy_oxygen_dept_requests
            FOR ALL USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hospital_scoped_oxygen_dept_request_items') THEN
        CREATE POLICY hospital_scoped_oxygen_dept_request_items ON pharmacy_oxygen_dept_request_items
            FOR ALL USING (request_id IN (SELECT id FROM pharmacy_oxygen_dept_requests WHERE hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())));
    END IF;
END $$;

-- ============================================
-- 4. Triggers
-- ============================================
DROP TRIGGER IF EXISTS update_oxygen_dept_requests_updated_at ON pharmacy_oxygen_dept_requests;
CREATE TRIGGER update_oxygen_dept_requests_updated_at BEFORE UPDATE ON pharmacy_oxygen_dept_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
