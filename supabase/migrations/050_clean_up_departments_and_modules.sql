-- Migration: Clean up software modules, rename Haemodialysis -> Nephrology, and remove duplicate department entries
-- Description: Removes software module entries (MyCuti, MyFormulari, MyKunci, MyPerhimpunan, MyPorter, etc.),
-- renames "Haemodialysis" to "Nephrology", and deduplicates hospital department records.

-- 1. Rename "Haemodialysis" department to "Nephrology"
UPDATE departments
SET department_name = 'Nephrology',
    department_code = 'NEPH',
    description = 'Nephrology Department & Haemodialysis Unit'
WHERE LOWER(department_name) = 'haemodialysis' OR LOWER(department_code) = 'haemodialysis';

-- 2. Delete software module records from departments table
DELETE FROM departments
WHERE LOWER(department_code) IN (
  'mycuti', 'myformulari', 'mykunci', 'myperhimpunan', 'myporter', 
  'mytransporter', 'mywarrant', 'mysuhu', 'mymsds', 'myphis', 
  'mycrossborder', 'mypriviledging', 'mytempahan', 'pharmacy_logistics',
  'pharmacy_substore', 'pharmacy_outpatient', 'pharmacy_emergency',
  'pharmacy_inpatient', 'pharmacy_galenical', 'driver_room', 'billing',
  'hr', 'asset', 'reports'
)
OR LOWER(department_name) LIKE 'my%'
OR LOWER(department_code) LIKE 'my%';

-- 3. Deduplicate department records keeping only 1 per (hospital_id, department_name)
WITH CTE AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY hospital_id, LOWER(TRIM(department_name))
           ORDER BY created_at ASC, id ASC
         ) as row_num
  FROM departments
)
DELETE FROM departments
WHERE id IN (
  SELECT id FROM CTE WHERE row_num > 1
);

-- 4. Update trigger function to prevent auto-syncing software ecosystem modules to departments table
CREATE OR REPLACE FUNCTION trigger_sync_module_to_department()
RETURNS TRIGGER AS $$
DECLARE
  module_info RECORD;
BEGIN
  -- Exclude software ecosystem modules from being added into departments table
  IF LOWER(NEW.module_code) LIKE 'my%' OR NEW.module_code IN ('billing', 'hr', 'asset', 'reports', 'driver_room') THEN
    RETURN NEW;
  END IF;

  -- Get module info
  SELECT * INTO module_info FROM get_module_info(NEW.module_code);
  
  IF module_info.module_name IS NOT NULL THEN
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
