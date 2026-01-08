-- Migration: Add foreign key constraint for departments.head_of_department_id
-- This allows Supabase to properly resolve the relationship between departments and users

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  -- Check if the foreign key constraint already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'departments_head_of_department_id_fkey'
  ) THEN
    -- Add the foreign key constraint
    ALTER TABLE departments
    ADD CONSTRAINT departments_head_of_department_id_fkey
    FOREIGN KEY (head_of_department_id) 
    REFERENCES users(id) 
    ON DELETE SET NULL;
    
    -- Create index for better query performance
    CREATE INDEX IF NOT EXISTS idx_departments_head_of_department_id 
    ON departments(head_of_department_id);
  END IF;
END $$;

-- Comment
COMMENT ON CONSTRAINT departments_head_of_department_id_fkey ON departments IS 
'Foreign key to users table for the head of department';

