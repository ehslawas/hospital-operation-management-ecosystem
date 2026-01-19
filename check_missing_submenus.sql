-- Diagnostic: Check Hierarchy and Paths for target menus
SELECT 
    m.id, 
    m.label, 
    m.path, 
    m.parent_id,
    p.label as parent_label, 
    m.allowed_department_id,
    d.department_code,
    (SELECT COUNT(*) FROM public.role_menu_access rma WHERE rma.menu_id = m.id) as perm_count
FROM public.menus m
LEFT JOIN public.menus p ON m.parent_id = p.id
LEFT JOIN public.departments d ON m.allowed_department_id = d.id
WHERE p.label IN ('Inventory', 'Distribution', 'Medical Oxygen')
   OR m.label IN ('Inventory', 'Distribution', 'Medical Oxygen')
ORDER BY m.parent_id NULLS FIRST, m.label;
