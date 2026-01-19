-- Check if modules table is empty or blocked by RLS
SELECT count(*) FROM modules;

-- Check policies on modules
SELECT * FROM pg_policies WHERE tablename = 'modules';

-- Try to select a few modules as anon (simulating public access if RLS disabled)
SELECT id, module_name, is_active FROM modules LIMIT 5;
