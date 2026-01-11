-- Migration: 045_inv_sq_manual_po.sql
-- Description: Schema updates for Invitation for Quotation (SQ) and Manual POs

-- 1. Update pharmacy_purchase_orders table
-- Add manual_supplier_name for Manual POs where supplier is not in the system
-- Add sq_suppliers to store multiple selected suppliers for SQ drafts
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'manual_supplier_name') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN manual_supplier_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_orders' AND column_name = 'sq_suppliers') THEN
    ALTER TABLE pharmacy_purchase_orders ADD COLUMN sq_suppliers JSONB;
  END IF;
END $$;

-- 2. Update pharmacy_purchase_order_items table
-- Make item_id nullable to support manual items that don't exist in the catalog
-- Add item_name and item_code to persist the manually entered details
DO $$ 
BEGIN
  -- We cannot easily DROP NOT NULL in a DO block efficiently if there are constraints, but typically it's fine.
  -- Use ALTER COLUMN ... DROP NOT NULL
  ALTER TABLE pharmacy_purchase_order_items ALTER COLUMN item_id DROP NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_order_items' AND column_name = 'item_name') THEN
    ALTER TABLE pharmacy_purchase_order_items ADD COLUMN item_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pharmacy_purchase_order_items' AND column_name = 'item_code') THEN
    ALTER TABLE pharmacy_purchase_order_items ADD COLUMN item_code TEXT;
  END IF;
END $$;
