-- Add payment details to pharmacy_penalties table
ALTER TABLE pharmacy_penalties 
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_reference TEXT;
