-- Migration: APPL Penalty Performance Standards System
-- Description: Creates performance standards reference table and updates penalty schema for LAMPIRAN 9 form

-- ============================================
-- 1. Performance Standards Reference Table
-- ============================================
-- This table stores the 21 standard violation types from LAMPIRAN 9

CREATE TABLE IF NOT EXISTS penalty_performance_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL, -- e.g., PS01, PS02, etc.
    description_bm TEXT NOT NULL, -- Malay description from LAMPIRAN 9
    description_en TEXT, -- English translation (optional)
    penalty_formula TEXT NOT NULL, -- e.g., "1.5% x nilai produk gagal x bilangan hari lewat"
    penalty_type VARCHAR(20) NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed', 'per_incident'
    penalty_rate DECIMAL(10,4), -- e.g., 0.015 for 1.5%
    fixed_amount DECIMAL(15,2), -- For fixed penalties like RM500
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_performance_standards_code ON penalty_performance_standards(code);
CREATE INDEX IF NOT EXISTS idx_performance_standards_hospital ON penalty_performance_standards(hospital_id);

-- ============================================
-- 2. Update pharmacy_penalties table
-- ============================================

-- Add penalty type column
ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS penalty_type TEXT DEFAULT 'cc' CHECK (penalty_type IN ('appl', 'cc'));

-- Add performance standards violated array
ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS performance_standards_violated UUID[]; -- Array of selected standard IDs

-- Add certification fields (Prepared By)
ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS prepared_by_user_id UUID REFERENCES users(id);

ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS prepared_by_name TEXT;

ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS prepared_by_designation TEXT;

ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS prepared_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS prepared_signature_url TEXT; -- Digital signature image URL

-- Add certification fields (Verified By)
ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS verified_by_user_id UUID REFERENCES users(id);

ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS verified_by_name TEXT;

ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS verified_by_designation TEXT;

ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS verified_signature_url TEXT; -- Digital signature image URL

-- Add supplier acknowledgment fields
ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS supplier_acknowledged_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS supplier_signature_url TEXT;

ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS supplier_signatory_name TEXT;

ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS supplier_signatory_designation TEXT;

-- Add payment method selection (Kaedah Bayaran)
ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS payment_kaedah INTEGER CHECK (payment_kaedah IN (1, 2)); -- 1 = Potongan, 2 = Cek

-- Add PDF document URL
ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS penalty_pdf_url TEXT;

-- Add total order value for calculation reference
ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS total_order_value DECIMAL(15,2);

-- Add failed product value for calculation
ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS failed_product_value DECIMAL(15,2);

-- Add approval fields
ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

ALTER TABLE pharmacy_penalties
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 3. RLS Policies
-- ============================================

ALTER TABLE penalty_performance_standards ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'penalty_performance_standards' AND policyname = 'hospital_scoped_performance_standards') THEN
        CREATE POLICY hospital_scoped_performance_standards ON penalty_performance_standards
            FOR ALL USING (
                hospital_id IS NULL OR 
                hospital_id = (SELECT hospital_id FROM users WHERE id = auth.uid())
            );
    END IF;
END $$;

-- ============================================
-- 4. Seed Default Performance Standards (21 items from LAMPIRAN 9)
-- ============================================

INSERT INTO penalty_performance_standards (hospital_id, code, description_bm, description_en, penalty_formula, penalty_type, penalty_rate, fixed_amount, sort_order)
VALUES
    (NULL, 'PS01', 'Penghantaran produk melebihi 7 hari bekerja bagi Semenanjung Malaysia atau 10 hari bekerja bagi Sabah, Sarawak dan WP Labuan', 'Delivery exceeds 7 working days for Peninsular Malaysia or 10 working days for Sabah, Sarawak and WP Labuan', '1.5% x nilai produk gagal dibekalkan x bilangan hari lewat', 'percentage', 0.015, NULL, 1),
    (NULL, 'PS02', 'Penghantaran di luar waktu pejabat', 'Delivery outside office hours', 'RM500 bagi setiap insiden', 'fixed', NULL, 500.00, 2),
    (NULL, 'PS03', 'Tidak menepati lokasi penghantaran', 'Failed to deliver to specified location', 'RM500 bagi setiap insiden', 'fixed', NULL, 500.00, 3),
    (NULL, 'PS04', 'Kuantiti produk yang dibekal melebihi pesanan pada LPO', 'Quantity delivered exceeds LPO order', 'RM500 bagi setiap insiden', 'fixed', NULL, 500.00, 4),
    (NULL, 'PS05', 'Produk rosak, usang atau luput yang gagal digantikan setelah ditolak sebelum penerimaan dibuat', 'Damaged, obsolete or expired products not replaced after rejection before acceptance', '1.5% x nilai produk gagal x bilangan hari lewat', 'percentage', 0.015, NULL, 5),
    (NULL, 'PS06', 'Produk rosak, usang atau luput yang gagal digantikan setelah ditolak selepas penerimaan dibuat', 'Damaged, obsolete or expired products not replaced after rejection after acceptance', '1.5% x nilai produk gagal x bilangan hari lewat', 'percentage', 0.015, NULL, 6),
    (NULL, 'PS07', 'Produk tidak mengikut spesifikasi atau deskripsi pada LPO yang gagal digantikan setelah ditolak sebelum penerimaan dibuat', 'Products not meeting LPO specifications not replaced after rejection before acceptance', '1.5% x nilai produk gagal x bilangan hari lewat', 'percentage', 0.015, NULL, 7),
    (NULL, 'PS08', 'Produk tidak mengikut spesifikasi atau deskripsi pada LPO yang gagal digantikan setelah ditolak selepas penerimaan dibuat', 'Products not meeting LPO specifications not replaced after rejection after acceptance', '1.5% x nilai produk gagal x bilangan hari lewat', 'percentage', 0.015, NULL, 8),
    (NULL, 'PS09', 'Penghantaran melebihi 24 jam semasa Kecemasan', 'Delivery exceeds 24 hours during emergency', 'RM5,000 bagi setiap insiden', 'fixed', NULL, 5000.00, 9),
    (NULL, 'PS10', 'Penghantaran produk melebihi tempoh yang ditetapkan semasa pandemik atau epidemik', 'Delivery exceeds period set during pandemic or epidemic', '1.5% x nilai produk gagal dibekalkan x bilangan hari lewat', 'percentage', 0.015, NULL, 10),
    (NULL, 'PS11', 'Produk dengan baki jangka hayat kurang daripada 50% (bukan vaksin) atau 6 bulan (vaksin) yang gagal digantikan setelah ditolak sebelum penerimaan dibuat', 'Products with remaining shelf life less than 50% (non-vaccine) or 6 months (vaccine) not replaced after rejection before acceptance', '1.5% x nilai produk gagal x bilangan hari lewat', 'percentage', 0.015, NULL, 11),
    (NULL, 'PS12', 'Produk dengan baki jangka hayat kurang daripada 50% (bukan vaksin) atau 6 bulan (vaksin) yang gagal digantikan setelah ditolak selepas penerimaan dibuat', 'Products with remaining shelf life less than 50% (non-vaccine) or 6 months (vaccine) not replaced after rejection after acceptance', '1.5% x nilai produk gagal x bilangan hari lewat', 'percentage', 0.015, NULL, 12),
    (NULL, 'PS13', 'Produk yang dibekal dengan Letter of Undertaking (LOU) yang gagal digantikan dalam tempoh tujuh (7) hari bekerja dari tarikh', 'Products delivered with LOU not replaced within 7 working days', '1.5% x nilai produk gagal x bilangan hari lewat', 'percentage', 0.015, NULL, 13),
    (NULL, 'PS14', 'Produk yang dibekal tidak mematuhi keperluan rangkaian sejuk dan gagal digantikan mengikut tempoh serahan asal', 'Products not complying with cold chain requirements not replaced according to original delivery period', '1.5% x nilai produk gagal x bilangan hari lewat', 'percentage', 0.015, NULL, 14),
    (NULL, 'PS15', 'Produk rangkaian sejuk dibekal tanpa cold chain monitoring device (CCMD)', 'Cold chain products delivered without CCMD', 'RM500 x bilangan cold box tanpa CCMD', 'per_incident', NULL, 500.00, 15),
    (NULL, 'PS16', 'Tiada label "Kontrak Kerajaan"', 'No "Government Contract" label', '1.5% x nilai produk tanpa label', 'percentage', 0.015, NULL, 16),
    (NULL, 'PS17', 'Kelewatan penyerahan invois', 'Late invoice submission', 'RM50 x bilangan hari lewat', 'per_day', NULL, 50.00, 17),
    (NULL, 'PS18', 'Gagal menuntut bayaran dalam tahun kewangan semasa', 'Failed to claim payment in current financial year', 'RM500 bagi setiap invois', 'fixed', NULL, 500.00, 18),
    (NULL, 'PS19', 'Pembelian terus oleh Kerajaan - perbezaan di antara kos pengangkutan dan Handling fee', 'Direct government purchase - difference between transport cost and handling fee', 'Jumlah kos pengangkutan – jumlah Handling fee', 'custom', NULL, NULL, 19),
    (NULL, 'PS20', 'Gagal menggantikan produk yang dipanggil balik dalam tempoh 24 jam dari masa notifikasi atau mengikut tempoh yang ditentukan oleh Kerajaan', 'Failed to replace recalled products within 24 hours of notification or government-specified period', '1.5% x nilai produk gagal x bilangan hari lewat', 'percentage', 0.015, NULL, 20),
    (NULL, 'PS21', 'Gagal mematuhi paras stok penimbal', 'Failed to maintain buffer stock level', 'RM5,000 bagi setiap produk', 'fixed', NULL, 5000.00, 21)
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. Trigger for updated_at
-- ============================================

DROP TRIGGER IF EXISTS update_performance_standards_updated_at ON penalty_performance_standards;
CREATE TRIGGER update_performance_standards_updated_at
    BEFORE UPDATE ON penalty_performance_standards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
