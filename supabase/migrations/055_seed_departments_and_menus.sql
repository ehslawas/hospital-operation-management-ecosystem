-- Migration: Seed Departments and Menus
-- Description: Populate departments and menu structure based on official hospital departments

-- First, ensure we have the departments from the official list
-- Note: Some departments may already exist, so we use INSERT ... ON CONFLICT DO NOTHING

-- Insert/Update Departments
INSERT INTO public.departments (id, hospital_id, department_code, department_name, description, status)
VALUES
    -- Get the first hospital ID for seeding
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'EMERGENCY_TRAUMA', 'Emergency & Trauma', 'Emergency and trauma care services', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'RADIOLOGY', 'Radiology & Radiography', 'Imaging and radiology services', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'CSSU_CSSD', 'CSSU/CSSD', 'Central Sterile Supply Unit', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'ASSET_MGMT', 'Asset Management', 'Hospital asset and equipment management', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'ADVANCED_REPORTS', 'Advanced Reports', 'Advanced reporting and analytics', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'MATERNITY_WARD', 'Maternity Ward', 'Maternity and obstetrics care', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'PHARMACY_LOGISTICS', 'Pharmacy Logistics', 'Central pharmacy logistics and inventory', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'PAEDIATRIC_WARD', 'Paediatric Ward', 'Paediatric patient care', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'HAEMODIALYSIS', 'Haemodialysis', 'Haemodialysis unit', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'PHARMACY_GALENICAL', 'Pharmacy Galenical & Prepacking', 'Extemporaneous preparation', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'PHARMACY_EMERGENCY', 'Pharmacy Emergency', 'Emergency pharmacy operations', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'PHARMACY_INPATIENT', 'Pharmacy In Patient', 'Inpatient medication management', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'LABORATORY', 'Pathologist', 'Laboratory tests and results', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'PHARMACY_SUBSTORE', 'Pharmacy Substore', 'Substore inventory management', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'HUMAN_RESOURCES', 'Human Resources', 'HR operations and employee data', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'OPERATION_THEATER', 'Operation Theater', 'Operation theater scheduling', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'FINANCIAL_BILLING', 'Financial & Billing', 'Financial and billing operations', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'KLINIK_PAKAR', 'Klinik Pakar', 'Specialist clinic management', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'GENERAL_WARD', 'General Ward', 'General ward patient management', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'HOSPITAL_OFFICE', 'Hospital Office', 'Hospital administration office', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'DRIVER_ROOM', 'Driver Room', 'Driver and transport management', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'FRONT_DESK', 'Front Desk', 'Reception and registration', 'active'),
    (gen_random_uuid(), (SELECT id FROM public.hospitals LIMIT 1), 'PHARMACY_OUTPATIENT', 'Pharmacy Outpatient', 'Outpatient dispensing', 'active')
ON CONFLICT (hospital_id, department_code) DO NOTHING;

-- Insert Shared Menus (Available to all departments)
INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
VALUES
    -- Top Level Shared Menus
    (gen_random_uuid(), 'Dashboard', '/dashboard', 'LayoutDashboard', NULL, 1, false, NULL, 'dashboard'),
    (gen_random_uuid(), 'Financial', '/financial', 'BarChart3', NULL, 2, false, NULL, 'financial'),
    (gen_random_uuid(), 'Procurement', '/procurement', 'ShoppingCart', NULL, 3, false, NULL, 'procurement'),
    (gen_random_uuid(), 'Distribution', '/distribution', 'Truck', NULL, 4, false, NULL, 'distribution'),
    (gen_random_uuid(), 'Medical Oxygen', '/oxygen', 'Activity', NULL, 5, false, NULL, 'oxygen'),
    (gen_random_uuid(), 'Catalogs', '/catalogs', 'ClipboardList', NULL, 6, false, NULL, 'catalogs'),
    (gen_random_uuid(), 'Maintenance', '/maintenance', 'Settings', NULL, 7, false, NULL, 'maintenance')
ON CONFLICT (path) DO NOTHING;

-- Insert Financial Sub-menus (Shared)
WITH financial_parent AS (
    SELECT id FROM public.menus WHERE path = '/financial' LIMIT 1
)
INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
SELECT 
    gen_random_uuid(),
    unnest(ARRAY['Warrant', 'APPL Allocation', 'CC Allocation', 'LP Allocation']),
    unnest(ARRAY['/financial/warrant', '/financial/appl', '/financial/cc', '/financial/lp']),
    'FileText',
    financial_parent.id,
    unnest(ARRAY[1, 2, 3, 4]),
    false,
    NULL,
    unnest(ARRAY['warrant', 'appl', 'cc', 'lp'])
FROM financial_parent
ON CONFLICT (path) DO NOTHING;

-- Insert Procurement Sub-menus (Shared)
WITH procurement_parent AS (
    SELECT id FROM public.menus WHERE path = '/procurement' LIMIT 1
)
INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
SELECT 
    gen_random_uuid(),
    unnest(ARRAY['Purchase Orders', 'LPO', 'Order Tracking', 'Receiving', 'Payments', 'Penalties', 'Letters of Undertaking']),
    unnest(ARRAY['/procurement/orders', '/procurement/lpo', '/procurement/tracking', '/procurement/receiving', '/procurement/payments', '/procurement/penalties', '/procurement/lou']),
    unnest(ARRAY['ShoppingCart', 'FileText', 'Truck', 'FileText', 'FileText', 'AlertTriangle', 'FileText']),
    procurement_parent.id,
    unnest(ARRAY[1, 2, 3, 4, 5, 6, 7]),
    false,
    NULL,
    unnest(ARRAY['po', 'lpo', 'tracking', 'receiving', 'payment', 'penalty', 'lou'])
FROM procurement_parent
ON CONFLICT (path) DO NOTHING;

-- Insert Catalogs Sub-menus (Shared)
WITH catalogs_parent AS (
    SELECT id FROM public.menus WHERE path = '/catalogs' LIMIT 1
)
INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
SELECT 
    gen_random_uuid(),
    unnest(ARRAY['Drug Catalog', 'Non-Drug Catalog', 'Supplier Catalog', 'Contract Catalog', 'Hospital Facilities', 'Clinic Facilities']),
    unnest(ARRAY['/catalogs/drugs', '/catalogs/non-drugs', '/catalogs/suppliers', '/catalogs/contracts', '/catalogs/hospitals', '/catalogs/clinics']),
    unnest(ARRAY['Package', 'Package', 'Truck', 'FileText', 'Building2', 'Building2']),
    catalogs_parent.id,
    unnest(ARRAY[1, 2, 3, 4, 5, 6]),
    false,
    NULL,
    unnest(ARRAY['drug_catalog', 'non_drug_catalog', 'supplier_catalog', 'contract_catalog', 'hospital_facility', 'clinic_facility'])
FROM catalogs_parent
ON CONFLICT (path) DO NOTHING;

-- Insert Maintenance Sub-menus (Shared)
WITH maintenance_parent AS (
    SELECT id FROM public.menus WHERE path = '/maintenance' LIMIT 1
)
INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
SELECT 
    gen_random_uuid(),
    unnest(ARRAY['Unit Catalog', 'Stock Locations', 'Stock Verification']),
    unnest(ARRAY['/maintenance/units', '/maintenance/locations', '/maintenance/verification']),
    unnest(ARRAY['ClipboardList', 'Package', 'ClipboardList']),
    maintenance_parent.id,
    unnest(ARRAY[1, 2, 3]),
    false,
    NULL,
    unnest(ARRAY['unit_catalog', 'stock_location', 'stock_verification'])
FROM maintenance_parent
ON CONFLICT (path) DO NOTHING;

-- Insert Core Menus for Emergency & Trauma
WITH emergency_dept AS (
    SELECT id FROM public.departments WHERE department_code = 'EMERGENCY_TRAUMA' LIMIT 1
)
INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
SELECT 
    gen_random_uuid(),
    unnest(ARRAY['Triage', 'Patient Management']),
    unnest(ARRAY['/emergency/triage', '/emergency/patients']),
    unnest(ARRAY['Activity', 'Users']),
    NULL,
    unnest(ARRAY[10, 11]),
    true,
    emergency_dept.id,
    unnest(ARRAY['triage', 'patient_management'])
FROM emergency_dept
ON CONFLICT (path) DO NOTHING;

-- Insert Core Menus for Pharmacy Logistics (existing pharmacy menus)
WITH pharmacy_dept AS (
    SELECT id FROM public.departments WHERE department_code = 'PHARMACY_LOGISTICS' LIMIT 1
)
INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
SELECT 
    gen_random_uuid(),
    'Pharmacy Logistics',
    '/pharmacy',
    'Package',
    NULL,
    8,
    true,
    pharmacy_dept.id,
    'pharmacy_logistics'
FROM pharmacy_dept
ON CONFLICT (path) DO NOTHING;

-- Add Pharmacy sub-menus (Inventory, Reports, etc.)
WITH pharmacy_parent AS (
    SELECT id FROM public.menus WHERE path = '/pharmacy' LIMIT 1
),
pharmacy_dept AS (
    SELECT id FROM public.departments WHERE department_code = 'PHARMACY_LOGISTICS' LIMIT 1
)
INSERT INTO public.menus (id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
SELECT 
    gen_random_uuid(),
    unnest(ARRAY['Inventory', 'Reports & Logs']),
    unnest(ARRAY['/pharmacy/inventory', '/pharmacy/reports']),
    unnest(ARRAY['Package', 'BarChart3']),
    pharmacy_parent.id,
    unnest(ARRAY[1, 2]),
    true,
    pharmacy_dept.id,
    unnest(ARRAY['inventory', 'reports'])
FROM pharmacy_parent, pharmacy_dept
ON CONFLICT (path) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.menus IS 'Seeded with official department list and menu structure';
