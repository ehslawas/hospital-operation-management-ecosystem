-- Create Admin Operations Module Migration (Corrected)

-- ==========================================
-- 1. Create Tables for Admin Operations
-- ==========================================

-- 1.1 Admin Purchase Orders
CREATE TABLE IF NOT EXISTS admin_purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    order_number VARCHAR(50) NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    total_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_admin_po_number UNIQUE (hospital_id, order_number)
);

-- 1.2 Admin Purchase Order Items
CREATE TABLE IF NOT EXISTS admin_purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES admin_purchase_orders(id) ON DELETE CASCADE,
    item_description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    specifications TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Admin Warrants
CREATE TABLE IF NOT EXISTS admin_warrants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    warrant_date DATE NOT NULL,
    document_no VARCHAR(100) NOT NULL,
    vote_code VARCHAR(20) NOT NULL,
    vote_activity VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_admin_warrant_doc UNIQUE (hospital_id, document_no)
);

-- ==========================================
-- 2. Enable Row Level Security (RLS)
-- ==========================================

ALTER TABLE admin_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_warrants ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. Create RLS Policies (Hospital Admin Only)
-- ==========================================

-- 3.1 Policies for admin_purchase_orders
-- Drop existing policies if any to avoid errors on re-run
DROP POLICY IF EXISTS "admin_po_hospital_admin_only" ON admin_purchase_orders;
CREATE POLICY "admin_po_hospital_admin_only" ON admin_purchase_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.role_code = 'hospital_admin'
            AND u.hospital_id = admin_purchase_orders.hospital_id
        )
    );

-- 3.2 Policies for admin_purchase_order_items
DROP POLICY IF EXISTS "admin_po_items_hospital_admin_only" ON admin_purchase_order_items;
CREATE POLICY "admin_po_items_hospital_admin_only" ON admin_purchase_order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_purchase_orders apo
            JOIN users u ON u.hospital_id = apo.hospital_id
            JOIN roles r ON u.role_id = r.id
            WHERE apo.id = admin_purchase_order_items.purchase_order_id
            AND u.id = auth.uid()
            AND r.role_code = 'hospital_admin'
        )
    );

-- 3.3 Policies for admin_warrants
DROP POLICY IF EXISTS "admin_warrant_hospital_admin_only" ON admin_warrants;
CREATE POLICY "admin_warrant_hospital_admin_only" ON admin_warrants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.role_code = 'hospital_admin'
            AND u.hospital_id = admin_warrants.hospital_id
        )
    );

-- ==========================================
-- 4. Create Module and Menu Items
-- ==========================================

DO $$
DECLARE
    admin_ops_module_id UUID;
    admin_ops_menu_id UUID;
    procurement_menu_id UUID;
    financial_menu_id UUID;
BEGIN
    -- 4.1 Insert Module
    -- Check if module exists
    SELECT id INTO admin_ops_module_id FROM modules WHERE module_code = 'admin_operations';
    
    IF admin_ops_module_id IS NULL THEN
        INSERT INTO modules (id, module_code, module_name, description, is_active, route_path, icon_name, display_order)
        VALUES (
            gen_random_uuid(),
            'admin_operations',
            'Admin Operations',
            'Hospital Administrator exclusive procurement and financial operations',
            true,
            '/admin/operations',
            'ClipboardList',
            100
        ) RETURNING id INTO admin_ops_module_id;
    END IF;

    -- 4.2 Insert Parent Menu (Top Level)
    -- Check if menu exists
    SELECT id INTO admin_ops_menu_id FROM menus WHERE path = '/admin/operations' AND module_code = 'admin_operations';
    
    IF admin_ops_menu_id IS NULL THEN
        INSERT INTO menus (id, label, path, icon, module_code, parent_id, order_index)
        VALUES (
            gen_random_uuid(),
            'Admin Operations',
            '/admin/operations',
            'ClipboardList',
            'admin_operations',
            NULL,
            100
        ) RETURNING id INTO admin_ops_menu_id;
    END IF;

    -- 4.3 Insert Submenus (Procurement & Financial)
    
    -- Procurement Submenu
    SELECT id INTO procurement_menu_id FROM menus WHERE path = '/admin/operations/procurement' AND module_code = 'admin_operations';
    
    IF procurement_menu_id IS NULL THEN
        INSERT INTO menus (id, label, path, icon, module_code, parent_id, order_index)
        VALUES (
            gen_random_uuid(),
            'Admin Procurement',
            '/admin/operations/procurement',
            'ShoppingBag',
            'admin_operations',
            admin_ops_menu_id,
            1
        ) RETURNING id INTO procurement_menu_id;
    END IF;

    -- Purchase Orders Item
    IF NOT EXISTS (SELECT 1 FROM menus WHERE path = '/admin/operations/procurement/orders' AND module_code = 'admin_operations') THEN
        INSERT INTO menus (id, label, path, icon, module_code, parent_id, order_index)
        VALUES (
            gen_random_uuid(),
            'Purchase Orders',
            '/admin/operations/procurement/orders',
            'FileText',
            'admin_operations',
            procurement_menu_id,
            1
        );
    END IF;

    -- Financial Submenu
    SELECT id INTO financial_menu_id FROM menus WHERE path = '/admin/operations/financial' AND module_code = 'admin_operations';
    
    IF financial_menu_id IS NULL THEN
        INSERT INTO menus (id, label, path, icon, module_code, parent_id, order_index)
        VALUES (
            gen_random_uuid(),
            'Admin Financial',
            '/admin/operations/financial',
            'Wallet',
            'admin_operations',
            admin_ops_menu_id,
            2
        ) RETURNING id INTO financial_menu_id;
    END IF;

    -- Admin Warrant Item
    IF NOT EXISTS (SELECT 1 FROM menus WHERE path = '/admin/operations/financial/warrant' AND module_code = 'admin_operations') THEN
        INSERT INTO menus (id, label, path, icon, module_code, parent_id, order_index)
        VALUES (
            gen_random_uuid(),
            'Admin Warrant',
            '/admin/operations/financial/warrant',
            'Receipt',
            'admin_operations',
            financial_menu_id,
            1
        );
    END IF;

END $$;

-- ==========================================
-- 5. Create Approval Workflow Configuration
-- ==========================================

DO $$
DECLARE
    po_workflow_id UUID;
    hospital_admin_role_id UUID;
    po_submit_action_id UUID;
BEGIN
    -- 5.1 Insert Action Types
    -- Check/Insert Admin PO Submit
    IF NOT EXISTS (SELECT 1 FROM action_types WHERE type_code = 'admin_po_submit') THEN
        INSERT INTO action_types (type_code, type_name, description, module)
        VALUES ('admin_po_submit', 'Admin PO Submit', 'Submit admin purchase order for approval', 'admin_operations')
        RETURNING id INTO po_submit_action_id;
    ELSE
        SELECT id INTO po_submit_action_id FROM action_types WHERE type_code = 'admin_po_submit';
    END IF;

    -- Check/Insert Admin PO Approve
    IF NOT EXISTS (SELECT 1 FROM action_types WHERE type_code = 'admin_po_approve') THEN
        INSERT INTO action_types (type_code, type_name, description, module)
        VALUES ('admin_po_approve', 'Admin PO Approve', 'Approve admin purchase order', 'admin_operations');
    END IF;

    -- Check/Insert Admin Warrant Create
    IF NOT EXISTS (SELECT 1 FROM action_types WHERE type_code = 'admin_warrant_create') THEN
        INSERT INTO action_types (type_code, type_name, description, module)
        VALUES ('admin_warrant_create', 'Admin Warrant Create', 'Create admin warrant allocation', 'admin_operations');
    END IF;

    -- 5.2 Create Workflow for PO Approval
    
    -- Get Hospital Admin Role ID
    SELECT id INTO hospital_admin_role_id FROM roles WHERE role_code = 'hospital_admin' LIMIT 1;
    
    -- Check if workflow exists
    SELECT id INTO po_workflow_id FROM approval_workflows WHERE workflow_name = 'Admin Purchase Order Approval';

    IF po_workflow_id IS NULL AND po_submit_action_id IS NOT NULL THEN
        -- Create Workflow
        INSERT INTO approval_workflows (workflow_name, action_type_id, is_active, description)
        VALUES (
            'Admin Purchase Order Approval',
            po_submit_action_id,
            true,
            'Hospital Administrator purchase orders require approval from designated admin approver'
        ) RETURNING id INTO po_workflow_id;
    END IF;

    -- Create Workflow Step (Requires Hospital Admin Role)
    IF po_workflow_id IS NOT NULL AND hospital_admin_role_id IS NOT NULL THEN
        -- Check if step exists
        IF NOT EXISTS (SELECT 1 FROM approval_workflow_steps WHERE workflow_id = po_workflow_id AND step_order = 1) THEN
            INSERT INTO approval_workflow_steps (workflow_id, step_order, approver_role_id, is_required, can_reject)
            VALUES (
                po_workflow_id,
                1,
                hospital_admin_role_id,
                true,
                true
            );
        END IF;
    END IF;

END $$;
