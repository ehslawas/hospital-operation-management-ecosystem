-- Inspection of specific problematic pharmacy modules
SELECT 
    m.label, 
    m.path, 
    m.parent_id, 
    p.label as parent_label,
    m.allowed_department_id,
    d.department_code
FROM public.menus m
LEFT JOIN public.menus p ON m.parent_id = p.id
LEFT JOIN public.departments d ON m.allowed_department_id = d.id
WHERE m.path ILIKE '%inventory%' 
   OR m.path ILIKE '%distribution%' 
   OR m.path ILIKE '%oxygen%'
   OR m.label ILIKE '%Inventory%'
   OR m.label ILIKE '%Distribution%'
   OR m.label ILIKE '%Oxygen%';
