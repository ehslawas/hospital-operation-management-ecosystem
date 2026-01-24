ALTER TABLE pharmacy_receiving_items 
ADD COLUMN IF NOT EXISTS batch_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS storage_location VARCHAR(100);
