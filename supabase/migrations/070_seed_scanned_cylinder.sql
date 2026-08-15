-- 070_seed_scanned_cylinder.sql
-- Migration to seed cylinder O2-P101-E-0020 into database inventory

DO $$
DECLARE
  v_hospital_id UUID;
  v_size_id UUID;
  v_type_id UUID;
  v_supplier_id UUID;
BEGIN
  -- 1. Get a valid hospital_id (default to the known one, or first available)
  SELECT id INTO v_hospital_id FROM hospitals LIMIT 1;
  IF v_hospital_id IS NULL THEN
    v_hospital_id := '85bb6adc-b868-428b-83f4-e5af2f5cf904';
  END IF;

  -- 2. Get cylinder size for 'E' or standard size
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacy_oxygen_cylinder_sizes') THEN
    SELECT id INTO v_size_id FROM pharmacy_oxygen_cylinder_sizes WHERE code = 'E' LIMIT 1;
    IF v_size_id IS NULL THEN
      SELECT id INTO v_size_id FROM pharmacy_oxygen_cylinder_sizes LIMIT 1;
    END IF;
  END IF;

  -- 3. Get cylinder type
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacy_oxygen_cylinder_types') THEN
    SELECT id INTO v_type_id FROM pharmacy_oxygen_cylinder_types WHERE code = 'E' LIMIT 1;
    IF v_type_id IS NULL THEN
      SELECT id INTO v_type_id FROM pharmacy_oxygen_cylinder_types LIMIT 1;
    END IF;
  END IF;

  -- 4. Get a supplier
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
    SELECT id INTO v_supplier_id FROM suppliers LIMIT 1;
  END IF;

  -- 5. Insert the cylinder if the table exists and it is not already present
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pharmacy_oxygen_cylinder_inventory') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pharmacy_oxygen_cylinder_inventory 
      WHERE serial_number = 'O2-P101-E-0020' OR qr_code = 'O2-P101-E-0020'
    ) THEN
      INSERT INTO pharmacy_oxygen_cylinder_inventory (
        hospital_id,
        serial_number,
        qr_code,
        qr_code_value,
        cylinder_size_id,
        cylinder_type_id,
        status,
        supplier_id,
        current_location
      ) VALUES (
        v_hospital_id,
        'O2-P101-E-0020',
        'O2-P101-E-0020',
        'O2-P101-E-0020',
        v_size_id,
        v_type_id,
        'issued',
        v_supplier_id,
        'Central Store'
      );
    END IF;
  END IF;
END $$;
