-- Drop the existing strict constraint (one item per contract number)
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_hospital_id_contract_number_key;

-- Add new composite constraint (allow same contract number if item name is different)
ALTER TABLE contracts ADD CONSTRAINT contracts_hospital_id_contract_number_item_name_key UNIQUE (hospital_id, contract_number, item_name);
