-- Migration: Department-based PO Signatures
-- Description: Adds department_id to pharmacy_settings and signature_snapshot to pharmacy_purchase_orders
-- Date: 2026-01-22

-- 1. Add department_id to pharmacy_settings if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pharmacy_settings' 
        AND column_name = 'department_id'
    ) THEN
        ALTER TABLE pharmacy_settings ADD COLUMN department_id TEXT;
    END IF;
END $$;

-- 2. Update unique constraint
ALTER TABLE pharmacy_settings 
DROP CONSTRAINT IF EXISTS pharmacy_settings_hospital_id_setting_key_key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'pharmacy_settings_hospital_dept_key_unique'
    ) THEN
        ALTER TABLE pharmacy_settings 
        ADD CONSTRAINT pharmacy_settings_hospital_dept_key_unique 
        UNIQUE (hospital_id, setting_key, department_id);
    END IF;
END $$;

-- 3. Add signature_snapshot to pharmacy_purchase_orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pharmacy_purchase_orders' 
        AND column_name = 'signature_snapshot'
    ) THEN
        ALTER TABLE pharmacy_purchase_orders ADD COLUMN signature_snapshot JSONB;
    END IF;
END $$;

-- 4. Duplicate existing settings for other departments to ensure they have a starting point
-- Loop through known departments that need signatures
INSERT INTO pharmacy_settings (hospital_id, setting_key, setting_value, department_id, updated_at)
SELECT 
    hospital_id, 
    setting_key, 
    setting_value, 
    'pathology',
    NOW()
FROM pharmacy_settings 
WHERE setting_key = 'pharmacy_po_signatures' 
AND department_id IS NULL OR department_id = 'pharmacy_logistics'
ON CONFLICT DO NOTHING;

INSERT INTO pharmacy_settings (hospital_id, setting_key, setting_value, department_id, updated_at)
SELECT 
    hospital_id, 
    setting_key, 
    setting_value, 
    'hospital_admin',
    NOW()
FROM pharmacy_settings 
WHERE setting_key = 'pharmacy_po_signatures' 
AND department_id IS NULL OR department_id = 'pharmacy_logistics'
ON CONFLICT DO NOTHING;

-- 5. Finally, migrate the original NULL record to 'pharmacy_logistics' if it hasn't been done
UPDATE pharmacy_settings
SET department_id = 'pharmacy_logistics'
WHERE setting_key = 'pharmacy_po_signatures' 
AND department_id IS NULL;
