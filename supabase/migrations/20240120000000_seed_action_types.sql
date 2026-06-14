
-- Add module column if it doesn't exist
ALTER TABLE action_types ADD COLUMN IF NOT EXISTS module TEXT DEFAULT 'pharmacy';

INSERT INTO action_types (type_code, type_name, description, module, created_at)
VALUES
  -- Pharmacy Module
  ('purchase_order_create', 'Purchase Order Creation', 'Approval required when creating a new standard Purchase Order', 'pharmacy', NOW()),
  ('purchase_order_high_value', 'High Value Purchase Order', 'Additional approval for POs exceeding RM 5,000', 'pharmacy', NOW()),
  ('lpo_create', 'Local Purchase Order (LPO)', 'Approval for Local Purchase Orders', 'pharmacy', NOW()),
  ('oxygen_cylinder_issue', 'Oxygen Cylinder Issuance', 'Approval to issue oxygen cylinders to departments', 'pharmacy', NOW()),
  ('drug_request_approve', 'Department Drug Request', 'Approval for drug requests from other departments', 'pharmacy', NOW()),
  ('stock_adjustment', 'Stock Adjustment', 'Approval for manual inventory stock adjustments', 'pharmacy', NOW()),
  ('supplier_return', 'Supplier Return', 'Approval to return items to suppliers', 'pharmacy', NOW()),

  -- Admin Module
  ('memo_publish', 'Publish Memo', 'Approval to publish a new hospital-wide memo', 'admin', NOW()),
  ('access_request_approve', 'Access Request', 'Approval for new user system access requests', 'admin', NOW()),
  ('sensitive_data_access', 'Sensitive Data Access', 'Approval to view sensitive patient or financial data', 'admin', NOW()),
  ('user_role_change', 'User Role Change', 'Approval to modify a users system role', 'admin', NOW())
ON CONFLICT (type_code) DO NOTHING;
