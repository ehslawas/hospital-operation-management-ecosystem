-- 041_add_qr_tagging_to_cylinders.sql
-- Migration to support cylinder QR code tagging and monitoring

DO $$
BEGIN
    -- Alter pharmacy_oxygen_cylinders table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacy_oxygen_cylinders') THEN
        ALTER TABLE pharmacy_oxygen_cylinders 
        ADD COLUMN IF NOT EXISTS qr_code_value VARCHAR(255) UNIQUE DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS qr_tagged_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS qr_tagged_by UUID REFERENCES users(id) DEFAULT NULL;
    END IF;

    -- Alter pharmacy_oxygen_cylinder_inventory table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacy_oxygen_cylinder_inventory') THEN
        ALTER TABLE pharmacy_oxygen_cylinder_inventory 
        ADD COLUMN IF NOT EXISTS qr_code_value VARCHAR(255) UNIQUE DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS qr_tagged_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS qr_tagged_by UUID REFERENCES users(id) DEFAULT NULL;
    END IF;
END $$;

-- Create indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_cylinders_qr_code_value ON pharmacy_oxygen_cylinders(qr_code_value);
CREATE INDEX IF NOT EXISTS idx_cylinders_inventory_qr_code_value ON pharmacy_oxygen_cylinder_inventory(qr_code_value);
