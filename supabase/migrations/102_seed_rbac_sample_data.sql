-- ============================================================================
-- Migration 102: RBAC Sample/Seed Data
-- Description: Insert sample departments, roles, modules, features, and workflows
-- Created: 2026-01-18
-- ============================================================================

-- ============================================
-- PART 1: SAMPLE MODULES (Hierarchical Menu Structure)
-- ============================================

-- Insert parent modules
INSERT INTO public.modules (module_name, module_code, parent_module_id, route_path, icon_name, display_order, description)
VALUES 
    ('Dashboard', 'dashboard', NULL, '/dashboard',  'LayoutDashboard', 1, 'Main dashboard overview'),
    ('Patient Management', 'patient_management', NULL, '/patients', 'Users', 2, 'Patient records and management'),
    ('Pharmacy Management', 'pharmacy_management', NULL, '/pharmacy', 'Pill', 3, 'Pharmacy logistics and inventory'),
    ('Emergency Management', 'emergency_management', NULL, '/emergency', 'Ambulance', 4, 'Emergency and trauma services'),
    ('Pathology', 'pathology', NULL, '/pathology', 'Microscope', 5, 'Laboratory and pathology services'),
    ('Radiography', 'radiography', NULL, '/radiography', 'Scan', 6, 'Radiology and imaging services'),
    ('Approvals', 'approvals', NULL, '/approvals', 'CheckCircle', 7, 'Approval workflow dashboard'),
    ('Administration', 'administration', NULL, '/admin', 'Settings', 99, 'System administration')
ON CONFLICT (module_code) DO NOTHING;

-- Insert child modules (Patient Management)
INSERT INTO public.modules (module_name, module_code, parent_module_id, route_path, icon_name, display_order, description)
SELECT 
    'Patient List',
    'patient_management.list',
    m.id,
    '/patients/list',
    'List',
    1,
    'View all patients'
FROM public.modules m WHERE m.module_code = 'patient_management'
ON CONFLICT (module_code) DO NOTHING;

INSERT INTO public.modules (module_name, module_code, parent_module_id, route_path, icon_name, display_order, description)
SELECT 
    'Patient Registration',
    'patient_management.registration',
    m.id,
    '/patients/register',
    'UserPlus',
    2,
    'Register new patients'
FROM public.modules m WHERE m.module_code = 'patient_management'
ON CONFLICT (module_code) DO NOTHING;

-- Insert child modules (Pharmacy Management)
INSERT INTO public.modules (module_name, module_code, parent_module_id, route_path, icon_name, display_order, description)
SELECT 
    'Stock Management',
    'pharmacy_management.stock',
    m.id,
    '/pharmacy/stock',
    'Package',
    1,
    'Manage pharmacy inventory'
FROM public.modules m WHERE m.module_code = 'pharmacy_management'
ON CONFLICT (module_code) DO NOTHING;

INSERT INTO public.modules (module_name, module_code, parent_module_id, route_path, icon_name, display_order, description)
SELECT 
    'Purchasing',
    'pharmacy_management.purchasing',
    m.id,
    '/pharmacy/purchasing',
    'ShoppingCart',
    2,
    'Purchase orders and procurement'
FROM public.modules m WHERE m.module_code = 'pharmacy_management'
ON CONFLICT (module_code) DO NOTHING;

-- Insert child modules (Administration)
INSERT INTO public.modules (module_name, module_code, parent_module_id, route_path, icon_name, display_order, description)
SELECT 
    name,
    code,
    m.id,
    path,
    icon,
    ord,
    desc_text
FROM public.modules m
CROSS JOIN (VALUES
    ('Departments', 'administration.departments', '/admin/departments', 'Building2', 1, 'Manage departments'),
    ('Roles', 'administration.roles', '/admin/roles', 'ShieldCheck', 2, 'Manage roles'),
    ('Staff', 'administration.staff', '/admin/staff', 'Users', 3, 'Manage staff members'),
    ('Modules', 'administration.modules', '/admin/modules', 'Menu', 4, 'Manage system modules'),
    ('Features', 'administration.features', '/admin/features', 'Sparkles', 5, 'Manage features'),
    ('Permissions', 'administration.permissions', '/admin/permissions', 'Lock', 6, 'Configure role permissions'),
    ('Staff Permissions', 'administration.staff_permissions', '/admin/staff-permissions', 'UserCog', 7, 'Custom staff permissions'),
    ('Workflows', 'administration.workflows', '/admin/workflows', 'GitBranch', 8, 'Approval workflows')
) AS sub(name, code, path, icon, ord, desc_text)
WHERE m.module_code = 'administration'
ON CONFLICT (module_code) DO NOTHING;

-- ============================================
-- PART 2: SAMPLE FEATURES
-- ============================================

-- Pharmacy Stock Management Features
INSERT INTO public.features (module_id, feature_name, feature_code, description)
SELECT 
    m.id,
    feature.name,
    feature.code,
    feature.description
FROM public.modules m
CROSS JOIN (VALUES
    ('Add Stock', 'add_stock', 'Add new stock items'),
    ('Adjust Stock', 'adjust_stock', 'Adjust stock quantities'),
    ('Delete Stock', 'delete_stock', 'Remove stock items'),
    ('Transfer Stock', 'transfer_stock', 'Transfer stock between locations'),
    ('Stock Report', 'stock_report', 'Generate stock reports')
) AS feature(name, code, description)
WHERE m.module_code = 'pharmacy_management.stock'
ON CONFLICT (module_id, feature_code) DO NOTHING;

-- Pharmacy Purchasing Features
INSERT INTO public.features (module_id, feature_name, feature_code, description)
SELECT 
    m.id,
    feature.name,
    feature.code,
    feature.description
FROM public.modules m
CROSS JOIN (VALUES
    ('Create Purchase Order', 'create_purchase_order', 'Create new purchase orders'),
    ('Approve Purchase Order', 'approve_purchase_order', 'Approve purchase orders'),
    ('Cancel Purchase Order', 'cancel_purchase_order', 'Cancel purchase orders')
) AS feature(name, code, description)
WHERE m.module_code = 'pharmacy_management.purchasing'
ON CONFLICT (module_id, feature_code) DO NOTHING;

-- Emergency Management Features
INSERT INTO public.features (module_id, feature_name, feature_code, description)
SELECT 
    m.id,
    feature.name,
    feature.code,
    feature.description
FROM public.modules m
CROSS JOIN (VALUES
    ('Prescribe Medication', 'prescribe_medication', 'Prescribe medications to patients'),
    ('Order Lab Test', 'order_lab_test', 'Order laboratory tests'),
    ('Emergency Admission', 'emergency_admission', 'Admit emergency patients')
) AS feature(name, code, description)
WHERE m.module_code = 'emergency_management'
ON CONFLICT (module_id, feature_code) DO NOTHING;

-- ============================================
-- PART 3: SAMPLE ACTION TYPES & WORKFLOWS
-- ============================================

-- Insert Action Types
INSERT INTO public.action_types (type_name, type_code, description)
VALUES 
    ('Purchase Order', 'purchase_order', 'Purchase order creation and approval'),
    ('Prescription', 'prescription', 'Medication prescription approval'),
    ('Patient Discharge', 'patient_discharge', 'Patient discharge approval'),
    ('Stock Adjustment', 'stock_adjustment', 'Large stock adjustment approval')
ON CONFLICT (type_code) DO NOTHING;

-- Insert Sample Workflow: Medical Cylinder Purchase (amount > 5000)
DO $$
DECLARE
    v_workflow_id UUID;
    v_action_type_id UUID;
    v_pharmacy_head_role_id UUID;
    v_finance_manager_role_id UUID;
BEGIN
    -- Get action type ID
    SELECT id INTO v_action_type_id FROM public.action_types WHERE type_code = 'purchase_order';
    
    -- Get role IDs (assuming they exist from previous migrations)
    SELECT id INTO v_pharmacy_head_role_id FROM public.roles WHERE role_code ILIKE '%pharmacy%head%' OR role_name ILIKE '%pharmacy%head%' LIMIT 1;
    SELECT id INTO v_finance_manager_role_id FROM public.roles WHERE role_code ILIKE '%finance%manager%' OR role_name ILIKE '%finance%manager%' LIMIT 1;
    
    -- Skip if roles don't exist yet
    IF v_pharmacy_head_role_id IS NULL OR v_finance_manager_role_id IS NULL THEN
        RAISE NOTICE 'Skipping workflow creation - required roles not found';
        RETURN;
    END IF;
    
    -- Create workflow
    INSERT INTO public.approval_workflows (workflow_name, action_type_id, description, is_active)
    VALUES (
        'Medical Cylinder Purchase',
        v_action_type_id,
        'Approval workflow for medical cylinder purchases exceeding RM 5,000',
        true
    ) RETURNING id INTO v_workflow_id;
    
    -- Add condition: amount > 5000
    INSERT INTO public.approval_conditions (workflow_id, field_name, operator, field_value)
    VALUES (v_workflow_id, 'amount', '>', '5000');
    
    -- Add approval steps
    INSERT INTO public.approval_workflow_steps (workflow_id, step_order, approver_role_id, is_required, can_reject)
    VALUES 
        (v_workflow_id, 1, v_pharmacy_head_role_id, true, true),
        (v_workflow_id, 2, v_finance_manager_role_id, true, true);
    
    RAISE NOTICE 'Created sample workflow: Medical Cylinder Purchase';
END $$;

-- ============================================
-- PART 4: SAMPLE ROLE PERMISSIONS
-- ============================================
-- This section grants sample permissions to existing roles
-- Customize based on your actual role structure

DO $$
DECLARE
    v_assistant_pharmacist_role_id UUID;
    v_dashboard_module_id UUID;
    v_pharmacy_module_id UUID;
    v_stock_module_id UUID;
BEGIN
    -- Get role ID
    SELECT id INTO v_assistant_pharmacist_role_id 
    FROM public.roles 
    WHERE role_code = 'assistant_pharmacist' OR role_name ILIKE '%assistant%pharmacist%' 
    LIMIT 1;
    
    IF v_assistant_pharmacist_role_id IS NULL THEN
        RAISE NOTICE 'Assistant Pharmacist role not found - skipping permission grants';
        RETURN;
    END IF;
    
    -- Get module IDs
    SELECT id INTO v_dashboard_module_id FROM public.modules WHERE module_code = 'dashboard';
    SELECT id INTO v_pharmacy_module_id FROM public.modules WHERE module_code = 'pharmacy_management';
    SELECT id INTO v_stock_module_id FROM public.modules WHERE module_code = 'pharmacy_management.stock';
    
    -- Grant permissions
    INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete)
    VALUES 
        (v_assistant_pharmacist_role_id, v_dashboard_module_id, true, false, false, false),
        (v_assistant_pharmacist_role_id, v_pharmacy_module_id, true, false, false, false),
        (v_assistant_pharmacist_role_id, v_stock_module_id, true, true, true, false)
    ON CONFLICT (role_id, module_id) DO NOTHING;
    
    -- Grant feature permissions
    INSERT INTO public.role_feature_permissions (role_id, feature_id, is_enabled)
    SELECT 
        v_assistant_pharmacist_role_id,
        f.id,
        true
    FROM public.features f
    WHERE f.module_id = v_stock_module_id
        AND f.feature_code IN ('add_stock', 'adjust_stock', 'stock_report')
    ON CONFLICT (role_id, feature_id) DO NOTHING;
    
    RAISE NOTICE 'Granted sample permissions to Assistant Pharmacist';
END $$;

-- Grant admin roles full access to administration modules
DO $$
DECLARE
    v_system_admin_role_id UUID;
    v_hospital_admin_role_id UUID;
    v_admin_module_id UUID;
    v_module RECORD;
BEGIN
    -- Get admin role IDs
    SELECT id INTO v_system_admin_role_id FROM public.roles WHERE role_code = 'system_admin';
    SELECT id INTO v_hospital_admin_role_id FROM public.roles WHERE role_code = 'hospital_admin';
    
    SELECT id INTO v_admin_module_id FROM public.modules WHERE module_code = 'administration';
    
    IF v_system_admin_role_id IS NULL AND v_hospital_admin_role_id IS NULL THEN
        RAISE NOTICE 'Admin roles not found - skipping admin permission grants';
        RETURN;
    END IF;
    
    -- Grant full access to all admin submodules
    FOR v_module IN 
        SELECT id FROM public.modules WHERE parent_module_id = v_admin_module_id OR id = v_admin_module_id
    LOOP
        IF v_system_admin_role_id IS NOT NULL THEN
            INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete)
            VALUES (v_system_admin_role_id, v_module.id, true, true, true, true)
            ON CONFLICT (role_id, module_id) DO NOTHING;
        END IF;
        
        IF v_hospital_admin_role_id IS NOT NULL THEN
            INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete)
            VALUES (v_hospital_admin_role_id, v_module.id, true, true, true, true)
            ON CONFLICT (role_id, module_id) DO NOTHING;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Granted admin permissions to system and hospital admins';
END $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Summary reporting
DO $$
DECLARE
    v_module_count INTEGER;
    v_feature_count INTEGER;
    v_workflow_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_module_count FROM public.modules;
    SELECT COUNT(*) INTO v_feature_count FROM public.features;
    SELECT COUNT(*) INTO v_workflow_count FROM public.approval_workflows;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RBAC System Seeded Successfully';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Modules created: %', v_module_count;
    RAISE NOTICE 'Features created: %', v_feature_count;
    RAISE NOTICE 'Workflows created: %', v_workflow_count;
    RAISE NOTICE '========================================';
END $$;
