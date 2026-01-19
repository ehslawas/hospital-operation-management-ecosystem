-- Migration: Create Role Menu Access Table
-- Description: Controls which menus are visible/accessible to specific roles

-- Create role_menu_access table
CREATE TABLE IF NOT EXISTS public.role_menu_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
    can_view BOOLEAN NOT NULL DEFAULT true,
    can_edit BOOLEAN NOT NULL DEFAULT false,
    can_delete BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    
    -- Ensure unique role-menu combinations
    CONSTRAINT unique_role_menu UNIQUE (role_id, menu_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_role_menu_access_role_id ON public.role_menu_access(role_id);
CREATE INDEX IF NOT EXISTS idx_role_menu_access_menu_id ON public.role_menu_access(menu_id);
CREATE INDEX IF NOT EXISTS idx_role_menu_access_can_view ON public.role_menu_access(can_view);

-- Enable RLS
ALTER TABLE public.role_menu_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- System Admin can manage all
CREATE POLICY "system_admin_all_role_menu_access"
    ON public.role_menu_access
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

-- Hospital Admin can manage role menu access for their hospital
CREATE POLICY "hospital_admin_manage_role_menu_access"
    ON public.role_menu_access
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.role_code = 'hospital_admin'
            AND r.hospital_id = (
                SELECT hospital_id FROM public.roles WHERE id = role_menu_access.role_id
            )
        )
    );

-- Users can view their own role's menu access
CREATE POLICY "users_view_own_role_menu_access"
    ON public.role_menu_access
    FOR SELECT
    TO authenticated
    USING (
        role_id IN (
            SELECT role_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Add trigger for updated_at
CREATE TRIGGER role_menu_access_updated_at
    BEFORE UPDATE ON public.role_menu_access
    FOR EACH ROW
    EXECUTE FUNCTION update_menus_updated_at();

-- Add comment
COMMENT ON TABLE public.role_menu_access IS 'Controls menu visibility and permissions for each role';
