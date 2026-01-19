-- Diagnostic: Check menus and role access for Admin
SELECT label, path, allowed_department_id FROM public.menus;

SELECT r.role_code, m.label, m.path, rma.can_view
FROM public.role_menu_access rma
JOIN public.roles r ON rma.role_id = r.id
JOIN public.menus m ON rma.menu_id = m.id
WHERE r.role_code IN ('hospital_admin', 'pharmacy_assistant');
