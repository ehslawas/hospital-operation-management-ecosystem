-- Add LOU flag to receiving items
ALTER TABLE pharmacy_receiving_items 
ADD COLUMN IF NOT EXISTS requires_lou BOOLEAN DEFAULT FALSE;
