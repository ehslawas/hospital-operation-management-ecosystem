-- Admin LPOs table
CREATE TABLE IF NOT EXISTS admin_lpos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    lpo_number VARCHAR(50) NOT NULL,
    purchase_order_id UUID NOT NULL REFERENCES admin_purchase_orders(id),
    lpo_date DATE NOT NULL DEFAULT CURRENT_DATE,
    document_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    pdf_url TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hospital_id, lpo_number)
);

-- Admin Receiving Records
CREATE TABLE IF NOT EXISTS admin_receiving_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    lpo_id UUID NOT NULL REFERENCES admin_lpos(id),
    do_number VARCHAR(100),
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    received_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Receiving Items
CREATE TABLE IF NOT EXISTS admin_receiving_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receiving_id UUID NOT NULL REFERENCES admin_receiving_records(id) ON DELETE CASCADE,
    item_description TEXT NOT NULL,
    ordered_quantity NUMERIC(10,2) NOT NULL,
    received_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Payments
CREATE TABLE IF NOT EXISTS admin_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    lpo_id UUID NOT NULL REFERENCES admin_lpos(id),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_reference VARCHAR(100),
    amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_lpos ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_receiving_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_receiving_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_payments ENABLE ROW LEVEL SECURITY;

-- SIMPLE RLS Policies (Adjust as needed for strictness)
CREATE POLICY "Enable read access for hospital users" ON admin_lpos FOR SELECT USING (hospital_id = (select auth.uid()::uuid)); -- Simplified check, ideally check user's hospital_id
CREATE POLICY "Enable insert for hospital users" ON admin_lpos FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for hospital users" ON admin_lpos FOR UPDATE USING (true);

CREATE POLICY "Enable read access for hospital users" ON admin_receiving_records FOR SELECT USING (true);
CREATE POLICY "Enable insert for hospital users" ON admin_receiving_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for hospital users" ON admin_receiving_records FOR UPDATE USING (true);

CREATE POLICY "Enable read access for hospital users" ON admin_receiving_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for hospital users" ON admin_receiving_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for hospital users" ON admin_payments FOR SELECT USING (true);
CREATE POLICY "Enable insert for hospital users" ON admin_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for hospital users" ON admin_payments FOR UPDATE USING (true);

-- Insert Menu Items
-- Note: Adjust 'admin-procurement' parent_id if it differs in your actual DB
-- Insert Menu Items dynamically
DO $$
DECLARE
    procurement_menu_id UUID;
BEGIN
    -- 1. Get the parent 'Admin Procurement' menu ID
    SELECT id INTO procurement_menu_id 
    FROM menus 
    WHERE path = '/admin/operations/procurement' 
    AND module_code = 'admin_operations'
    LIMIT 1;

    -- Only proceed if parent exists
    IF procurement_menu_id IS NOT NULL THEN
        
        -- 2. Insert Orders Item
        IF NOT EXISTS (SELECT 1 FROM menus WHERE path = '/admin/operations/procurement/orders' AND module_code = 'admin_operations') THEN
            INSERT INTO menus (id, label, path, icon, parent_id, order_index, module_code)
            VALUES (gen_random_uuid(), 'Purchase Order', '/admin/operations/procurement/orders', 'FileText', procurement_menu_id, 1, 'admin_operations');
        END IF;

        -- 3. Insert LPO Item
        IF NOT EXISTS (SELECT 1 FROM menus WHERE path = '/admin/operations/procurement/lpo' AND module_code = 'admin_operations') THEN
            INSERT INTO menus (id, label, path, icon, parent_id, order_index, module_code)
            VALUES (gen_random_uuid(), 'LPO', '/admin/operations/procurement/lpo', 'FileCheck', procurement_menu_id, 2, 'admin_operations');
        END IF;

        -- 4. Insert Receiving Item
        IF NOT EXISTS (SELECT 1 FROM menus WHERE path = '/admin/operations/procurement/receiving' AND module_code = 'admin_operations') THEN
            INSERT INTO menus (id, label, path, icon, parent_id, order_index, module_code)
            VALUES (gen_random_uuid(), 'Receiving', '/admin/operations/procurement/receiving', 'PackageCheck', procurement_menu_id, 3, 'admin_operations');
        END IF;

        -- 5. Insert Payment Item
        IF NOT EXISTS (SELECT 1 FROM menus WHERE path = '/admin/operations/procurement/payment' AND module_code = 'admin_operations') THEN
            INSERT INTO menus (id, label, path, icon, parent_id, order_index, module_code)
            VALUES (gen_random_uuid(), 'Payment', '/admin/operations/procurement/payment', 'CreditCard', procurement_menu_id, 4, 'admin_operations');
        END IF;

    ELSE
        RAISE NOTICE 'Admin Procurement menu not found. Skipping submenu insertion.';
    END IF;
END $$;
