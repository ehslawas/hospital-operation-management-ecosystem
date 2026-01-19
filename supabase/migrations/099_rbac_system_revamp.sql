-- Migration: RBAC System Revamp
-- Description: Implements comprehensive RBAC with resource-level permissions, role+department matrix, and dual-track approval workflows.

-- ============================================
-- 1. Create Resource Permissions Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.resource_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_code TEXT NOT NULL UNIQUE,
    resource_name TEXT NOT NULL,
    module TEXT NOT NULL,
    permission_tag TEXT[] NOT NULL DEFAULT '{}', -- e.g., ['Emergency_Consumables', 'Basic_Medications']
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resource_permissions_module ON public.resource_permissions(module);
CREATE INDEX IF NOT EXISTS idx_resource_permissions_code ON public.resource_permissions(resource_code);

-- Enable RLS
ALTER TABLE public.resource_permissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access for authenticated users" ON public.resource_permissions
    FOR SELECT TO authenticated USING (true);

-- ============================================
-- 2. Create Role-Department Permissions Matrix
-- ============================================
CREATE TABLE IF NOT EXISTS public.role_department_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE, -- NULL = applies to all departments
    resource_id UUID NOT NULL REFERENCES public.resource_permissions(id) ON DELETE CASCADE,
    
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_approve BOOLEAN DEFAULT false,
    
    granted_by UUID REFERENCES public.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(role_id, department_id, resource_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rdp_role_id ON public.role_department_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_rdp_dept_id ON public.role_department_permissions(department_id);
CREATE INDEX IF NOT EXISTS idx_rdp_resource_id ON public.role_department_permissions(resource_id);

-- Enable RLS
ALTER TABLE public.role_department_permissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own permissions" ON public.role_department_permissions
    FOR SELECT TO authenticated
    USING (
        role_id IN (SELECT role_id FROM public.users WHERE id = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role_id IN (SELECT id FROM public.roles WHERE role_code IN ('system_admin', 'hospital_admin'))
        )
    );

CREATE POLICY "Admins can manage permissions" ON public.role_department_permissions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role_id IN (SELECT id FROM public.roles WHERE role_code IN ('system_admin', 'hospital_admin'))
        )
    );

-- ============================================
-- 3. Modify Departments Table
-- ============================================
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'approval_type') THEN
        ALTER TABLE public.departments 
        ADD COLUMN approval_type TEXT DEFAULT 'standard' 
        CHECK (approval_type IN ('standard', 'exempt'));
    END IF;
END $$;

-- Update existing departments
UPDATE public.departments SET approval_type = 'exempt' 
WHERE department_code IN ('ADMIN', 'PATHOLOGY') OR department_name ILIKE '%Admin%' OR department_name ILIKE '%Pathology%';

-- ============================================
-- 4. Create Approval Routes Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.approval_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_name TEXT NOT NULL UNIQUE,
    route_type TEXT NOT NULL CHECK (route_type IN ('standard', 'exempt')),
    step_order INTEGER NOT NULL,
    approver_role_id UUID NOT NULL REFERENCES public.roles(id),
    is_final BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_approval_routes_type ON public.approval_routes(route_type);

-- Enable RLS
ALTER TABLE public.approval_routes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Read access for all authenticated users" ON public.approval_routes
    FOR SELECT TO authenticated USING (true);

-- ============================================
-- 5. Create Approval Logs Table (Audit Trail)
-- ============================================
CREATE TABLE IF NOT EXISTS public.approval_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'purchase_order', 'purchase_requisition', etc.
    entity_id UUID NOT NULL,
    approval_route_id UUID REFERENCES public.approval_routes(id),
    step_order INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'escalated', 'auto_finalized')),
    approved_by UUID NOT NULL REFERENCES public.users(id),
    comments TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_approval_logs_entity ON public.approval_logs(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_approval_logs_approver ON public.approval_logs(approved_by);

-- Enable RLS
ALTER TABLE public.approval_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view logs related to them" ON public.approval_logs
    FOR SELECT TO authenticated
    USING (
        approved_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role_id IN (SELECT id FROM public.roles WHERE role_code IN ('system_admin', 'hospital_admin', 'hospital_director'))
        )
    );

CREATE POLICY "System can insert logs" ON public.approval_logs
    FOR INSERT TO authenticated
    WITH CHECK (approved_by = auth.uid());

-- ============================================
-- 6. Trigger for Updated At
-- ============================================

CREATE TRIGGER update_resource_permissions_updated_at
    BEFORE UPDATE ON public.resource_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_department_permissions_updated_at
    BEFORE UPDATE ON public.role_department_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_routes_updated_at
    BEFORE UPDATE ON public.approval_routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. Seed Initial Data
-- ============================================

-- Seed Resource Permissions (Pharmacy Logistics example)
INSERT INTO public.resource_permissions (resource_code, resource_name, module, permission_tag, description)
VALUES 
    -- Inventory
    ('pharmacy.inventory.all', 'Full Inventory Access', 'pharmacy_logistics', ARRAY['Inventory_Manage'], 'Full access to pharmacy inventory'),
    ('pharmacy.inventory.view', 'View Inventory', 'pharmacy_logistics', ARRAY['Inventory_View'], 'Read-only access to inventory'),
    
    -- Categories with Tags (The AMO Requirement)
    ('pharmacy.cat.emergency', 'Emergency Consumables', 'pharmacy_logistics', ARRAY['Emergency_Consumables', 'Basic_Medications'], 'Emergency department supplies'),
    ('pharmacy.cat.psychotropic', 'Psychotropic Drugs', 'pharmacy_logistics', ARRAY['Psychotropic_Drugs', 'Controlled'], 'Controlled substances'),
    ('pharmacy.cat.bulk', 'Bulk Inventory', 'pharmacy_logistics', ARRAY['Bulk_Inventory', 'Procurement'], 'Bulk store access'),
    
    -- Procurement
    ('pharmacy.procurement.create', 'Create Purchase Order', 'pharmacy_logistics', ARRAY['PO_Create'], 'Ability to create purchase orders'),
    ('pharmacy.procurement.approve', 'Approve Purchase Order', 'pharmacy_logistics', ARRAY['PO_Approve'], 'Ability to approve purchase orders')
ON CONFLICT (resource_code) DO NOTHING;
