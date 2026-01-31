-- Migration: Fix Department List to Official Hospital Structure (Robust Version 3)
-- Description: Clean up duplicates, map users and requests to official departments, and set up the 16-department structure

DO $$
DECLARE
    v_hospital_id UUID;
    v_admin_dept_id UUID;
    v_target_dept_id UUID;
    v_dept_record RECORD;
BEGIN
    -- 1. Get the primary hospital ID
    SELECT id INTO v_hospital_id FROM public.hospitals ORDER BY created_at LIMIT 1;
    
    IF v_hospital_id IS NULL THEN
        RAISE EXCEPTION 'No hospital found in the system. Please ensure a hospital exists before running this migration.';
    END IF;

    -- 2. Create/Update the 16 official departments first to ensure we have target IDs
    -- Hospital Administration
    INSERT INTO public.departments (hospital_id, department_code, department_name, description, status)
    VALUES (v_hospital_id, 'HOSPITAL_ADMIN', 'Hospital Administration', 'Hospital administration office', 'active')
    ON CONFLICT (hospital_id, department_code) DO UPDATE 
    SET department_name = 'Hospital Administration', status = 'active'
    RETURNING id INTO v_admin_dept_id;

    -- Create/Update others
    FOR v_dept_record IN 
        SELECT * FROM (VALUES 
            ('PHARMACY_LOGISTICS', 'Pharmacy Logistic', 'Central pharmacy logistics and inventory management'),
            ('PHARMACY_SATELLITE', 'Pharmacy Satelite', 'Satellite pharmacy operations'),
            ('PHARMACY_SUBSTORE', 'Pharmacy Substore', 'Pharmacy substore inventory management'),
            ('EMERGENCY_TRAUMA', 'Emergency & Trauma', 'Emergency and trauma care services'),
            ('PATHOLOGY', 'Pathology', 'Pathology and laboratory services'),
            ('RADIOLOGY', 'Radiology & Radiography', 'Radiology and imaging services'),
            ('GENERAL_WARD', 'General Ward', 'General patient ward management'),
            ('MATERNITY_WARD', 'Maternity Ward', 'Maternity and obstetrics ward'),
            ('PAEDIATRIC_WARD', 'Paediatric Ward', 'Paediatric patient care ward'),
            ('CSSU_CSSD', 'CSSU / CSSD', 'Central Sterile Supply Unit/Department'),
            ('REHABILITATION', 'Rehabilitation', 'Rehabilitation services'),
            ('DRIVER_ROOM', 'Driver Room', 'Driver and transport services'),
            ('FRONT_DESK', 'Frontdesk', 'Front desk and reception services'),
            ('KLINIK_PAKAR', 'Klinik Pakar', 'Specialist clinic services'),
            ('HAEMODIALYSIS', 'Haemodialysis', 'Haemodialysis treatment unit')
        ) AS t(code, name, descr)
    LOOP
        INSERT INTO public.departments (hospital_id, department_code, department_name, description, status)
        VALUES (v_hospital_id, v_dept_record.code, v_dept_record.name, v_dept_record.descr, 'active')
        ON CONFLICT (hospital_id, department_code) DO UPDATE 
        SET department_name = v_dept_record.name, description = v_dept_record.descr, status = 'active';
    END LOOP;

    -- 3. Map legacy/duplicate departments to the new official IDs
    FOR v_dept_record IN 
        SELECT id, department_code, department_name FROM public.departments
    LOOP
        -- Find the target official department ID
        SELECT id INTO v_target_dept_id FROM public.departments 
        WHERE hospital_id = v_hospital_id 
        AND department_code = CASE
            WHEN UPPER(v_dept_record.department_code) IN ('RADIOLOGY', 'radiology') THEN 'RADIOLOGY'
            WHEN UPPER(v_dept_record.department_code) IN ('FRONT_DESK', 'front_desk', 'FRONTDESK') THEN 'FRONT_DESK'
            WHEN UPPER(v_dept_record.department_code) IN ('PHARMACY_LOGISTICS', 'pharmacy_logistics') THEN 'PHARMACY_LOGISTICS'
            WHEN UPPER(v_dept_record.department_code) IN ('EMERGENCY_TRAUMA', 'emergency_trauma') THEN 'EMERGENCY_TRAUMA'
            WHEN UPPER(v_dept_record.department_code) IN ('GENERAL_WARD', 'general_ward') THEN 'GENERAL_WARD'
            WHEN UPPER(v_dept_record.department_code) IN ('MATERNITY_WARD', 'maternity_ward') THEN 'MATERNITY_WARD'
            WHEN UPPER(v_dept_record.department_code) IN ('PAEDIATRIC_WARD', 'paediatric_ward') THEN 'PAEDIATRIC_WARD'
            WHEN UPPER(v_dept_record.department_code) IN ('CSSU_CSSD', 'cssu_cssd') THEN 'CSSU_CSSD'
            WHEN UPPER(v_dept_record.department_code) IN ('KLINIK_PAKAR', 'klinik_pakar') THEN 'KLINIK_PAKAR'
            WHEN UPPER(v_dept_record.department_code) IN ('HAEMODIALYSIS', 'haemodialysis') THEN 'HAEMODIALYSIS'
            WHEN UPPER(v_dept_record.department_code) IN ('DRIVER_ROOM', 'driver_room') THEN 'DRIVER_ROOM'
            WHEN UPPER(v_dept_record.department_code) IN ('HOSPITAL_ADMIN', 'hospital_admin', 'HOSPITAL_OFFICE', 'hospital_office') THEN 'HOSPITAL_ADMIN'
            WHEN UPPER(v_dept_record.department_code) IN ('PATHOLOGY', 'pathology', 'LABORATORY', 'laboratory') THEN 'PATHOLOGY'
            WHEN UPPER(v_dept_record.department_code) IN ('PHARMACY_SUBSTORE', 'pharmacy_substore') THEN 'PHARMACY_SUBSTORE'
            WHEN UPPER(v_dept_record.department_code) IN ('REHABILITATION', 'rehabilitation') THEN 'REHABILITATION'
            WHEN UPPER(v_dept_record.department_code) IN ('PHARMACY_SATELLITE', 'pharmacy_satellite') THEN 'PHARMACY_SATELLITE'
            WHEN UPPER(v_dept_record.department_code) LIKE 'PHARMACY_%' THEN 'PHARMACY_LOGISTICS'
            ELSE 'HOSPITAL_ADMIN'
        END;

        -- If the current department is NOT the target department, move references then delete
        IF v_dept_record.id <> v_target_dept_id THEN
            -- Update Users
            UPDATE public.users SET department_id = v_target_dept_id WHERE department_id = v_dept_record.id;
            
            -- Update Oxygen Requests (The reported error)
            UPDATE public.pharmacy_oxygen_dept_requests SET department_id = v_target_dept_id WHERE department_id = v_dept_record.id;
            
            -- Update other potential tables if they exist
            -- Inventory/Warrants
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacy_warrant_allocations') THEN
                UPDATE public.pharmacy_warrant_allocations SET department_id = v_target_dept_id WHERE department_id = v_dept_record.id;
            END IF;

            -- Now safe to delete
            DELETE FROM public.departments WHERE id = v_dept_record.id;
        END IF;
    END LOOP;

    -- 4. Final Cleanup
    DELETE FROM public.departments 
    WHERE department_code NOT IN (
        'PHARMACY_LOGISTICS', 'PHARMACY_SATELLITE', 'PHARMACY_SUBSTORE',
        'EMERGENCY_TRAUMA', 'PATHOLOGY', 'RADIOLOGY',
        'GENERAL_WARD', 'MATERNITY_WARD', 'PAEDIATRIC_WARD',
        'CSSU_CSSD', 'REHABILITATION', 'DRIVER_ROOM',
        'HOSPITAL_ADMIN', 'FRONT_DESK', 'KLINIK_PAKAR', 'HAEMODIALYSIS'
    );

END $$;

-- Update the mapping function
CREATE OR REPLACE FUNCTION get_module_info(p_module_code TEXT)
RETURNS TABLE(module_name TEXT, module_description TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE UPPER(p_module_code)
      WHEN 'PHARMACY_LOGISTICS' THEN 'Pharmacy Logistic'::TEXT
      WHEN 'PHARMACY_SATELLITE' THEN 'Pharmacy Satelite'::TEXT
      WHEN 'PHARMACY_SUBSTORE' THEN 'Pharmacy Substore'::TEXT
      WHEN 'EMERGENCY_TRAUMA' THEN 'Emergency & Trauma'::TEXT
      WHEN 'PATHOLOGY' THEN 'Pathology'::TEXT
      WHEN 'RADIOLOGY' THEN 'Radiology & Radiography'::TEXT
      WHEN 'GENERAL_WARD' THEN 'General Ward'::TEXT
      WHEN 'MATERNITY_WARD' THEN 'Maternity Ward'::TEXT
      WHEN 'PAEDIATRIC_WARD' THEN 'Paediatric Ward'::TEXT
      WHEN 'CSSU_CSSD' THEN 'CSSU / CSSD'::TEXT
      WHEN 'REHABILITATION' THEN 'Rehabilitation'::TEXT
      WHEN 'DRIVER_ROOM' THEN 'Driver Room'::TEXT
      WHEN 'HOSPITAL_ADMIN' THEN 'Hospital Administration'::TEXT
      WHEN 'FRONT_DESK' THEN 'Frontdesk'::TEXT
      WHEN 'KLINIK_PAKAR' THEN 'Klinik Pakar'::TEXT
      WHEN 'HAEMODIALYSIS' THEN 'Haemodialysis'::TEXT
      WHEN 'LABORATORY' THEN 'Pathology'::TEXT
      WHEN 'HOSPITAL_OFFICE' THEN 'Hospital Administration'::TEXT
      WHEN 'PHARMACY_INPATIENT' THEN 'Pharmacy Logistic'::TEXT
      WHEN 'PHARMACY_OUTPATIENT' THEN 'Pharmacy Logistic'::TEXT
      WHEN 'PHARMACY_EMERGENCY' THEN 'Pharmacy Logistic'::TEXT
      WHEN 'PHARMACY_GALENICAL' THEN 'Pharmacy Logistic'::TEXT
      ELSE NULL
    END AS module_name,
    CASE UPPER(p_module_code)
      WHEN 'PHARMACY_LOGISTICS' THEN 'Central pharmacy logistics and inventory management'::TEXT
      WHEN 'PHARMACY_SATELLITE' THEN 'Satellite pharmacy operations'::TEXT
      WHEN 'PHARMACY_SUBSTORE' THEN 'Pharmacy substore inventory management'::TEXT
      WHEN 'EMERGENCY_TRAUMA' THEN 'Emergency and trauma care services'::TEXT
      WHEN 'PATHOLOGY' THEN 'Pathology and laboratory services'::TEXT
      WHEN 'RADIOLOGY' THEN 'Radiology and imaging services'::TEXT
      WHEN 'GENERAL_WARD' THEN 'General patient ward management'::TEXT
      WHEN 'MATERNITY_WARD' THEN 'Maternity and obstetrics ward'::TEXT
      WHEN 'PAEDIATRIC_WARD' THEN 'Paediatric patient care ward'::TEXT
      WHEN 'CSSU_CSSD' THEN 'Central Sterile Supply Unit/Department'::TEXT
      WHEN 'REHABILITATION' THEN 'Rehabilitation services'::TEXT
      WHEN 'DRIVER_ROOM' THEN 'Driver and transport services'::TEXT
      WHEN 'HOSPITAL_ADMIN' THEN 'Hospital administration office'::TEXT
      WHEN 'FRONT_DESK' THEN 'Front desk and reception services'::TEXT
      WHEN 'KLINIK_PAKAR' THEN 'Specialist clinic services'::TEXT
      WHEN 'HAEMODIALYSIS' THEN 'Haemodialysis treatment unit'::TEXT
      ELSE ''::TEXT
    END AS module_description;
END;
$$ LANGUAGE plpgsql;

-- Final Log
DO $$
BEGIN
  RAISE NOTICE 'Department list has been cleanly updated to the official 16-department structure.';
  RAISE NOTICE 'Oxygen requests and User records have been migrated to official departments.';
END $$;
