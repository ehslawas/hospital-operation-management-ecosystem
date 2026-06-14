-- Migration: Fix po_type check constraint
-- Description: Drops restrictive check constraints on po_type to allow 'manual' and 'sq' types.

-- 1. CC Expenses
ALTER TABLE pharmacy_cc_expenses DROP CONSTRAINT IF EXISTS pharmacy_cc_expenses_po_type_check;

-- 2. APPL Expenses
ALTER TABLE pharmacy_appl_expenses DROP CONSTRAINT IF EXISTS pharmacy_appl_expenses_po_type_check;

-- 3. Purchase Orders (Just in case)
ALTER TABLE pharmacy_purchase_orders DROP CONSTRAINT IF EXISTS pharmacy_purchase_orders_po_type_check;
