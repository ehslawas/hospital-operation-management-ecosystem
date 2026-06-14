-- Migration: Add Reorder Level (Buffer) to Unit Catalog Items
-- Description: Adds reorder_level column to track buffer quantities per unit for each item.
-- Date: 2026-01-28

ALTER TABLE public.pharmacy_unit_catalog_items 
ADD COLUMN IF NOT EXISTS reorder_level INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.pharmacy_unit_catalog_items.reorder_level IS 'Minimum quantity that triggers a reorder/indent for this unit (Buffer Quantity)';
