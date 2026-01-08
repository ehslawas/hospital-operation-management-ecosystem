-- Migration: Sync existing enabled modules to departments
-- This ensures all enabled hospital modules have corresponding departments

-- Function to sync a single module to department
CREATE OR REPLACE FUNCTION sync_module_to_department(
  p_hospital_id UUID,
  p_module_code TEXT,
  p_module_name TEXT,
  p_module_description TEXT,
  p_is_enabled BOOLEAN
) RETURNS VOID AS $$
BEGIN
  IF p_is_enabled THEN
    -- Insert or update department
    INSERT INTO departments (
      hospital_id,
      department_code,
      department_name,
      description,
      status,
      created_at,
      updated_at
    ) VALUES (
      p_hospital_id,
      p_module_code,
      p_module_name,
      p_module_description,
      'active',
      NOW(),
      NOW()
    )
    ON CONFLICT (hospital_id, department_code) 
    DO UPDATE SET
      department_name = EXCLUDED.department_name,
      description = EXCLUDED.description,
      status = 'active',
      updated_at = NOW();
  ELSE
    -- Deactivate department if module is disabled
    UPDATE departments
    SET 
      status = 'inactive',
      updated_at = NOW()
    WHERE 
      hospital_id = p_hospital_id 
      AND department_code = p_module_code;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get module name and description
CREATE OR REPLACE FUNCTION get_module_info(p_module_code TEXT)
RETURNS TABLE(module_name TEXT, module_description TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE p_module_code
      WHEN 'pharmacy_logistics' THEN 'Pharmacy Logistics'::TEXT
      WHEN 'pharmacy_substore' THEN 'Pharmacy Substore'::TEXT
      WHEN 'pharmacy_outpatient' THEN 'Pharmacy Outpatient'::TEXT
      WHEN 'pharmacy_emergency' THEN 'Pharmacy Emergency'::TEXT
      WHEN 'pharmacy_inpatient' THEN 'Pharmacy In Patient'::TEXT
      WHEN 'pharmacy_galenical' THEN 'Pharmacy Galenical & Prepacking'::TEXT
      WHEN 'general_ward' THEN 'General Ward'::TEXT
      WHEN 'paediatric_ward' THEN 'Paediatric Ward'::TEXT
      WHEN 'maternity_ward' THEN 'Maternity Ward'::TEXT
      WHEN 'emergency_trauma' THEN 'Emergency & Trauma'::TEXT
      WHEN 'laboratory' THEN 'Laboratory'::TEXT
      WHEN 'operation_theater' THEN 'Operation Theater'::TEXT
      WHEN 'cssu_cssd' THEN 'CSSU/CSSD'::TEXT
      WHEN 'radiology' THEN 'Radiology & Radiography'::TEXT
      WHEN 'klinik_pakar' THEN 'Klinik Pakar'::TEXT
      WHEN 'haemodialysis' THEN 'Haemodialysis'::TEXT
      WHEN 'driver_room' THEN 'Driver Room'::TEXT
      WHEN 'hospital_office' THEN 'Hospital Office'::TEXT
      WHEN 'front_desk' THEN 'Front Desk'::TEXT
      WHEN 'billing' THEN 'Financial & Billing'::TEXT
      WHEN 'hr' THEN 'Human Resources'::TEXT
      WHEN 'asset' THEN 'Asset Management'::TEXT
      WHEN 'reports' THEN 'Advanced Reports'::TEXT
      ELSE p_module_code::TEXT
    END AS module_name,
    CASE p_module_code
      WHEN 'pharmacy_logistics' THEN 'Central pharmacy logistics, inventory, procurement, and distribution'::TEXT
      WHEN 'pharmacy_substore' THEN 'Substore inventory and stock management'::TEXT
      WHEN 'pharmacy_outpatient' THEN 'Outpatient dispensing and prescription management'::TEXT
      WHEN 'pharmacy_emergency' THEN 'Emergency pharmacy operations'::TEXT
      WHEN 'pharmacy_inpatient' THEN 'Inpatient medication management'::TEXT
      WHEN 'pharmacy_galenical' THEN 'Extemporaneous preparation and prepacking'::TEXT
      WHEN 'general_ward' THEN 'General ward patient management'::TEXT
      WHEN 'paediatric_ward' THEN 'Paediatric patient care and management'::TEXT
      WHEN 'maternity_ward' THEN 'Maternity and obstetrics care'::TEXT
      WHEN 'emergency_trauma' THEN 'Emergency and trauma department management'::TEXT
      WHEN 'laboratory' THEN 'Laboratory tests and results management'::TEXT
      WHEN 'operation_theater' THEN 'Operation theater scheduling and management'::TEXT
      WHEN 'cssu_cssd' THEN 'Central Sterile Supply Unit management'::TEXT
      WHEN 'radiology' THEN 'Imaging and radiology services'::TEXT
      WHEN 'klinik_pakar' THEN 'Specialist clinic management'::TEXT
      WHEN 'haemodialysis' THEN 'Haemodialysis unit management'::TEXT
      WHEN 'driver_room' THEN 'Driver and transport management'::TEXT
      WHEN 'hospital_office' THEN 'Hospital administration office'::TEXT
      WHEN 'front_desk' THEN 'Reception and registration'::TEXT
      WHEN 'billing' THEN 'Manage billing and financial operations'::TEXT
      WHEN 'hr' THEN 'Manage HR operations and employee data'::TEXT
      WHEN 'asset' THEN 'Manage hospital assets and equipment'::TEXT
      WHEN 'reports' THEN 'Access advanced reporting and analytics'::TEXT
      ELSE ''::TEXT
    END AS module_description;
END;
$$ LANGUAGE plpgsql;

-- Sync all existing enabled modules to departments
DO $$
DECLARE
  module_record RECORD;
  module_info RECORD;
BEGIN
  -- Loop through all enabled hospital modules
  FOR module_record IN 
    SELECT 
      hospital_id,
      module_code,
      is_enabled
    FROM hospital_modules
    WHERE is_enabled = true
  LOOP
    -- Get module info
    SELECT * INTO module_info FROM get_module_info(module_record.module_code);
    
    IF module_info.module_name IS NOT NULL THEN
      -- Sync to department
      PERFORM sync_module_to_department(
        module_record.hospital_id,
        module_record.module_code,
        module_info.module_name,
        module_info.module_description,
        module_record.is_enabled
      );
    END IF;
  END LOOP;
END;
$$;

-- Create trigger to automatically sync departments when modules are enabled/disabled
CREATE OR REPLACE FUNCTION trigger_sync_module_to_department()
RETURNS TRIGGER AS $$
DECLARE
  module_info RECORD;
BEGIN
  -- Get module info
  SELECT * INTO module_info FROM get_module_info(NEW.module_code);
  
  IF module_info.module_name IS NOT NULL THEN
    -- Sync to department
    PERFORM sync_module_to_department(
      NEW.hospital_id,
      NEW.module_code,
      module_info.module_name,
      module_info.module_description,
      NEW.is_enabled
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS sync_module_to_department_trigger ON hospital_modules;
CREATE TRIGGER sync_module_to_department_trigger
  AFTER INSERT OR UPDATE OF is_enabled ON hospital_modules
  FOR EACH ROW
  WHEN (NEW.is_enabled IS NOT NULL)
  EXECUTE FUNCTION trigger_sync_module_to_department();

-- Comment
COMMENT ON FUNCTION sync_module_to_department IS 'Syncs a hospital module to its corresponding department';
COMMENT ON FUNCTION trigger_sync_module_to_department IS 'Trigger function to automatically sync modules to departments when enabled/disabled';

