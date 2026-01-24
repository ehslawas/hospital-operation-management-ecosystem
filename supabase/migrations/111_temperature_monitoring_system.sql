-- ============================================================================
-- Migration 111: Temperature Monitoring System
-- Description: Adds temperature monitoring module, features, menu item, and data tables
-- ============================================================================

-- 1. Create Temperature Readings Table
CREATE TABLE IF NOT EXISTS public.pharmacy_temperature_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    location_type TEXT NOT NULL,
    location_name TEXT NOT NULL,
    min_temp DECIMAL(5,2) NOT NULL,
    max_temp DECIMAL(5,2) NOT NULL,
    current_temp DECIMAL(5,2) NOT NULL,
    is_compliant BOOLEAN GENERATED ALWAYS AS (current_temp >= min_temp AND current_temp <= max_temp) STORED,
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pharmacy_temperature_readings ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
DROP POLICY IF EXISTS "Users can view temperature readings for their hospital" ON public.pharmacy_temperature_readings;
CREATE POLICY "Users can view temperature readings for their hospital"
    ON public.pharmacy_temperature_readings
    FOR SELECT
    USING (hospital_id = (SELECT hospital_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert temperature readings for their hospital" ON public.pharmacy_temperature_readings;
CREATE POLICY "Users can insert temperature readings for their hospital"
    ON public.pharmacy_temperature_readings
    FOR INSERT
    WITH CHECK (hospital_id = (SELECT hospital_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete temperature readings for their hospital" ON public.pharmacy_temperature_readings;
CREATE POLICY "Users can delete temperature readings for their hospital"
    ON public.pharmacy_temperature_readings
    FOR DELETE
    USING (hospital_id = (SELECT hospital_id FROM public.users WHERE id = auth.uid()));

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_temp_readings_hospital ON public.pharmacy_temperature_readings(hospital_id);
CREATE INDEX IF NOT EXISTS idx_temp_readings_recorded_at ON public.pharmacy_temperature_readings(recorded_at);
CREATE INDEX IF NOT EXISTS idx_temp_readings_location ON public.pharmacy_temperature_readings(hospital_id, location_type);

-- 2. Add Module & Menu to RBAC
DO $$
DECLARE
    v_parent_module_id UUID;
    v_new_module_id UUID;
    v_pharmacy_dept_id UUID;
BEGIN
    -- Get Parent Module ID (Pharmacy Logistics/Management)
    SELECT id INTO v_parent_module_id 
    FROM public.modules 
    WHERE module_code = 'pharmacy_management';

    -- Fallback
    IF v_parent_module_id IS NULL THEN
         SELECT id INTO v_parent_module_id FROM public.modules WHERE module_code = 'pharmacy_logistics';
    END IF;

    -- Create Temperature Monitoring Module
    INSERT INTO public.modules (module_name, module_code, parent_module_id, route_path, icon_name, display_order, description, is_active)
    VALUES (
        'Temperature Monitoring',
        'pharmacy_management.temperature_monitoring',
        v_parent_module_id,
        '/pharmacy/temperature-monitoring',
        'Thermometer', 
        15,
        'Cold chain monitoring and temperature logging',
        true
    )
    ON CONFLICT (module_code) 
    DO UPDATE SET 
        route_path = '/pharmacy/temperature-monitoring',
        parent_module_id = v_parent_module_id,
        display_order = 15
    RETURNING id INTO v_new_module_id;

    -- 3. Add Features
    INSERT INTO public.features (module_id, feature_name, feature_code, description)
    SELECT v_new_module_id, f.name, f.code, f.feature_desc
    FROM (VALUES
        ('View Readings', 'view_temp_readings', 'View temperature logs'),
        ('Add Reading', 'add_temp_reading', 'Record new temperature'),
        ('Delete Reading', 'delete_temp_reading', 'Delete records'),
        ('Generate Report', 'generate_temp_report', 'Print/PDF reports')
    ) AS f(name, code, feature_desc)
    ON CONFLICT (module_id, feature_code) DO NOTHING;

    -- 4. Grant Default Permissions (Pharmacist & Assistant Pharmacist)
    INSERT INTO public.role_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete)
    SELECT r.id, v_new_module_id, true, true, true, true
    FROM public.roles r
    WHERE r.role_code IN ('pharmacist', 'assistant_pharmacist', 'system_admin', 'hospital_admin')
    ON CONFLICT (role_id, module_id) DO UPDATE SET can_view = true;
    
    -- Grant Feature Permissions
    INSERT INTO public.role_feature_permissions (role_id, feature_id, is_enabled)
    SELECT r.id, f.id, true
    FROM public.roles r
    CROSS JOIN public.features f
    WHERE r.role_code IN ('pharmacist', 'assistant_pharmacist', 'system_admin', 'hospital_admin')
    AND f.module_id = v_new_module_id
    ON CONFLICT (role_id, feature_id) DO UPDATE SET is_enabled = true;

    -- 5. Insert MENU Item (Crucial for Sidebar)
    SELECT id INTO v_pharmacy_dept_id FROM public.departments WHERE department_code = 'PHARMACY_LOGISTICS';
    
    -- 5. Insert MENU Item (Crucial for Sidebar)
    SELECT id INTO v_pharmacy_dept_id FROM public.departments WHERE department_code = 'PHARMACY_LOGISTICS';
    
    -- Using 'path' as the unique key
    IF NOT EXISTS (SELECT 1 FROM public.menus WHERE path = '/pharmacy/temperature-monitoring') THEN
        INSERT INTO public.menus (label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code)
        VALUES (
            'Temperature',
            '/pharmacy/temperature-monitoring',
            'Thermometer',
            NULL, -- Root level in sidebar
            90,   -- High order to appear at bottom
            false,
            v_pharmacy_dept_id,
            'temperature_monitoring'
        );
    ELSE
        UPDATE public.menus 
        SET 
            label = 'Temperature',
            icon = 'Thermometer',
            allowed_department_id = v_pharmacy_dept_id,
            module_code = 'temperature_monitoring'
        WHERE path = '/pharmacy/temperature-monitoring';
    END IF;

END $$;
