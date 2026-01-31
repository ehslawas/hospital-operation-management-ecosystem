-- ==========================================
-- Hospital Administrator Warrant Budget Hierarchy
-- Creates structured budget management for Programs, Objeks, Kategoris
-- Supports shared budget pools for grouped categories
-- ==========================================

-- ==========================================
-- 1. Reference Tables for Budget Hierarchy
-- ==========================================

-- 1.1 Programs (Aktiviti) - Top level
CREATE TABLE IF NOT EXISTS admin_warrant_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_code VARCHAR(10) NOT NULL UNIQUE,
    program_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Objeks - Second level (under Programs)
CREATE TABLE IF NOT EXISTS admin_warrant_objeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_code VARCHAR(10) NOT NULL REFERENCES admin_warrant_programs(program_code),
    objek_code VARCHAR(10) NOT NULL,
    objek_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_program_objek UNIQUE (program_code, objek_code)
);

-- 1.3 Budget Groups - For shared allocations
CREATE TABLE IF NOT EXISTS admin_warrant_budget_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    program_code VARCHAR(10) NOT NULL REFERENCES admin_warrant_programs(program_code),
    objek_code VARCHAR(10) NOT NULL,
    group_name VARCHAR(200) NOT NULL,
    group_code VARCHAR(50) NOT NULL, -- e.g., 'bekalan_27xxx', 'percetakan_29xxx'
    description TEXT,
    fiscal_year INTEGER NOT NULL,
    allocated_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_budget_group UNIQUE (hospital_id, program_code, objek_code, group_code, fiscal_year)
);

-- 1.4 Kategoris - Third level (under Objeks)
CREATE TABLE IF NOT EXISTS admin_warrant_kategoris (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_code VARCHAR(10) NOT NULL,
    objek_code VARCHAR(10) NOT NULL,
    kategori_code VARCHAR(10) NOT NULL,
    kategori_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_shared_budget BOOLEAN DEFAULT false, -- true if part of a shared budget group
    budget_group_code VARCHAR(50), -- links to budget_groups.group_code if shared
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_kategori UNIQUE (program_code, objek_code, kategori_code),
    CONSTRAINT fk_kategori_objek FOREIGN KEY (program_code, objek_code) 
        REFERENCES admin_warrant_objeks(program_code, objek_code)
);

-- 1.5 Individual Budget Allocations (for non-shared kategoris)
CREATE TABLE IF NOT EXISTS admin_warrant_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id),
    program_code VARCHAR(10) NOT NULL,
    objek_code VARCHAR(10) NOT NULL,
    kategori_code VARCHAR(10) NOT NULL,
    fiscal_year INTEGER NOT NULL,
    allocated_amount DECIMAL(15,2) DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_allocation_kategori FOREIGN KEY (program_code, objek_code, kategori_code)
        REFERENCES admin_warrant_kategoris(program_code, objek_code, kategori_code),
    CONSTRAINT unique_allocation UNIQUE (hospital_id, program_code, objek_code, kategori_code, fiscal_year)
);

-- ==========================================
-- 2. Alter admin_warrants table
-- ==========================================

-- Add new columns to existing admin_warrants table
ALTER TABLE admin_warrants 
ADD COLUMN IF NOT EXISTS program_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS objek_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS kategori_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS budget_group_id UUID REFERENCES admin_warrant_budget_groups(id),
ADD COLUMN IF NOT EXISTS fiscal_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);

-- ==========================================
-- 3. Enable Row Level Security
-- ==========================================

ALTER TABLE admin_warrant_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_warrant_objeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_warrant_budget_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_warrant_kategoris ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_warrant_allocations ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. Create RLS Policies
-- ==========================================

-- Programs and Objeks are reference data - readable by all authenticated users
DROP POLICY IF EXISTS "admin_warrant_programs_read_all" ON admin_warrant_programs;
CREATE POLICY "admin_warrant_programs_read_all" ON admin_warrant_programs
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "admin_warrant_objeks_read_all" ON admin_warrant_objeks;
CREATE POLICY "admin_warrant_objeks_read_all" ON admin_warrant_objeks
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "admin_warrant_kategoris_read_all" ON admin_warrant_kategoris;
CREATE POLICY "admin_warrant_kategoris_read_all" ON admin_warrant_kategoris
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Budget groups - hospital administrator only
DROP POLICY IF EXISTS "admin_budget_groups_hospital_admin" ON admin_warrant_budget_groups;
CREATE POLICY "admin_budget_groups_hospital_admin" ON admin_warrant_budget_groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.role_code = 'hospital_administrator'
            AND u.hospital_id = admin_warrant_budget_groups.hospital_id
        )
    );

-- Budget allocations - hospital administrator only
DROP POLICY IF EXISTS "admin_allocations_hospital_admin" ON admin_warrant_allocations;
CREATE POLICY "admin_allocations_hospital_admin" ON admin_warrant_allocations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.role_code = 'hospital_administrator'
            AND u.hospital_id = admin_warrant_allocations.hospital_id
        )
    );

-- ==========================================
-- 5. Seed Reference Data
-- ==========================================

-- 5.1 Insert Programs
INSERT INTO admin_warrant_programs (program_code, program_name, description) VALUES
    ('020200', 'Pengurusan Hospital', 'Hospital Management operational expenses'),
    ('022300', 'Dietetik Dan Sajian', 'Dietetics and Food Service expenses')
ON CONFLICT (program_code) DO NOTHING;

-- 5.2 Insert Objeks for 020200 - Pengurusan Hospital
INSERT INTO admin_warrant_objeks (program_code, objek_code, objek_name, description) VALUES
    ('020200', '24000', 'Sewaan', 'Rental expenses'),
    ('020200', '27000', 'Bekalan dan Bahan Lain', 'Supplies and other materials'),
    ('020200', '29000', 'Perkhidmatan Iktisas Yang Lain', 'Other professional services')
ON CONFLICT (program_code, objek_code) DO NOTHING;

-- 5.3 Insert Objeks for 022300 - Dietetik Dan Sajian
INSERT INTO admin_warrant_objeks (program_code, objek_code, objek_name, description) VALUES
    ('022300', '25000', 'Bahan Makanan dan Minuman', 'Food and beverage supplies'),
    ('022300', '27000', 'Bekalan dan Bahan Lain', 'Supplies and other materials'),
    ('022300', '29000', 'Perkhidmatan', 'Services')
ON CONFLICT (program_code, objek_code) DO NOTHING;

-- 5.4 Insert Kategoris for 020200 - Pengurusan Hospital

-- Under 24000 Sewaan (ALL OWN BUDGET)
INSERT INTO admin_warrant_kategoris (program_code, objek_code, kategori_code, kategori_name, is_shared_budget, budget_group_code) VALUES
    ('020200', '24000', '24699', 'Sewaan Mesin Penyalin', false, NULL),
    ('020200', '24000', '24999', 'Sewaan Gas Perubatan (Linde)', false, NULL),
    ('020200', '24000', '24202', 'Sewaan Bangunan Pejabat', false, NULL)
ON CONFLICT (program_code, objek_code, kategori_code) DO NOTHING;

-- Under 27000 Bekalan (SHARED BUDGET)
INSERT INTO admin_warrant_kategoris (program_code, objek_code, kategori_code, kategori_name, is_shared_budget, budget_group_code) VALUES
    ('020200', '27000', '27100', 'Bekalan Pejabat', true, 'bekalan_020200_27000'),
    ('020200', '27000', '27200', 'Bekalan Penyelenggaraan', true, 'bekalan_020200_27000'),
    ('020200', '27000', '27300', 'Bekalan Kebersihan', true, 'bekalan_020200_27000'),
    ('020200', '27000', '27600', 'Bekalan Elektrik', true, 'bekalan_020200_27000'),
    ('020200', '27000', '27700', 'Bekalan Lain', true, 'bekalan_020200_27000')
ON CONFLICT (program_code, objek_code, kategori_code) DO NOTHING;

-- Under 29000 Perkhidmatan (MIXED - some own, some shared)
INSERT INTO admin_warrant_kategoris (program_code, objek_code, kategori_code, kategori_name, is_shared_budget, budget_group_code) VALUES
    -- Own budget
    ('020200', '29000', '29199', 'Perkhidmatan Yang Lain (Meter Reading)', false, NULL),
    ('020200', '29000', '29122', 'Perkhidmatan Kawalan Keselamatan', false, NULL),
    -- Shared budget - Percetakan group
    ('020200', '29000', '29201', 'Perkhidmatan Percetakan', true, 'percetakan_020200_29000'),
    ('020200', '29000', '29202', 'Perkhidmatan Percetakan Khas', true, 'percetakan_020200_29000'),
    ('020200', '29000', '29299', 'Perkhidmatan Percetakan Lain', true, 'percetakan_020200_29000'),
    -- Shared budget - Makanan group
    ('020200', '29000', '29126', 'Perkhidmatan Persediaan Makanan', true, 'makanan_020200_29000'),
    ('020200', '29000', '29401', 'Perkhidmatan Katering', true, 'makanan_020200_29000'),
    ('020200', '29000', '29411', 'Perkhidmatan Makanan Lain', true, 'makanan_020200_29000')
ON CONFLICT (program_code, objek_code, kategori_code) DO NOTHING;

-- 5.5 Insert Kategoris for 022300 - Dietetik Dan Sajian

-- Under 25000 Bahan Makanan (SHARED BUDGET)
INSERT INTO admin_warrant_kategoris (program_code, objek_code, kategori_code, kategori_name, is_shared_budget, budget_group_code) VALUES
    ('022300', '25000', '25100', 'Bahan Makanan Segar', true, 'makanan_022300_25000'),
    ('022300', '25000', '25200', 'Bahan Makanan Kering', true, 'makanan_022300_25000'),
    ('022300', '25000', '25300', 'Bahan Makanan Sejuk Beku', true, 'makanan_022300_25000'),
    ('022300', '25000', '25400', 'Minuman', true, 'makanan_022300_25000'),
    ('022300', '25000', '25500', 'Perasa dan Rempah', true, 'makanan_022300_25000'),
    ('022300', '25000', '25600', 'Bahan Makanan Lain', true, 'makanan_022300_25000')
ON CONFLICT (program_code, objek_code, kategori_code) DO NOTHING;

-- Under 27000 Bekalan (SHARED BUDGET)
INSERT INTO admin_warrant_kategoris (program_code, objek_code, kategori_code, kategori_name, is_shared_budget, budget_group_code) VALUES
    ('022300', '27000', '27100', 'Bekalan Pejabat', true, 'bekalan_022300_27000'),
    ('022300', '27000', '27200', 'Bekalan Penyelenggaraan', true, 'bekalan_022300_27000'),
    ('022300', '27000', '27300', 'Bekalan Kebersihan', true, 'bekalan_022300_27000'),
    ('022300', '27000', '27600', 'Bekalan Elektrik', true, 'bekalan_022300_27000'),
    ('022300', '27000', '27700', 'Bekalan Lain', true, 'bekalan_022300_27000')
ON CONFLICT (program_code, objek_code, kategori_code) DO NOTHING;

-- Under 29000 Perkhidmatan (OWN BUDGET)
INSERT INTO admin_warrant_kategoris (program_code, objek_code, kategori_code, kategori_name, is_shared_budget, budget_group_code) VALUES
    ('022300', '29000', '29126', 'Perkhidmatan Persediaan Makanan (Outsource)', false, NULL)
ON CONFLICT (program_code, objek_code, kategori_code) DO NOTHING;

-- ==========================================
-- 6. Create Indexes for Performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_admin_warrants_program ON admin_warrants(program_code);
CREATE INDEX IF NOT EXISTS idx_admin_warrants_objek ON admin_warrants(objek_code);
CREATE INDEX IF NOT EXISTS idx_admin_warrants_kategori ON admin_warrants(kategori_code);
CREATE INDEX IF NOT EXISTS idx_admin_warrants_fiscal_year ON admin_warrants(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_admin_budget_groups_hospital ON admin_warrant_budget_groups(hospital_id);
CREATE INDEX IF NOT EXISTS idx_admin_budget_groups_fiscal ON admin_warrant_budget_groups(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_admin_allocations_hospital ON admin_warrant_allocations(hospital_id);
CREATE INDEX IF NOT EXISTS idx_admin_allocations_fiscal ON admin_warrant_allocations(fiscal_year);

-- ==========================================
-- 7. Create Helper Functions
-- ==========================================

-- Function to get total spent from a budget group
CREATE OR REPLACE FUNCTION get_admin_budget_group_spent(
    p_hospital_id UUID,
    p_group_code VARCHAR(50),
    p_fiscal_year INTEGER
) RETURNS DECIMAL(15,2) AS $$
DECLARE
    v_total DECIMAL(15,2);
BEGIN
    SELECT COALESCE(SUM(w.amount), 0) INTO v_total
    FROM admin_warrants w
    JOIN admin_warrant_kategoris k ON 
        w.program_code = k.program_code AND
        w.objek_code = k.objek_code AND
        w.kategori_code = k.kategori_code
    WHERE w.hospital_id = p_hospital_id
    AND k.budget_group_code = p_group_code
    AND w.fiscal_year = p_fiscal_year;
    
    RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total spent from an individual kategori allocation
CREATE OR REPLACE FUNCTION get_admin_kategori_spent(
    p_hospital_id UUID,
    p_program_code VARCHAR(10),
    p_objek_code VARCHAR(10),
    p_kategori_code VARCHAR(10),
    p_fiscal_year INTEGER
) RETURNS DECIMAL(15,2) AS $$
DECLARE
    v_total DECIMAL(15,2);
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO v_total
    FROM admin_warrants
    WHERE hospital_id = p_hospital_id
    AND program_code = p_program_code
    AND objek_code = p_objek_code
    AND kategori_code = p_kategori_code
    AND fiscal_year = p_fiscal_year;
    
    RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if expense exceeds budget
CREATE OR REPLACE FUNCTION check_admin_warrant_budget()
RETURNS TRIGGER AS $$
DECLARE
    v_kategori RECORD;
    v_allocated DECIMAL(15,2);
    v_spent DECIMAL(15,2);
    v_new_total DECIMAL(15,2);
BEGIN
    -- Get kategori info
    SELECT * INTO v_kategori
    FROM admin_warrant_kategoris
    WHERE program_code = NEW.program_code
    AND objek_code = NEW.objek_code
    AND kategori_code = NEW.kategori_code;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid kategori code';
    END IF;
    
    IF v_kategori.is_shared_budget THEN
        -- Check shared budget group
        SELECT COALESCE(allocated_amount, 0) INTO v_allocated
        FROM admin_warrant_budget_groups
        WHERE hospital_id = NEW.hospital_id
        AND group_code = v_kategori.budget_group_code
        AND fiscal_year = NEW.fiscal_year;
        
        v_spent := get_admin_budget_group_spent(NEW.hospital_id, v_kategori.budget_group_code, NEW.fiscal_year);
    ELSE
        -- Check individual allocation
        SELECT COALESCE(allocated_amount, 0) INTO v_allocated
        FROM admin_warrant_allocations
        WHERE hospital_id = NEW.hospital_id
        AND program_code = NEW.program_code
        AND objek_code = NEW.objek_code
        AND kategori_code = NEW.kategori_code
        AND fiscal_year = NEW.fiscal_year;
        
        v_spent := get_admin_kategori_spent(NEW.hospital_id, NEW.program_code, NEW.objek_code, NEW.kategori_code, NEW.fiscal_year);
    END IF;
    
    -- If updating, subtract old amount from spent
    IF TG_OP = 'UPDATE' THEN
        v_spent := v_spent - OLD.amount;
    END IF;
    
    v_new_total := v_spent + NEW.amount;
    
    -- Allow if within budget (or if no budget set - allocated = 0 means unlimited for now)
    IF v_allocated > 0 AND v_new_total > v_allocated THEN
        RAISE WARNING 'Budget exceeded: Allocated %, Spent %, New Amount %, Total would be %', 
            v_allocated, v_spent, NEW.amount, v_new_total;
        -- Note: We raise WARNING not EXCEPTION to allow over-budget (user can track this)
        -- Change to RAISE EXCEPTION if you want to block over-budget expenses
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for budget checking
DROP TRIGGER IF EXISTS check_admin_warrant_budget_trigger ON admin_warrants;
CREATE TRIGGER check_admin_warrant_budget_trigger
    BEFORE INSERT OR UPDATE ON admin_warrants
    FOR EACH ROW
    WHEN (NEW.program_code IS NOT NULL AND NEW.kategori_code IS NOT NULL)
    EXECUTE FUNCTION check_admin_warrant_budget();

COMMENT ON TABLE admin_warrant_programs IS 'Main programs/aktiviti for hospital admin warrants (e.g., 020200, 022300)';
COMMENT ON TABLE admin_warrant_objeks IS 'Object categories under each program (e.g., 24000 Sewaan, 27000 Bekalan)';
COMMENT ON TABLE admin_warrant_kategoris IS 'Specific budget line items under objeks with shared/individual budget tracking';
COMMENT ON TABLE admin_warrant_budget_groups IS 'Shared budget pools for kategoris that share a common allocation';
COMMENT ON TABLE admin_warrant_allocations IS 'Individual budget allocations for kategoris that have their own allocation';
