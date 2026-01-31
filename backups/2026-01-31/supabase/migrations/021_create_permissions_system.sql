-- Migration: Create Permissions and Role Permissions System
-- This creates the tables needed for granular permission management

-- ============================================
-- 1. Permissions Table
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_code TEXT NOT NULL UNIQUE,
  permission_name TEXT NOT NULL,
  module TEXT NOT NULL,
  feature TEXT, -- Specific feature within module (e.g., 'inventory_view', 'inventory_edit')
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for permissions
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(permission_code);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_feature ON permissions(feature);

-- ============================================
-- 2. Role Permissions Table
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Indexes for role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_granted_by ON role_permissions(granted_by);

-- ============================================
-- 3. Updated_at Triggers
-- ============================================
CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Seed Default Permissions
-- ============================================
-- Pharmacy Logistics Permissions
INSERT INTO permissions (permission_code, permission_name, module, feature, description) VALUES
-- Inventory Management
('pharmacy_logistics.inventory.view', 'View Inventory', 'pharmacy_logistics', 'inventory', 'View inventory items and stock levels'),
('pharmacy_logistics.inventory.create', 'Create Inventory Item', 'pharmacy_logistics', 'inventory', 'Add new inventory items'),
('pharmacy_logistics.inventory.edit', 'Edit Inventory Item', 'pharmacy_logistics', 'inventory', 'Modify existing inventory items'),
('pharmacy_logistics.inventory.delete', 'Delete Inventory Item', 'pharmacy_logistics', 'inventory', 'Remove inventory items'),
('pharmacy_logistics.inventory.adjust', 'Adjust Stock', 'pharmacy_logistics', 'inventory', 'Adjust stock quantities'),
-- Drug Catalog
('pharmacy_logistics.drug_catalog.view', 'View Drug Catalog', 'pharmacy_logistics', 'drug_catalog', 'View drug catalog'),
('pharmacy_logistics.drug_catalog.create', 'Add Drug', 'pharmacy_logistics', 'drug_catalog', 'Add new drugs to catalog'),
('pharmacy_logistics.drug_catalog.edit', 'Edit Drug', 'pharmacy_logistics', 'drug_catalog', 'Modify drug information'),
('pharmacy_logistics.drug_catalog.delete', 'Delete Drug', 'pharmacy_logistics', 'drug_catalog', 'Remove drugs from catalog'),
-- Non-Drug Catalog
('pharmacy_logistics.non_drug_catalog.view', 'View Non-Drug Catalog', 'pharmacy_logistics', 'non_drug_catalog', 'View non-drug items catalog'),
('pharmacy_logistics.non_drug_catalog.create', 'Add Non-Drug Item', 'pharmacy_logistics', 'non_drug_catalog', 'Add new non-drug items'),
('pharmacy_logistics.non_drug_catalog.edit', 'Edit Non-Drug Item', 'pharmacy_logistics', 'non_drug_catalog', 'Modify non-drug items'),
('pharmacy_logistics.non_drug_catalog.delete', 'Delete Non-Drug Item', 'pharmacy_logistics', 'non_drug_catalog', 'Remove non-drug items'),
-- Purchase Orders
('pharmacy_logistics.purchase_order.view', 'View Purchase Orders', 'pharmacy_logistics', 'purchase_order', 'View purchase orders'),
('pharmacy_logistics.purchase_order.create', 'Create Purchase Order', 'pharmacy_logistics', 'purchase_order', 'Create new purchase orders'),
('pharmacy_logistics.purchase_order.edit', 'Edit Purchase Order', 'pharmacy_logistics', 'purchase_order', 'Modify purchase orders'),
('pharmacy_logistics.purchase_order.approve', 'Approve Purchase Order', 'pharmacy_logistics', 'purchase_order', 'Approve purchase orders'),
('pharmacy_logistics.purchase_order.delete', 'Delete Purchase Order', 'pharmacy_logistics', 'purchase_order', 'Delete purchase orders'),
-- Goods Receipt
('pharmacy_logistics.goods_receipt.view', 'View Goods Receipt', 'pharmacy_logistics', 'goods_receipt', 'View goods receipts'),
('pharmacy_logistics.goods_receipt.create', 'Create Goods Receipt', 'pharmacy_logistics', 'goods_receipt', 'Create goods receipts'),
('pharmacy_logistics.goods_receipt.edit', 'Edit Goods Receipt', 'pharmacy_logistics', 'goods_receipt', 'Modify goods receipts'),
('pharmacy_logistics.goods_receipt.approve', 'Approve Goods Receipt', 'pharmacy_logistics', 'goods_receipt', 'Approve goods receipts'),
-- Distribution
('pharmacy_logistics.distribution.view', 'View Distribution', 'pharmacy_logistics', 'distribution', 'View distribution records'),
('pharmacy_logistics.distribution.create', 'Create Distribution', 'pharmacy_logistics', 'distribution', 'Create distribution records'),
('pharmacy_logistics.distribution.edit', 'Edit Distribution', 'pharmacy_logistics', 'distribution', 'Modify distribution records'),
('pharmacy_logistics.distribution.approve', 'Approve Distribution', 'pharmacy_logistics', 'distribution', 'Approve distribution requests'),
-- Reports
('pharmacy_logistics.reports.view', 'View Reports', 'pharmacy_logistics', 'reports', 'View pharmacy logistics reports'),
('pharmacy_logistics.reports.export', 'Export Reports', 'pharmacy_logistics', 'reports', 'Export reports to various formats'),
-- Dashboard
('pharmacy_logistics.dashboard.view', 'View Dashboard', 'pharmacy_logistics', 'dashboard', 'Access pharmacy logistics dashboard')
ON CONFLICT (permission_code) DO NOTHING;

-- General Administration Permissions
INSERT INTO permissions (permission_code, permission_name, module, feature, description) VALUES
-- Users
('admin.users.view', 'View Users', 'admin', 'users', 'View user list and details'),
('admin.users.create', 'Create User', 'admin', 'users', 'Create new users'),
('admin.users.edit', 'Edit User', 'admin', 'users', 'Modify user information'),
('admin.users.delete', 'Delete User', 'admin', 'users', 'Remove users'),
('admin.users.activate', 'Activate/Deactivate User', 'admin', 'users', 'Change user status'),
-- Departments
('admin.departments.view', 'View Departments', 'admin', 'departments', 'View department list'),
('admin.departments.create', 'Create Department', 'admin', 'departments', 'Create new departments'),
('admin.departments.edit', 'Edit Department', 'admin', 'departments', 'Modify departments'),
('admin.departments.delete', 'Delete Department', 'admin', 'departments', 'Remove departments'),
-- Roles & Permissions
('admin.roles.view', 'View Roles', 'admin', 'roles', 'View role list'),
('admin.roles.create', 'Create Role', 'admin', 'roles', 'Create new roles'),
('admin.roles.edit', 'Edit Role', 'admin', 'roles', 'Modify roles'),
('admin.roles.delete', 'Delete Role', 'admin', 'roles', 'Remove roles'),
('admin.roles.manage_permissions', 'Manage Permissions', 'admin', 'roles', 'Assign permissions to roles'),
-- Access Requests
('admin.access_requests.view', 'View Access Requests', 'admin', 'access_requests', 'View access request list'),
('admin.access_requests.approve', 'Approve Access Requests', 'admin', 'access_requests', 'Approve or reject access requests'),
-- Memos
('admin.memos.view', 'View Memos', 'admin', 'memos', 'View memo list'),
('admin.memos.create', 'Create Memo', 'admin', 'memos', 'Create new memos'),
('admin.memos.edit', 'Edit Memo', 'admin', 'memos', 'Modify memos'),
('admin.memos.approve', 'Approve Memo', 'admin', 'memos', 'Approve memo submissions'),
('admin.memos.delete', 'Delete Memo', 'admin', 'memos', 'Remove memos'),
-- Sensitive Data Requests
('admin.sensitive_data.view', 'View Sensitive Data Requests', 'admin', 'sensitive_data', 'View sensitive data access requests'),
('admin.sensitive_data.approve', 'Approve Sensitive Data Requests', 'admin', 'sensitive_data', 'Approve or deny sensitive data access')
ON CONFLICT (permission_code) DO NOTHING;

-- Comments
COMMENT ON TABLE permissions IS 'System permissions for controlling access to features and pages';
COMMENT ON TABLE role_permissions IS 'Mapping of permissions to roles';
COMMENT ON COLUMN permissions.module IS 'Module name (e.g., pharmacy_logistics, admin)';
COMMENT ON COLUMN permissions.feature IS 'Specific feature within module (e.g., inventory, purchase_order)';

