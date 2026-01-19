-- Diagnostic: Check for existence of Gold Standard menus
SELECT id, label, path, parent_id, allowed_department_id 
FROM public.menus 
WHERE label IN (
    'Drug (Buffer Levels)', 
    'Non-Drug (Buffer Levels)', 
    'Item Movement', 
    'Slow Moving Items', 
    'Near Expiry Items', 
    'Bad / Defective Stock',
    'Transfer Requests',
    'Inter-Facility',
    'Intra-Facility',
    'Cylinder Inventory',
    'Cylinder Request',
    'QR Generator'
);
