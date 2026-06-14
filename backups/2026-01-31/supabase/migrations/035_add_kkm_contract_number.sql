-- Add KKM Contract Number column to pharmacy_purchase_orders
ALTER TABLE pharmacy_purchase_orders
ADD COLUMN kkm_contract_number TEXT;

COMMENT ON COLUMN pharmacy_purchase_orders.kkm_contract_number IS 'KKM Contract Number, applicable when vote_code is 080702';
