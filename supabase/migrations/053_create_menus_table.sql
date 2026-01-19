-- Migration: Create Menus Table for Dynamic Navigation
-- Description: Stores menu items that can be assigned to departments and controlled by roles

-- Create menus table
CREATE TABLE IF NOT EXISTS public.menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    path TEXT NOT NULL,
    icon TEXT,
    parent_id UUID REFERENCES public.menus(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_core BOOLEAN NOT NULL DEFAULT false,
    allowed_department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    module_code TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_menus_parent_id ON public.menus(parent_id);
CREATE INDEX IF NOT EXISTS idx_menus_department_id ON public.menus(allowed_department_id);
CREATE INDEX IF NOT EXISTS idx_menus_module_code ON public.menus(module_code);
CREATE INDEX IF NOT EXISTS idx_menus_order ON public.menus(order_index);

-- Add unique constraint to prevent duplicate paths
CREATE UNIQUE INDEX IF NOT EXISTS idx_menus_unique_path ON public.menus(path);

-- Enable RLS
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- RLS Policies for menus
-- System Admin can manage all menus
CREATE POLICY "system_admin_all_menus"
    ON public.menus
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role_id IN (
                SELECT id FROM public.roles WHERE role_code = 'system_admin'
            )
        )
    );

-- Hospital Admin can view menus
CREATE POLICY "hospital_admin_view_menus"
    ON public.menus
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role_id IN (
                SELECT id FROM public.roles WHERE role_code = 'hospital_admin'
            )
        )
    );

-- All authenticated users can view menus (filtered by role_menu_access)
CREATE POLICY "authenticated_view_menus"
    ON public.menus
    FOR SELECT
    TO authenticated
    USING (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_menus_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER menus_updated_at
    BEFORE UPDATE ON public.menus
    FOR EACH ROW
    EXECUTE FUNCTION update_menus_updated_at();

-- Add comment
COMMENT ON TABLE public.menus IS 'Stores navigation menu items with hierarchical structure and department associations';
