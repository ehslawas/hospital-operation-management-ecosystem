-- 072_add_usage_notes_to_pharmacy_oxygen_dept_request_items.sql
-- Add usage_notes column to pharmacy_oxygen_dept_request_items for cylinder specification notes (e.g., Bullnose vs Pin Index)

ALTER TABLE pharmacy_oxygen_dept_request_items 
ADD COLUMN IF NOT EXISTS usage_notes TEXT;
