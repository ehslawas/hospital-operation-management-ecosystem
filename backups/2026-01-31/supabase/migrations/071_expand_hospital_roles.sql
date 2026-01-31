-- Expand Hospital Roles
-- This migration adds the new professional hospital roles to the system roles list.

INSERT INTO roles (role_name, role_code, description, is_system_role, created_at, updated_at)
VALUES 
('Administration', 'administration', 'General administrative staff', true, NOW(), NOW()),
('Medical Officer', 'medical_officer', 'General medical practitioner', true, NOW(), NOW()),
('Chief Medical Officer', 'chief_medical_officer', 'Lead medical officer', true, NOW(), NOW()),
('Assistant Medical Officer', 'assistant_medical_officer', 'Supports medical officers', true, NOW(), NOW()),
('Nurse', 'nurse', 'Nursing staff', true, NOW(), NOW()),
('Matron', 'matron', 'Lead nursing administrator', true, NOW(), NOW()),
('Sister', 'sister', 'Senior nursing supervisor', true, NOW(), NOW()),
('Pharmacist', 'pharmacist', 'Professional pharmacist', true, NOW(), NOW()),
('Assistant Pharmacist', 'assistant_pharmacist', 'Supports pharmacy operations', true, NOW(), NOW()),
('Civil Service Assistant', 'civil_service_assistant', 'Support staff for civil service duties', true, NOW(), NOW()),
('Medical Laboratory Technologist', 'medical_lab_tech', 'Clinical lab technical staff', true, NOW(), NOW()),
('Chief Medical Laboratory Technologist', 'chief_medical_lab_tech', 'Lead lab technical staff', true, NOW(), NOW()),
('Pathologist', 'pathologist', 'Medical pathology specialist', true, NOW(), NOW()),
('Chemist', 'chemist', 'Professional chemist', true, NOW(), NOW()),
('Driver', 'driver', 'Hospital driver / logistics', true, NOW(), NOW()),
('Radiologist', 'radiologist', 'Medical radiology specialist', true, NOW(), NOW()),
('Radiology Technician', 'radiology_technician', 'Radiology technical staff', true, NOW(), NOW()),
('Staff', 'staff', 'General hospital staff', true, NOW(), NOW()),
('Health Care Assistant', 'health_care_assistant', 'Nursing / patient care support', true, NOW(), NOW())
ON CONFLICT (role_code) DO UPDATE SET 
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  is_system_role = EXCLUDED.is_system_role,
  updated_at = NOW();
