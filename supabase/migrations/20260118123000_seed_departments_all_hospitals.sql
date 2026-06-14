-- Migration: Seed Departments for All Existing Hospitals
-- Description: Ensures all hospitals have the official list of departments

DO $$
DECLARE
    h_record RECORD;
BEGIN
    FOR h_record IN SELECT id FROM public.hospitals
    LOOP
        INSERT INTO public.departments (id, hospital_id, department_code, department_name, description, status)
        VALUES
            (gen_random_uuid(), h_record.id, 'EMERGENCY_TRAUMA', 'Emergency & Trauma', 'Emergency and trauma care services', 'active'),
            (gen_random_uuid(), h_record.id, 'RADIOLOGY', 'Radiology & Radiography', 'Imaging and radiology services', 'active'),
            (gen_random_uuid(), h_record.id, 'CSSU_CSSD', 'CSSU/CSSD', 'Central Sterile Supply Unit', 'active'),
            (gen_random_uuid(), h_record.id, 'ASSET_MGMT', 'Asset Management', 'Hospital asset and equipment management', 'active'),
            (gen_random_uuid(), h_record.id, 'ADVANCED_REPORTS', 'Advanced Reports', 'Advanced reporting and analytics', 'active'),
            (gen_random_uuid(), h_record.id, 'MATERNITY_WARD', 'Maternity Ward', 'Maternity and obstetrics care', 'active'),
            (gen_random_uuid(), h_record.id, 'PHARMACY_LOGISTICS', 'Pharmacy Logistics', 'Central pharmacy logistics and inventory', 'active'),
            (gen_random_uuid(), h_record.id, 'PAEDIATRIC_WARD', 'Paediatric Ward', 'Paediatric patient care', 'active'),
            (gen_random_uuid(), h_record.id, 'HAEMODIALYSIS', 'Haemodialysis', 'Haemodialysis unit', 'active'),
            (gen_random_uuid(), h_record.id, 'PHARMACY_GALENICAL', 'Pharmacy Galenical & Prepacking', 'Extemporaneous preparation', 'active'),
            (gen_random_uuid(), h_record.id, 'PHARMACY_EMERGENCY', 'Pharmacy Emergency', 'Emergency pharmacy operations', 'active'),
            (gen_random_uuid(), h_record.id, 'PHARMACY_INPATIENT', 'Pharmacy In Patient', 'Inpatient medication management', 'active'),
            (gen_random_uuid(), h_record.id, 'LABORATORY', 'Pathologist', 'Laboratory tests and results', 'active'),
            (gen_random_uuid(), h_record.id, 'PHARMACY_SUBSTORE', 'Pharmacy Substore', 'Substore inventory management', 'active'),
            (gen_random_uuid(), h_record.id, 'HUMAN_RESOURCES', 'Human Resources', 'HR operations and employee data', 'active'),
            (gen_random_uuid(), h_record.id, 'OPERATION_THEATER', 'Operation Theater', 'Operation theater scheduling', 'active'),
            (gen_random_uuid(), h_record.id, 'FINANCIAL_BILLING', 'Financial & Billing', 'Financial and billing operations', 'active'),
            (gen_random_uuid(), h_record.id, 'KLINIK_PAKAR', 'Klinik Pakar', 'Specialist clinic management', 'active'),
            (gen_random_uuid(), h_record.id, 'GENERAL_WARD', 'General Ward', 'General ward patient management', 'active'),
            (gen_random_uuid(), h_record.id, 'HOSPITAL_OFFICE', 'Hospital Office', 'Hospital administration office', 'active'),
            (gen_random_uuid(), h_record.id, 'DRIVER_ROOM', 'Driver Room', 'Driver and transport management', 'active'),
            (gen_random_uuid(), h_record.id, 'FRONT_DESK', 'Front Desk', 'Reception and registration', 'active'),
            (gen_random_uuid(), h_record.id, 'PHARMACY_OUTPATIENT', 'Pharmacy Outpatient', 'Outpatient dispensing', 'active')
        ON CONFLICT (hospital_id, department_code) DO UPDATE SET
            status = 'active',
            updated_at = NOW();
    END LOOP;
END $$;
