/**
 * Migration: Item Movement Tracking System - Item Registry Table
 * 
 * Creates the `pharmacy_item_registry` table for tracking individual physical items
 * with QR codes. This enables dual-tracking of digital (system) and physical movements.
 * 
 * Supports both drugs and non-drugs with polymorphic item references.
 */

-- =====================================================
-- PHARMACY ITEM REGISTRY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS pharmacy_item_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    
    -- QR Code & Identification
    qr_code VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100),
    
    -- Polymorphic link to catalog item (drug or non_drug)
    item_id UUID NOT NULL,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('drug', 'non_drug')),
    
    -- Optional: Link to specific batch
    batch_id UUID REFERENCES pharmacy_stock_batches(id) ON DELETE SET NULL,
    
    -- Current State
    current_location VARCHAR(255) DEFAULT 'Store',
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN (
        'available',      -- In store, ready for use
        'issued',         -- Issued to department/ward
        'in_transit',     -- Being moved
        'consumed',       -- Used up (for consumables)
        'expired',        -- Past expiry date
        'damaged',        -- Damaged/unusable
        'returned'        -- Returned to supplier
    )),
    
    -- Tracking metadata
    last_scanned_at TIMESTAMPTZ,
    last_scanned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Additional metadata
    remarks TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_qr_per_hospital UNIQUE (hospital_id, qr_code)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary lookup index by QR code (most common query)
CREATE INDEX idx_item_registry_qr ON pharmacy_item_registry(qr_code);

-- Filter by hospital
CREATE INDEX idx_item_registry_hospital ON pharmacy_item_registry(hospital_id);

-- Filter by status
CREATE INDEX idx_item_registry_status ON pharmacy_item_registry(status);

-- Lookup by item (for finding all physical instances)
CREATE INDEX idx_item_registry_item ON pharmacy_item_registry(item_id, item_type);

-- Lookup by batch
CREATE INDEX idx_item_registry_batch ON pharmacy_item_registry(batch_id) WHERE batch_id IS NOT NULL;

-- Lookup by location
CREATE INDEX idx_item_registry_location ON pharmacy_item_registry(hospital_id, current_location);

-- Composite index for common filters
CREATE INDEX idx_item_registry_hospital_status ON pharmacy_item_registry(hospital_id, status);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_item_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_item_registry_updated_at
    BEFORE UPDATE ON pharmacy_item_registry
    FOR EACH ROW
    EXECUTE FUNCTION update_item_registry_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE pharmacy_item_registry ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view items in their hospital
CREATE POLICY "Users can view items in their hospital"
    ON pharmacy_item_registry
    FOR SELECT
    USING (
        hospital_id IN (
            SELECT hospital_id FROM users WHERE id = auth.uid()
        )
    );

-- Policy: Pharmacy staff can insert items
CREATE POLICY "Pharmacy staff can insert items"
    ON pharmacy_item_registry
    FOR INSERT
    WITH CHECK (
        hospital_id IN (
            SELECT hospital_id FROM users WHERE id = auth.uid()
        )
    );

-- Policy: Pharmacy staff can update items
CREATE POLICY "Pharmacy staff can update items"
    ON pharmacy_item_registry
    FOR UPDATE
    USING (
        hospital_id IN (
            SELECT hospital_id FROM users WHERE id = auth.uid()
        )
    );

-- Policy: Only admins can delete items
CREATE POLICY "Admins can delete items"
    ON pharmacy_item_registry
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND hospital_id = pharmacy_item_registry.hospital_id
            AND role_name IN ('System Admin', 'Hospital Admin', 'Head of Pharmacy')
        )
    );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE pharmacy_item_registry IS 'Tracks individual physical items with QR codes for dual-tracking of system and physical movements';
COMMENT ON COLUMN pharmacy_item_registry.qr_code IS 'Unique QR code identifier for the physical item';
COMMENT ON COLUMN pharmacy_item_registry.item_id IS 'Polymorphic reference to master_drugs or master_non_drugs';
COMMENT ON COLUMN pharmacy_item_registry.item_type IS 'Type of item: drug or non_drug';
COMMENT ON COLUMN pharmacy_item_registry.status IS 'Current status of the physical item';
COMMENT ON COLUMN pharmacy_item_registry.current_location IS 'Current physical location (Store, Ward name, etc)';
