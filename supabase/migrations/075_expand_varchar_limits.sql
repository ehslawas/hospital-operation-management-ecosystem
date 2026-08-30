-- Migration 075: Expand varchar limits on procurement, warrants, and purchase order tables
-- Fixes PostgreSQL error 22001 (value too long for type character varying(10))

ALTER TABLE pharmacy_purchase_orders 
  ALTER COLUMN vote_code TYPE TEXT,
  ALTER COLUMN vote_activity TYPE TEXT,
  ALTER COLUMN category TYPE TEXT,
  ALTER COLUMN department TYPE TEXT,
  ALTER COLUMN po_number TYPE TEXT,
  ALTER COLUMN po_type TYPE TEXT,
  ALTER COLUMN status TYPE TEXT,
  ALTER COLUMN payment_terms TYPE TEXT;

ALTER TABLE pharmacy_warrants 
  ALTER COLUMN vote_code TYPE TEXT,
  ALTER COLUMN vote_activity TYPE TEXT,
  ALTER COLUMN category TYPE TEXT;

ALTER TABLE pharmacy_appl_expenses 
  ALTER COLUMN vote_activity TYPE TEXT,
  ALTER COLUMN category TYPE TEXT,
  ALTER COLUMN po_type TYPE TEXT,
  ALTER COLUMN status TYPE TEXT,
  ALTER COLUMN lpo_number TYPE TEXT,
  ALTER COLUMN po_number TYPE TEXT;

ALTER TABLE pharmacy_lpo 
  ALTER COLUMN status TYPE TEXT,
  ALTER COLUMN lpo_number TYPE TEXT;

ALTER TABLE pharmacy_purchase_order_items 
  ALTER COLUMN item_type TYPE TEXT;
