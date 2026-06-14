/**
 * Migration: Item Movement Tracking System - Movement History Table
 * 
 * Creates the `pharmacy_item_movements` table for recording every physical movement
 * of tracked items. This creates an immutable audit trail for reconciliation and
 * government reporting (KEW.PS-4).
 * 
 * Captures: receiving, issuing, returns, transfers, consumption, and disposal.
 */

-- =====================================================
-- PHARMACY ITEM MOVEMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS pharmacy_item_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    
    -- Link to registered item
    item_registry_id UUID NOT NULL REFERENCES pharmacy_item_registry(id) ON DELETE CASCADE,
    
    -- Movement Details
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN (
        'registered',         -- Initial registration
        'received',           -- Received from supplier (physical scan)
        'issued',             -- Issued to department/ward (physical scan)
        'returned_from_dept', -- Returned from department
        'transferred',        -- Moved between locations
        'consumed',           -- Used/consumed
        'disposed',           -- Disposed/destroyed
        'returned_to_supplier', -- Returned to supplier
        'status_change'       -- Status update (e.g., to damaged/expired)
    )),
    
    -- Source document reference (for traceability)
    source_document_type VARCHAR(50), -- 'GRN', 'DO', 'REQUISITION', 'TRANSFER', 'ADJUSTMENT'
    source_document_id UUID,
    source_document_number VARCHAR(100),
    
    -- Location tracking
    from_location VARCHAR(255),
    to_location VARCHAR(255),
    
    -- Who performed the action
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Physical scan tracking
    scanned_at TIMESTAMPTZ,
    scan_method VARCHAR(20) DEFAULT 'qr' CHECK (scan_method IN ('qr', 'manual', 'barcode', 'rfid', 'nfc')),
    
    -- Status before and after (for audit trail)
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    
    -- Additional info
    quantity INTEGER DEFAULT 1,
    remarks TEXT,
    
    -- Metadata
    metadata JSONB, -- For extensibility
    
    -- Timestamps (immutable)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary lookup by registry item
CREATE INDEX idx_movements_registry ON pharmacy_item_movements(item_registry_id);

-- Filter by hospital
CREATE INDEX idx_movements_hospital ON pharmacy_item_movements(hospital_id);

-- Filter by movement type
CREATE INDEX idx_movements_type ON pharmacy_item_movements(movement_type);

-- Filter by date (most recent first)
CREATE INDEX idx_movements_date ON pharmacy_item_movements(performed_at DESC);

-- Lookup by source document
CREATE INDEX idx_movements_document ON pharmacy_item_movements(source_document_type, source_document_id);

-- Lookup by location
CREATE INDEX idx_movements_location ON pharmacy_item_movements(to_location);

-- Composite index for common queries (hospital + date range)
CREATE INDEX idx_movements_hospital_date ON pharmacy_item_movements(hospital_id, performed_at DESC);

-- Composite index for reconciliation queries
CREATE INDEX idx_movements_hospital_type_date ON pharmacy_item_movements(hospital_id, movement_type, performed_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update item registry on movement
CREATE OR REPLACE FUNCTION update_registry_on_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the registry's current location and status
    UPDATE pharmacy_item_registry
    SET 
        current_location = COALESCE(NEW.to_location, current_location),
        status = COALESCE(NEW.new_status, status),
        last_scanned_at = COALESCE(NEW.scanned_at, NOW()),
        last_scanned_by = NEW.performed_by
    WHERE id = NEW.item_registry_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_registry_on_movement
    AFTER INSERT ON pharmacy_item_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_registry_on_movement();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE pharmacy_item_movements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view movements in their hospital
CREATE POLICY "Users can view movements in their hospital"
    ON pharmacy_item_movements
    FOR SELECT
    USING (
        hospital_id IN (
            SELECT hospital_id FROM users WHERE id = auth.uid()
        )
    );

-- Policy: Pharmacy staff can insert movements
CREATE POLICY "Pharmacy staff can insert movements"
    ON pharmacy_item_movements
    FOR INSERT
    WITH CHECK (
        hospital_id IN (
            SELECT hospital_id FROM users WHERE id = auth.uid()
        )
    );

-- Policy: Movements are immutable (no updates)
-- This ensures audit trail integrity

-- Policy: Only system admins can delete movements (for corrections)
CREATE POLICY "System admins can delete movements"
    ON pharmacy_item_movements
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role_name = 'System Admin'
        )
    );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get complete movement history for an item
CREATE OR REPLACE FUNCTION get_item_movement_history(
    p_item_registry_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    movement_id UUID,
    movement_type VARCHAR,
    from_location VARCHAR,
    to_location VARCHAR,
    performed_at TIMESTAMPTZ,
    performed_by_name VARCHAR,
    scan_method VARCHAR,
    source_doc VARCHAR,
    remarks TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id AS movement_id,
        m.movement_type,
        m.from_location,
        m.to_location,
        m.performed_at,
        COALESCE(u.full_name, u.username) AS performed_by_name,
        m.scan_method,
        CONCAT(m.source_document_type, ': ', m.source_document_number) AS source_doc,
        m.remarks
    FROM pharmacy_item_movements m
    LEFT JOIN users u ON m.performed_by = u.id
    WHERE m.item_registry_id = p_item_registry_id
    ORDER BY m.performed_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to reconcile system vs physical movements
CREATE OR REPLACE FUNCTION reconcile_movements(
    p_hospital_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    item_id UUID,
    item_type VARCHAR,
    qr_code VARCHAR,
    system_location VARCHAR,
    last_scanned_location VARCHAR,
    discrepancy BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.item_id,
        r.item_type,
        r.qr_code,
        r.current_location AS system_location,
        (
            SELECT m.to_location
            FROM pharmacy_item_movements m
            WHERE m.item_registry_id = r.id
            AND m.scanned_at IS NOT NULL
            ORDER BY m.scanned_at DESC
            LIMIT 1
        ) AS last_scanned_location,
        r.current_location != (
            SELECT m.to_location
            FROM pharmacy_item_movements m
            WHERE m.item_registry_id = r.id
            AND m.scanned_at IS NOT NULL
            ORDER BY m.scanned_at DESC
            LIMIT 1
        ) AS discrepancy
    FROM pharmacy_item_registry r
    WHERE r.hospital_id = p_hospital_id
    AND r.last_scanned_at BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE pharmacy_item_movements IS 'Immutable audit trail of all physical item movements for reconciliation and government reporting';
COMMENT ON COLUMN pharmacy_item_movements.movement_type IS 'Type of movement: received, issued, returned, transferred, etc.';
COMMENT ON COLUMN pharmacy_item_movements.scanned_at IS 'When the item was physically scanned (NULL if manual entry)';
COMMENT ON COLUMN pharmacy_item_movements.scan_method IS 'How the item was identified: QR, barcode, manual, etc.';
COMMENT ON COLUMN pharmacy_item_movements.source_document_id IS 'Reference to the source transaction (GRN, requisition, etc.)';
