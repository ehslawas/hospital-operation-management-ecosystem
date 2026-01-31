-- Migration: Medical Oxygen Management System
-- Description: Creates tables for tracking medical oxygen cylinders, reception, inventory, and movement.

-- ============================================
-- 1. Oxygen Cylinder Sizes Master Table
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_oxygen_cylinder_sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    capacity DECIMAL(10,2) NOT NULL,
    unit TEXT NOT NULL DEFAULT 'm3',
    is_loan BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. Oxygen Cylinder Types Master Table
-- ============================================
-- Fix: Rename columns if they exist from a previous schema version
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacy_oxygen_cylinder_types') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_oxygen_cylinder_types' AND column_name = 'type_code') 
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_oxygen_cylinder_types' AND column_name = 'code') THEN
            ALTER TABLE pharmacy_oxygen_cylinder_types RENAME COLUMN type_code TO code;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_oxygen_cylinder_types' AND column_name = 'type_name')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_oxygen_cylinder_types' AND column_name = 'name') THEN
            ALTER TABLE pharmacy_oxygen_cylinder_types RENAME COLUMN type_name TO name;
        END IF;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS pharmacy_oxygen_cylinder_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE, -- BN, PI
    name TEXT NOT NULL, -- Bullnose, Pin Index
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ensure unique indexes exist for ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS pharmacy_oxygen_cylinder_sizes_code_idx ON pharmacy_oxygen_cylinder_sizes (code);
CREATE UNIQUE INDEX IF NOT EXISTS pharmacy_oxygen_cylinder_types_code_idx ON pharmacy_oxygen_cylinder_types (code);

-- ============================================
-- 3. Oxygen Reception Records Table
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_oxygen_reception_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    reception_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_order_no TEXT NOT NULL,
    sales_order_no TEXT,
    refill_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    loan_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (refill_amount + loan_amount) STORED,
    vote_code TEXT NOT NULL DEFAULT '080702',
    vote_activity TEXT NOT NULL DEFAULT '27402',
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. Oxygen Cylinder Inventory Table
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_oxygen_cylinder_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    cylinder_size_id UUID NOT NULL REFERENCES pharmacy_oxygen_cylinder_sizes(id),
    cylinder_type_id UUID NOT NULL REFERENCES pharmacy_oxygen_cylinder_types(id),
    qr_code TEXT NOT NULL UNIQUE,
    serial_number TEXT,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'issued', 'empty', 'damaged', 'returned_to_supplier')),
    current_location TEXT NOT NULL DEFAULT 'Store', -- Department name or 'Store'
    department_id UUID REFERENCES departments(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. Oxygen Cylinder Movements Table
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_oxygen_cylinder_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    cylinder_id UUID NOT NULL REFERENCES pharmacy_oxygen_cylinder_inventory(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('received', 'issued', 'returned_from_dept', 'sent_to_supplier')),
    from_location TEXT,
    to_location TEXT,
    department_id UUID REFERENCES departments(id),
    moved_by UUID REFERENCES users(id),
    moved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 6. Oxygen Cylinder Requests (Supplier POs)
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_oxygen_cylinder_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id),
    request_number TEXT NOT NULL,
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    request_type TEXT NOT NULL DEFAULT 'purchase' CHECK (request_type IN ('purchase', 'maintenance', 'return_empty')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'sent', 'completed', 'cancelled')),
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(hospital_id, request_number)
);

-- ============================================
-- 7. Oxygen Request Items Table
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_oxygen_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES pharmacy_oxygen_cylinder_requests(id) ON DELETE CASCADE,
    cylinder_size_id UUID NOT NULL REFERENCES pharmacy_oxygen_cylinder_sizes(id),
    cylinder_type_id UUID NOT NULL REFERENCES pharmacy_oxygen_cylinder_types(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- 8. RLS Policies
-- ============================================

ALTER TABLE pharmacy_oxygen_cylinder_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_oxygen_cylinder_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_oxygen_reception_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_oxygen_cylinder_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_oxygen_cylinder_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_oxygen_cylinder_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_oxygen_request_items ENABLE ROW LEVEL SECURITY;

-- Size & Types are public for read, admin for write
CREATE POLICY "Public read oxygen sizes" ON pharmacy_oxygen_cylinder_sizes FOR SELECT USING (true);
CREATE POLICY "Public read oxygen types" ON pharmacy_oxygen_cylinder_types FOR SELECT USING (true);

-- Hospital scoped policies
DO $$
BEGIN
    -- pharmacy_oxygen_reception_records
    CREATE POLICY hospital_scoped_oxygen_reception ON pharmacy_oxygen_reception_records
        FOR ALL USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));

    -- pharmacy_oxygen_cylinder_inventory
    CREATE POLICY hospital_scoped_oxygen_inventory ON pharmacy_oxygen_cylinder_inventory
        FOR ALL USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));

    -- pharmacy_oxygen_cylinder_movements
    CREATE POLICY hospital_scoped_oxygen_movements ON pharmacy_oxygen_cylinder_movements
        FOR ALL USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));

    -- pharmacy_oxygen_cylinder_requests
    CREATE POLICY hospital_scoped_oxygen_requests ON pharmacy_oxygen_cylinder_requests
        FOR ALL USING (hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid()));

    -- pharmacy_oxygen_request_items (linked via request_id)
    CREATE POLICY hospital_scoped_oxygen_request_items ON pharmacy_oxygen_request_items
        FOR ALL USING (request_id IN (SELECT id FROM pharmacy_oxygen_cylinder_requests WHERE hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())));
END $$;

-- ============================================
-- 9. Triggers for updated_at
-- ============================================

CREATE TRIGGER update_pharmacy_oxygen_reception_records_updated_at BEFORE UPDATE ON pharmacy_oxygen_reception_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pharmacy_oxygen_cylinder_inventory_updated_at BEFORE UPDATE ON pharmacy_oxygen_cylinder_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pharmacy_oxygen_cylinder_requests_updated_at BEFORE UPDATE ON pharmacy_oxygen_cylinder_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. Seed Data
-- ============================================

-- Cylinder Sizes
INSERT INTO pharmacy_oxygen_cylinder_sizes (code, capacity, unit, is_loan) VALUES
('P101-D', 0.5, 'm3', false),
('P101-E', 0.7, 'm3', false),
('P101-F', 1.4, 'm3', false),
('P101-HS', 6.4, 'm3', false),
('101-F', 1.4, 'm3', true),
('101-N', 8.0, 'm3', true)
ON CONFLICT (code) DO NOTHING;

-- Cylinder Types
INSERT INTO pharmacy_oxygen_cylinder_types (code, name) VALUES
('BN', 'Bullnose'),
('PI', 'Pin Index')
ON CONFLICT (code) DO NOTHING;
