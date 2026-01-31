-- Migration: Standardize Hospital Roles (KKM Standards)
-- Description: Updates the roles table with official KKM designations.

INSERT INTO roles (id, role_name, role_code, description, is_system_role)
VALUES
  (gen_random_uuid(), 'Medical Officer', 'medical_officer', 'Qualified medical practitioner providing clinical care and diagnosis.', TRUE),
  (gen_random_uuid(), 'Assistant Medical Officer', 'assistant_medical_officer', 'Penolong Pegawai Perubatan (PPP) providing clinical support and emergency care.', TRUE),
  (gen_random_uuid(), 'Pharmacist', 'pharmacist', 'Pegawai Farmasi responsible for medication management and clinical pharmacy.', TRUE),
  (gen_random_uuid(), 'Assistant Pharmacist', 'assistant_pharmacist', 'Penolong Pegawai Farmasi (PPF) assisting in pharmacy operations and dispensing.', TRUE),
  (gen_random_uuid(), 'Matron', 'matron', 'Senior nursing administrator overseeing nursing services and standards.', TRUE),
  (gen_random_uuid(), 'Sister', 'sister', 'Ketua Jururawat (Nursing Sister) in charge of ward management and clinical supervision.', TRUE),
  (gen_random_uuid(), 'Nurse', 'nurse', 'Jururawat providing direct patient care and clinical assistance.', TRUE),
  (gen_random_uuid(), 'Hospital Administrator', 'hospital_administrator', 'Pegawai Tadbir managing non-clinical hospital operations and resources.', TRUE),
  (gen_random_uuid(), 'Hospital Driver', 'hospital_driver', 'Pemandu responsible for transportation of patients and official hospital logistics.', TRUE),
  (gen_random_uuid(), 'General Service Assistant', 'general_service_assistant', 'Pembantu Perawatan Kesihatan (PPK) providing general support and patient handling.', TRUE),
  (gen_random_uuid(), 'Radiographer', 'radiographer', 'Juru X-Ray performing diagnostic imaging and radiology services.', TRUE),
  (gen_random_uuid(), 'Medical Lab Technician', 'medical_lab_technician', 'Juruteknologi Makmal Perubatan (JTMP) conducting laboratory tests and analysis.', TRUE),
  (gen_random_uuid(), 'Pathologist', 'pathologist', 'Pakar Patologi specializing in laboratory medicine and disease diagnosis.', TRUE),
  (gen_random_uuid(), 'Physiotherapist', 'physiotherapist', 'Fisioterapis providing physical rehabilitation and therapy services.', TRUE),
  (gen_random_uuid(), 'Occupational Therapist', 'occupational_therapist', 'Jurupulih Perubatan Kerja providing functional rehabilitation and therapy.', TRUE),
  (gen_random_uuid(), 'Hospital Director', 'hospital_director', 'Pengarah Hospital responsible for overall clinical and administrative governance.', TRUE)
ON CONFLICT (role_code) DO UPDATE
SET
  role_name = EXCLUDED.role_name,
  description = EXCLUDED.description,
  is_system_role = EXCLUDED.is_system_role,
  updated_at = NOW();

