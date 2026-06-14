-- Migration: 051_allow_optional_manual_po_fields.sql
-- Description: Drop check constraints to allow NULL values for category, department, vote_code, and vote_activity in pharmacy_purchase_orders
-- This enables "Optional" fields for Manual POs as requested.

-- Drop known check constraints if they exist
DO $$ 
BEGIN
    ALTER TABLE pharmacy_purchase_orders DROP CONSTRAINT IF EXISTS pharmacy_purchase_orders_category_check;
    ALTER TABLE pharmacy_purchase_orders DROP CONSTRAINT IF EXISTS pharmacy_purchase_orders_department_check;
    ALTER TABLE pharmacy_purchase_orders DROP CONSTRAINT IF EXISTS pharmacy_purchase_orders_vote_code_check;
    ALTER TABLE pharmacy_purchase_orders DROP CONSTRAINT IF EXISTS pharmacy_purchase_orders_vote_activity_check;

    -- Add manual_supplier_address column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'manual_supplier_address') THEN
        ALTER TABLE pharmacy_purchase_orders ADD COLUMN manual_supplier_address TEXT;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint might not exist or another error occurred: %', SQLERRM;
END $$;
