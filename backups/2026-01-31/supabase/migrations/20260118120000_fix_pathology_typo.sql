-- Migration: Fix Typo "Phatology" to "Pathology"
-- Description: Updates the department name and description, and updates the helper function.

DO $$
BEGIN
    -- Update the department name
    UPDATE public.departments
    SET department_name = 'Pathology',
        description = 'Pathology and laboratory services'
    WHERE department_code = 'PATHOLOGY'
    AND department_name = 'Phatology';

END $$;

-- Update the mapping function with the correct spelling
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

DO $$
BEGIN
  RAISE NOTICE 'Fixed typo Phatology to Pathology';
END $$;
