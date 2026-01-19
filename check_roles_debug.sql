-- check roles and permissions
SELECT id, role_code, role_name FROM public.roles WHERE role_code ILIKE '%pharmacy%' OR role_code ILIKE '%pharmacist%';

-- Check permission for a specific pharmacy role (grab id from above or use subquery)
SELECT r.role_code, COUNT(rma.menu_id) as menu_count
FROM public.roles r
LEFT JOIN public.role_menu_access rma ON r.id = rma.role_id
WHERE r.role_code IN ('pharmacist', 'pharmacy_assistant', 'pharmacy_storekeeper')
GROUP BY r.role_code;
