-- 045_add_supplier_tag_fields_to_cylinders.sql
-- Migration to support manual supplier tag entry for loan cylinders

DO $$
BEGIN
    -- Alter pharmacy_oxygen_cylinder_inventory table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacy_oxygen_cylinder_inventory') THEN
        ALTER TABLE pharmacy_oxygen_cylinder_inventory 
        ADD COLUMN IF NOT EXISTS supplier_tagged BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS supplier_tag_source TEXT DEFAULT NULL;
    END IF;
END $$;

-- Create index for fast lookup of supplier-tagged cylinders
CREATE INDEX IF NOT EXISTS idx_cylinders_inventory_supplier_tagged 
ON pharmacy_oxygen_cylinder_inventory(hospital_id, supplier_tagged)
WHERE supplier_tagged = true;

COMMENT ON COLUMN pharmacy_oxygen_cylinder_inventory.supplier_tagged 
IS 'TRUE when the cylinder serial/qr was manually entered from supplier tag (not system-generated)';

COMMENT ON COLUMN pharmacy_oxygen_cylinder_inventory.supplier_tag_source 
IS 'Source of supplier tag, e.g. manual, import, api';
