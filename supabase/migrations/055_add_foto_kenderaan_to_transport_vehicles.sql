-- Migration: Add foto_kenderaan column to transport_vehicles table

ALTER TABLE transport_vehicles ADD COLUMN IF NOT EXISTS foto_kenderaan TEXT;
