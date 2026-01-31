-- ============================================================================
-- ADMIN PEMBANGUNAN MODULE (P42)
-- Independent module for Pembangunan Budget Management
-- ============================================================================

-- 1. Create Lookup Tables

CREATE TABLE IF NOT EXISTS admin_pembangunan_programs (
    program_code VARCHAR(10) PRIMARY KEY,
    program_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_pembangunan_objeks (
    program_code VARCHAR(10) NOT NULL REFERENCES admin_pembangunan_programs(program_code),
    objek_code VARCHAR(50) NOT NULL, -- Full identifier string (e.g. "01100 117 4002")
    objek_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (program_code, objek_code)
);

CREATE TABLE IF NOT EXISTS admin_pembangunan_kategoris (
    program_code VARCHAR(10) NOT NULL,
    objek_code VARCHAR(50) NOT NULL,
    kategori_code VARCHAR(20) NOT NULL, -- e.g. "24000"
    kategori_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (program_code, objek_code, kategori_code),
    FOREIGN KEY (program_code, objek_code) 
        REFERENCES admin_pembangunan_objeks(program_code, objek_code)
);

CREATE TABLE IF NOT EXISTS admin_pembangunan_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    program_code VARCHAR(10) NOT NULL,
    objek_code VARCHAR(50) NOT NULL,
    kategori_code VARCHAR(20) NOT NULL,
    fiscal_year INTEGER NOT NULL,
    allocated_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hospital_id, program_code, objek_code, kategori_code, fiscal_year),
    FOREIGN KEY (program_code, objek_code, kategori_code)
        REFERENCES admin_pembangunan_kategoris(program_code, objek_code, kategori_code)
);

-- 2. Main Transaction Table

CREATE TABLE IF NOT EXISTS admin_pembangunan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    
    -- Document Info
    document_no VARCHAR(50) NOT NULL,
    pembangunan_date DATE NOT NULL,
    fiscal_year INTEGER NOT NULL,
    
    -- Budget Classification
    program_code VARCHAR(10) NOT NULL,
    objek_code VARCHAR(50) NOT NULL,
    kategori_code VARCHAR(20) NOT NULL,
    
    -- Financials
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    description TEXT,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_admin_pembangunan_doc UNIQUE (hospital_id, document_no),
    FOREIGN KEY (program_code, objek_code, kategori_code)
        REFERENCES admin_pembangunan_kategoris(program_code, objek_code, kategori_code)
);

-- 3. RLS Policies

-- Enable RLS
ALTER TABLE admin_pembangunan_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_pembangunan_objeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_pembangunan_kategoris ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_pembangunan_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_pembangunan ENABLE ROW LEVEL SECURITY;

-- Read policies (Public reference data)
CREATE POLICY "admin_pembangunan_programs_read_all" ON admin_pembangunan_programs
    FOR SELECT USING (true);

CREATE POLICY "admin_pembangunan_objeks_read_all" ON admin_pembangunan_objeks
    FOR SELECT USING (true);

CREATE POLICY "admin_pembangunan_kategoris_read_all" ON admin_pembangunan_kategoris
    FOR SELECT USING (true);

-- Hospital Data Access Policies

-- Allocations
CREATE POLICY "admin_pembangunan_allocations_hospital_admin" ON admin_pembangunan_allocations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.hospital_id = admin_pembangunan_allocations.hospital_id
            AND (
                u.role_id IN (
                    SELECT id FROM roles WHERE role_code IN ('hospital_admin', 'hospital_administrator')
                )
            )
        )
    );

-- Main Records
CREATE POLICY "admin_pembangunan_hospital_admin" ON admin_pembangunan
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.hospital_id = admin_pembangunan.hospital_id
            AND (
                u.role_id IN (
                    SELECT id FROM roles WHERE role_code IN ('hospital_admin', 'hospital_administrator')
                )
            )
        )
    );

-- 4. Initial Data Seeding

-- 4.1 Programs
INSERT INTO admin_pembangunan_programs (program_code, program_name, description) VALUES
('P42', 'Pembangunan', 'Development Program')
ON CONFLICT (program_code) DO NOTHING;

-- 4.2 Objeks (Using Full Strings as Identifiers)
INSERT INTO admin_pembangunan_objeks (program_code, objek_code, objek_name, description) VALUES
('P42', '01100 117 4002', 'Sewaan Peralatan Perubatan', 'Medical Equipment Rental'),
('P42', '01200 117 1002', 'PSH (Perkhidmatan Sokongan Hospital)', 'Penyelenggaraan & Sokongan')
ON CONFLICT (program_code, objek_code) DO NOTHING;

-- 4.3 Kategoris
INSERT INTO admin_pembangunan_kategoris (program_code, objek_code, kategori_code, kategori_name, description) VALUES
-- Under 01100 117 4002
('P42', '01100 117 4002', '24000', 'Sewaan Peralatan Perubatan', 'Medical Equipment Rental'),

-- Under 01200 117 1002
('P42', '01200 117 1002', '28000', 'Penyelenggaraan', 'Maintenance'),
('P42', '01200 117 1002', '29000', 'Perkhidmatan Sokongan Hospital', 'Hospital Support Services')
ON CONFLICT (program_code, objek_code, kategori_code) DO NOTHING;

-- 5. Menu Integration & Permission Assignment

DO $$
DECLARE
    v_admin_financial_menu_id UUID;
    v_admin_operations_module_id UUID;
    v_feature_id UUID;
    v_role_id UUID;
BEGIN
    -- 5.1 Get IDs
    SELECT id INTO v_admin_operations_module_id FROM modules WHERE module_code = 'admin_operations';
    SELECT id INTO v_admin_financial_menu_id FROM menus WHERE path = '/admin/operations/financial';

    -- 5.2 Insert Menu Item
    IF v_admin_financial_menu_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM menus WHERE path = '/admin/operations/financial/pembangunan') THEN
            INSERT INTO menus (id, label, path, icon, module_code, parent_id, order_index)
            VALUES (
                gen_random_uuid(),
                'Admin Pembangunan',
                '/admin/operations/financial/pembangunan',
                'Building2',
                'admin_operations',
                v_admin_financial_menu_id,
                20  -- Assuming order after Warrant (which usually has lower index)
            );
        END IF;
    END IF;

    -- 5.3 Insert Feature & Grant Permissions
    IF v_admin_operations_module_id IS NOT NULL THEN
        -- Insert Feature
        IF NOT EXISTS (SELECT 1 FROM features WHERE feature_code = 'admin_pembangunan' AND module_id = v_admin_operations_module_id) THEN
            INSERT INTO features (id, module_id, feature_name, feature_code, description)
            VALUES (
                gen_random_uuid(),
                v_admin_operations_module_id,
                'Admin Pembangunan Management',
                'admin_pembangunan',
                'Manage P42 Pembangunan budgets'
            ) RETURNING id INTO v_feature_id;
        ELSE
            SELECT id INTO v_feature_id FROM features WHERE feature_code = 'admin_pembangunan' AND module_id = v_admin_operations_module_id;
        END IF;

        -- Grant Permissions to Hospital Admin Roles
        FOR v_role_id IN SELECT id FROM roles WHERE role_code IN ('hospital_admin', 'hospital_administrator')
        LOOP
             -- Insert into role_feature_permissions (RBAC system)
             INSERT INTO role_feature_permissions (role_id, feature_id, is_enabled)
             VALUES (v_role_id, v_feature_id, true)
             ON CONFLICT (role_id, feature_id) DO NOTHING;
        END LOOP;
    END IF;

END $$;
