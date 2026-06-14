-- Migration: Oxygen Pricing System
-- Description: Creates tables for managing oxygen cylinder refill prices and loan rates.

-- ============================================
-- 1. Oxygen Pricing Configuration
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_oxygen_pricing_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospitals(id),
    cylinder_size_code TEXT NOT NULL, -- P101-D, P101-E, etc.
    refill_price DECIMAL(10,2) NOT NULL,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookup of current price
CREATE INDEX IF NOT EXISTS idx_oxygen_pricing_lookup ON pharmacy_oxygen_pricing_config (hospital_id, cylinder_size_code, effective_from DESC);

-- ============================================
-- 2. Oxygen System Settings
-- ============================================
CREATE TABLE IF NOT EXISTS pharmacy_oxygen_system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospitals(id) UNIQUE,
    loan_cylinder_rate DECIMAL(10,2) NOT NULL DEFAULT 14.00,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. Update Existing Tables for Better Tracking
-- ============================================
ALTER TABLE pharmacy_oxygen_reception_records 
ADD COLUMN IF NOT EXISTS refill_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS loan_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2) DEFAULT 0;

-- ============================================
-- 4. Seed Initial Pricing Data
-- ============================================
-- Note: Replace '00000000-0000-0000-0000-000000000000' with actual hospital_id in practice or use a function
-- For now, we'll insert global defaults if hospital_id is null or handle in service layer

INSERT INTO pharmacy_oxygen_pricing_config (cylinder_size_code, refill_price) VALUES
('P101-D', 49.60),
('P101-E', 54.60),
('P101-F', 56.75),
('P101-HS', 76.20),
('101-F', 56.75), -- Loan version uses same refill price
('101-N', 81.95)
ON CONFLICT DO NOTHING;
