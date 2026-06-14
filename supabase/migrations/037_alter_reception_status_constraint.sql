-- 037_alter_reception_status_constraint.sql
-- Alter status CHECK constraint for pharmacy_oxygen_reception_records to support UI statuses

ALTER TABLE pharmacy_oxygen_reception_records 
DROP CONSTRAINT IF EXISTS pharmacy_oxygen_reception_records_status_check;

ALTER TABLE pharmacy_oxygen_reception_records
ADD CONSTRAINT pharmacy_oxygen_reception_records_status_check 
CHECK (status IN ('pending', 'completed', 'cancelled', 'pending_invoice', 'outstanding_po'));

-- Make cylinder_id nullable in pharmacy_oxygen_reception_items
ALTER TABLE pharmacy_oxygen_reception_items 
ALTER COLUMN cylinder_id DROP NOT NULL;

