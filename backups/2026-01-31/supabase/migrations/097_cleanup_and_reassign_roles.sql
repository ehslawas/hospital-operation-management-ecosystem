-- Migration: Cleanup and Reassign Roles
-- Description: Adds Senior AMO role, reassigns specific users, and removes non-standard roles.

-- 1. Add Senior Assistant Medical Officer role
INSERT INTO roles (id, role_name, role_code, description, is_system_role)
VALUES (gen_random_uuid(), 'Senior Assistant Medical Officer', 'senior_assistant_medical_officer', 'Senior Penolong Pegawai Perubatan (PPP) with advanced clinical and supervisory duties.', TRUE)
ON CONFLICT (role_code) DO UPDATE SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 2. Reassign specific users
-- Shamsury Mohamad majidi (Chief Medical Officer) -> Senior Assistant Medical Officer
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE role_code = 'senior_assistant_medical_officer')
WHERE email = 'shammajidi@yahoo.com';

-- Saidin Bin Bakar (Civil Service Assistant) -> General Service Assistant
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE role_code = 'general_service_assistant')
WHERE email = '80saidinbakar@gmail.com';

-- Mohidin Bin Malik (Civil Service Assistant) -> General Service Assistant
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE role_code = 'general_service_assistant')
WHERE email = 'mohidin123malik@gmail.com';

-- Sharizah Binti Warno (Administration) -> Physiotherapist
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE role_code = 'physiotherapist')
WHERE email = 'sharizah.w@moh.gov.my';

-- Mohd Farhan bin Simatzaman (Civil Service Assistant) -> Hospital Administrator
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE role_code = 'hospital_administrator')
WHERE email = 'farhan.s@moh.gov.my';

-- BEDUIN BIN MOHD FAUZI (Administration) -> Hospital Administrator
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE role_code = 'hospital_administrator')
WHERE email = 'beduin@moh.gov.my';

-- Extra users found during verification to avoid FK violation
-- Radiology Technician -> Radiographer
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE role_code = 'radiographer')
WHERE role_id = (SELECT id FROM roles WHERE role_code = 'radiology_technician');

-- Pharmacy Assistant -> Assistant Pharmacist
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE role_code = 'assistant_pharmacist')
WHERE role_id = (SELECT id FROM roles WHERE role_code = 'pharmacy_assistant');

-- Medical Laboratory Technologist (old) -> Medical Lab Technician (new)
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE role_code = 'medical_lab_technician')
WHERE role_id = (SELECT id FROM roles WHERE role_code = 'medical_lab_tech');

-- 3. Delete all non-standard roles EXCEPT the ones we explicitly keep
DELETE FROM roles
WHERE role_code NOT IN (
    'medical_officer',
    'assistant_medical_officer',
    'senior_assistant_medical_officer',
    'pharmacist',
    'assistant_pharmacist',
    'matron',
    'sister',
    'nurse',
    'hospital_administrator',
    'hospital_driver',
    'general_service_assistant',
    'radiographer',
    'medical_lab_technician',
    'pathologist',
    'physiotherapist',
    'occupational_therapist',
    'hospital_director',
    'system_admin',
    'hospital_admin'
);

