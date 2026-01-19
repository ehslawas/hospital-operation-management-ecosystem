-- Quick Fix: Grant Emergency Menu Access without full reset
-- Run this directly to fix the missing sidebar menus

-- 1. Grant access to Dashboard (needed for navigation)
INSERT INTO public.role_menu_access (role_id, menu_id, can_view, can_create, can_edit, can_delete)
SELECT 
    r.id,
    m.id,
    true, false, false, false
FROM public.roles r
CROSS JOIN public.menus m
WHERE r.role_code IN ('assistant_medical_officer', 'emergency_medical_officer', 'staff_nurse', 'community_nurse', 'medical_assistant')
AND m.path = '/dashboard'
ON CONFLICT (role_id, menu_id) DO NOTHING;

-- 2. Grant access to Emergency menus
INSERT INTO public.role_menu_access (role_id, menu_id, can_view, can_create, can_edit, can_delete)
SELECT 
    r.id,
    m.id,
    true, true, true, false
FROM public.roles r
CROSS JOIN public.menus m
WHERE r.role_code IN ('assistant_medical_officer', 'emergency_medical_officer', 'staff_nurse', 'community_nurse', 'medical_assistant')
AND m.path IN ('/emergency/triage', '/emergency/patients')
ON CONFLICT (role_id, menu_id) 
DO UPDATE SET can_view = true, can_create = true, can_edit = true;

-- 3. Verify (you should see menu grants listed)
SELECT 
    r.role_name,
    r.role_code,
    m.label as menu_label,
    m.path as menu_path,
    rma.can_view
FROM public.role_menu_access rma
JOIN public.roles r ON r.id = rma.role_id
JOIN public.menus m ON m.id = rma.menu_id
WHERE r.role_code LIKE '%emergency%' OR r.role_code LIKE '%medical%' OR r.role_code = 'assistant_medical_officer'
ORDER BY r.role_code, m.order_index;
