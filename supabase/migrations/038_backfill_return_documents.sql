-- 038_backfill_return_documents.sql
-- Migration to backfill return documents and items from historical cylinder movements of type 'sent_to_supplier'

DO $$
DECLARE
  supplier_record_id UUID;
  hospital_record_id UUID := '85bb6adc-b868-428b-83f4-e5af2f5cf904';
  default_user_id UUID := '88dc2fa7-e943-45ba-a889-8756c0265b48'; -- User who recorded the movements
  doc_id UUID;
  item_row record;
  current_doc_num TEXT;
  prev_batch_id INT := -1;
BEGIN
  -- Get Supplier ID for LINDE
  SELECT id INTO supplier_record_id 
  FROM suppliers 
  WHERE company_name = 'LINDE EOX SDN BHD (CAW. MIRI)' 
  LIMIT 1;

  IF supplier_record_id IS NULL THEN
    RAISE NOTICE 'Supplier LINDE EOX SDN BHD not found, cannot backfill return documents.';
    RETURN;
  END IF;

  -- Temporary table to calculate batches of movements within 5 minutes of each other
  CREATE TEMP TABLE temp_movement_batches AS
  WITH ordered_movements AS (
    SELECT 
      id as movement_id,
      hospital_id,
      cylinder_id,
      moved_by,
      moved_at,
      remarks,
      LAG(moved_at) OVER (ORDER BY moved_at) as prev_moved_at
    FROM pharmacy_oxygen_cylinder_movements
    WHERE movement_type = 'sent_to_supplier'
  ),
  marked_batches AS (
    SELECT 
      *,
      CASE 
        WHEN prev_moved_at IS NULL OR moved_at - prev_moved_at > INTERVAL '5 minutes' THEN 1
        ELSE 0
      END as is_new_batch
    FROM ordered_movements
  ),
  numbered_batches AS (
    SELECT 
      *,
      SUM(is_new_batch) OVER (ORDER BY moved_at) as batch_id
    FROM marked_batches
  )
  SELECT * FROM numbered_batches;

  -- Loop through each cylinder movement in our batches and construct return documents + items
  FOR item_row IN (
    SELECT * FROM temp_movement_batches ORDER BY batch_id, moved_at
  ) LOOP
    -- When a new batch is encountered, create the parent document
    IF item_row.batch_id <> prev_batch_id THEN
      prev_batch_id := item_row.batch_id;
      doc_id := gen_random_uuid();
      
      -- Format: O2-RET-YYYYMMDD-batch_id
      current_doc_num := 'O2-RET-' || to_char(item_row.moved_at, 'YYYYMMDD') || '-' || LPAD(item_row.batch_id::text, 4, '0');
      
      INSERT INTO pharmacy_oxygen_return_documents (
        id,
        hospital_id,
        document_number,
        supplier_id,
        status,
        returned_date,
        remarks,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        doc_id,
        item_row.hospital_id,
        current_doc_num,
        supplier_record_id,
        'completed',
        item_row.moved_at,
        item_row.remarks,
        COALESCE(item_row.moved_by, default_user_id),
        item_row.moved_at,
        item_row.moved_at
      );
    END IF;

    -- Insert the document item
    INSERT INTO pharmacy_oxygen_return_document_items (
      return_document_id,
      cylinder_id,
      created_at
    ) VALUES (
      doc_id,
      item_row.cylinder_id,
      item_row.moved_at
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  DROP TABLE IF EXISTS temp_movement_batches;
END $$;
