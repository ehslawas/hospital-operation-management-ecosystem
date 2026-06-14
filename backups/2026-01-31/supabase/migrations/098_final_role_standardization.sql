-- Migration: Final Role Standardization
-- Description: Strictly enforces the 19-role standard by deleting all non-standard roles.

-- 1. Final Reassignment of any users accidentally left in old roles
-- Just in case any users were missed or added in the interim
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE role_code = 'general_service_assistant')
WHERE role_id IN (
    SELECT id FROM roles WHERE role_code NOT IN (
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
    )
);

-- 2. Delete Permissions and Menu Access for non-standard roles
-- (Although these should have been handled by cascade, we do it explicitly for safety)
DELETE FROM role_permissions
WHERE role_id IN (
    SELECT id FROM roles WHERE role_code NOT IN (
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
    )
);

DELETE FROM role_menu_access
WHERE role_id IN (
    SELECT id FROM roles WHERE role_code NOT IN (
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
    )
);

-- 3. Delete all non-standard roles
-- This is the definitive list of 11 roles to be removed
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
