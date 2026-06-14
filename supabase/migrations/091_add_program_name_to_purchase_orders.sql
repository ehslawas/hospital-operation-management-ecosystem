-- Migration: 091_add_program_name_to_purchase_orders.sql
-- Description: Adds program_name column to pharmacy_purchase_orders table

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'program_name') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN program_name TEXT;
  END IF;
END $$;

COMMENT ON COLUMN pharmacy_purchase_orders.program_name IS 'Name of the program or event associated with this purchase order (optional)';
