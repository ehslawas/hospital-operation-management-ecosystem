-- Migration: Add CC Penalty System Fields
-- Date: 2026-01-25
-- Description: Adds fields required for CC Penalty calculation and document generation

ALTER TABLE pharmacy_penalties ADD COLUMN IF NOT EXISTS kkm_contract_number TEXT;
ALTER TABLE pharmacy_penalties ADD COLUMN IF NOT EXISTS tarikh_serahan TIMESTAMPTZ;
ALTER TABLE pharmacy_penalties ADD COLUMN IF NOT EXISTS calculated_penalty_amount DECIMAL(12,2);
ALTER TABLE pharmacy_penalties ADD COLUMN IF NOT EXISTS minimum_penalty_amount DECIMAL(12,2) DEFAULT 200.00;
ALTER TABLE pharmacy_penalties ADD COLUMN IF NOT EXISTS selected_penalty_type TEXT CHECK (selected_penalty_type IN ('calculated', 'minimum'));
ALTER TABLE pharmacy_penalties ADD COLUMN IF NOT EXISTS penalty_letter_url TEXT;
ALTER TABLE pharmacy_penalties ADD COLUMN IF NOT EXISTS calculation_sheet_url TEXT;

-- Index for querying by contract number
CREATE INDEX IF NOT EXISTS idx_pharmacy_penalties_kkm_contract_number ON pharmacy_penalties (kkm_contract_number);
