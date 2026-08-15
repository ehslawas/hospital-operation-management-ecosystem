-- Migration: Add Passport Expiry Columns to MyCrossBorder Tables
-- Part of Malaysia-Brunei Cross Border Patient Transfer System

ALTER TABLE crossborder_patients ADD COLUMN IF NOT EXISTS passport_expiry DATE;
ALTER TABLE crossborder_escorts ADD COLUMN IF NOT EXISTS passport_expiry DATE;
ALTER TABLE crossborder_transfers ADD COLUMN IF NOT EXISTS pemandu_passport_expiry DATE;

COMMENT ON COLUMN crossborder_patients.passport_expiry IS 'Tarikh tamat tempoh pasport pesakit jika menggunakan pasport';
COMMENT ON COLUMN crossborder_escorts.passport_expiry IS 'Tarikh tamat tempoh pasport pengiring jika menggunakan pasport';
COMMENT ON COLUMN crossborder_transfers.pemandu_passport_expiry IS 'Tarikh tamat tempoh pasport pemandu ambulans/kenderaan';
