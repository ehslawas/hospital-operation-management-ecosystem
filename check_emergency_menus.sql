-- Diagnostic: Check Triage and Patient Management menu details
SELECT 
    m.id, 
    m.label, 
    m.path, 
    m.allowed_department_id,
    d.department_code,
    d.department_name
FROM public.menus m
LEFT JOIN public.departments d ON m.allowed_department_id = d.id
WHERE m.label IN ('Triage', 'Patient Management') OR m.path LIKE '/emergency%';
