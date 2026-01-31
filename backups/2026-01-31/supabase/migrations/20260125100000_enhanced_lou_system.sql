-- Create pharmacy_lou_items table
CREATE TABLE IF NOT EXISTS pharmacy_lou_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lou_id UUID NOT NULL REFERENCES pharmacy_lou(id) ON DELETE CASCADE,
    receiving_item_id UUID NOT NULL REFERENCES pharmacy_receiving_items(id),
    
    -- Core Item Details
    item_id UUID NOT NULL,
    item_name VARCHAR(255),
    item_code VARCHAR(100),
    item_type VARCHAR(50), 
    
    -- Tracking Details
    po_number VARCHAR(100),
    lpo_number VARCHAR(100),
    do_number VARCHAR(100),
    batch_number VARCHAR(100),
    expiry_date DATE,
    manufactured_date DATE,
    
    -- Quantity Info
    quantity_received INTEGER,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', 
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_lou_items_lou_id ON pharmacy_lou_items(lou_id);
CREATE INDEX IF NOT EXISTS idx_lou_items_status ON pharmacy_lou_items(status);

-- Add Columns to pharmacy_lou
ALTER TABLE pharmacy_lou 
ADD COLUMN IF NOT EXISTS po_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS lpo_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS do_numbers TEXT[], 
ADD COLUMN IF NOT EXISTS items_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255);

-- Enable RLS
ALTER TABLE pharmacy_lou_items ENABLE ROW LEVEL SECURITY;

-- Add Policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies 
        WHERE tablename = 'pharmacy_lou_items' 
        AND policyname = 'Allow all for authenticated users'
    ) THEN
        CREATE POLICY "Allow all for authenticated users" ON pharmacy_lou_items
            FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END
$$;
