-- Grant Emergency Department Menu Access
-- This migration grants all emergency roles access to emergency menus

-- Grant access to Triage menu
INSERT INTO public.role_menu_access (role_id, menu_id, can_view, can_create, can_edit, can_delete)
SELECT 
    r.id as role_id,
    m.id as menu_id,
    true as can_view,
    true as can_create,
    true as can_edit,
    false as can_delete
FROM public.roles r
CROSS JOIN public.menus m
WHERE r.role_code IN (
    'emergency_medical_officer',
    'assistant_medical_officer',
    'staff_nurse',
    'community_nurse',
    'medical_assistant'
)
AND m.path IN ('/emergency/triage', '/emergency/patients')
ON CONFLICT (role_id, menu_id) DO UPDATE
SET 
    can_view = EXCLUDED.can_view,
    can_create = EXCLUDED.can_create,
    can_edit = EXCLUDED.can_edit;

-- Grant access to Dashboard menu for emergency staff
INSERT INTO public.role_menu_access (role_id, menu_id, can_view, can_create, can_edit, can_delete)
SELECT 
    r.id as role_id,
    m.id as menu_id,
    true as can_view,
    false as can_create,
    false as can_edit,
    false as can_delete
FROM public.roles r
CROSS JOIN public.menus m
WHERE r.role_code IN (
    'emergency_medical_officer',
    'assistant_medical_officer',
    'staff_nurse',
    'community_nurse',
    'medical_assistant'
)
AND m.path = '/dashboard'
ON CONFLICT (role_id, menu_id) DO NOTHING;

-- Verify the grants
DO $$
DECLARE
    grant_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO grant_count
    FROM public.role_menu_access rma
    JOIN public.roles r ON r.id = rma.role_id
    JOIN public.menus m ON m.id = rma.menu_id
    WHERE r.role_code IN ('emergency_medical_officer', 'assistant_medical_officer', 'staff_nurse')
    AND m.path LIKE '/emergency%';
    
    RAISE NOTICE 'Emergency menu access grants created: %', grant_count;
END $$;
