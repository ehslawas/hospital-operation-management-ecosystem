-- ============================================================================
-- Migration 100: Comprehensive RBAC System
-- Description: Complete Role-Based Access Control with dynamic approval workflows
-- Created: 2026-01-18
-- ============================================================================

-- ============================================
-- PART 1: MODULES & FEATURES SYSTEM
-- ============================================

-- Modules Table (Hierarchical Menu System)
-- Replaces/enhances existing menus table with better structure
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_name TEXT NOT NULL,
    module_code TEXT NOT NULL UNIQUE,
    parent_module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    route_path TEXT NOT NULL,
    icon_name TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for modules
CREATE INDEX IF NOT EXISTS idx_modules_parent ON public.modules(parent_module_id);
CREATE INDEX IF NOT EXISTS idx_modules_code ON public.modules(module_code);
CREATE INDEX IF NOT EXISTS idx_modules_active ON public.modules(is_active);
CREATE INDEX IF NOT EXISTS idx_modules_order ON public.modules(display_order);

-- Comments
COMMENT ON TABLE public.modules IS 'Hierarchical menu/module structure for dynamic navigation';
COMMENT ON COLUMN public.modules.module_code IS 'Unique code identifier for permission checking (e.g., pharmacy.stock)';
COMMENT ON COLUMN public.modules.parent_module_id IS 'Self-referencing FK for unlimited nesting levels';

-- ============================================

-- Features Table (Granular Actions Within Modules)
CREATE TABLE IF NOT EXISTS public.features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    feature_name TEXT NOT NULL,
    feature_code TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(module_id, feature_code)
);

-- Indexes for features
CREATE INDEX IF NOT EXISTS idx_features_module ON public.features(module_id);

COMMENT ON TABLE public.features IS 'Granular features/actions within modules (e.g., add_stock, prescribe_medication)';

-- ============================================
-- PART 2: PERMISSION SYSTEM
-- ============================================

-- Role Permissions (Module-Level CRUD)
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES public.users(id),
    UNIQUE(role_id, module_id)
);

-- Indexes for role_permissions
CREATE INDEX IF NOT EXISTS idx_role_perms_role ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_perms_module ON public.role_permissions(module_id);

COMMENT ON TABLE public.role_permissions IS 'CRUD permissions at module level for each role';

-- ============================================

-- Role Feature Permissions (Feature-Level Toggles)
CREATE TABLE IF NOT EXISTS public.role_feature_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT false,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES public.users(id),
    UNIQUE(role_id, feature_id)
);

-- Indexes for role_feature_permissions
CREATE INDEX IF NOT EXISTS idx_role_feat_perms_role ON public.role_feature_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_feat_perms_feature ON public.role_feature_permissions(feature_id);

COMMENT ON TABLE public.role_feature_permissions IS 'Granular feature-level permissions for roles';

-- ============================================

-- Staff Custom Permissions (Individual Overrides)
CREATE TABLE IF NOT EXISTS public.staff_custom_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    feature_id UUID REFERENCES public.features(id) ON DELETE CASCADE,
    permission_type TEXT NOT NULL CHECK (permission_type IN ('grant', 'deny')),
    action TEXT CHECK (action IN ('view', 'create', 'edit', 'delete')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    CONSTRAINT check_module_or_feature CHECK (
        (module_id IS NOT NULL AND feature_id IS NULL) OR
        (module_id IS NULL AND feature_id IS NOT NULL)
    )
);

-- Indexes for staff_custom_permissions
CREATE INDEX IF NOT EXISTS idx_staff_custom_user ON public.staff_custom_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_custom_module ON public.staff_custom_permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_staff_custom_feature ON public.staff_custom_permissions(feature_id);

COMMENT ON TABLE public.staff_custom_permissions IS 'Individual staff permission overrides (grant or deny)';

-- ============================================
-- PART 3: APPROVAL WORKFLOW SYSTEM
-- ============================================

-- Action Types (What Can Be Approved)
CREATE TABLE IF NOT EXISTS public.action_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_name TEXT NOT NULL UNIQUE,
    type_code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_action_types_code ON public.action_types(type_code);

COMMENT ON TABLE public.action_types IS 'Types of actions that can trigger approval workflows (e.g., purchase_order, patient_discharge)';

-- ============================================

-- Approval Workflows
CREATE TABLE IF NOT EXISTS public.approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_name TEXT NOT NULL,
    action_type_id UUID NOT NULL REFERENCES public.action_types(id) ON DELETE CASCADE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflows_action_type ON public.approval_workflows(action_type_id);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON public.approval_workflows(is_active);

COMMENT ON TABLE public.approval_workflows IS 'Approval workflow configurations';

-- ============================================

-- Approval Workflow Steps (Multi-Step Chains)
CREATE TABLE IF NOT EXISTS public.approval_workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    approver_role_id UUID REFERENCES public.roles(id),
    approver_department_id UUID REFERENCES public.departments(id),
    approver_user_id UUID REFERENCES public.users(id),
    is_required BOOLEAN DEFAULT true,
    can_reject BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_approver_specified CHECK (
        approver_role_id IS NOT NULL OR
        approver_department_id IS NOT NULL OR
        approver_user_id IS NOT NULL
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON public.approval_workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_order ON public.approval_workflow_steps(step_order);

COMMENT ON TABLE public.approval_workflow_steps IS 'Sequential approval steps in a workflow';
COMMENT ON COLUMN public.approval_workflow_steps.approver_role_id IS 'Any user with this role can approve';
COMMENT ON COLUMN public.approval_workflow_steps.approver_department_id IS 'Any senior staff in this department can approve';
COMMENT ON COLUMN public.approval_workflow_steps.approver_user_id IS 'Specific user who must approve';

-- ============================================

-- Approval Conditions (When to Trigger Workflow)
CREATE TABLE IF NOT EXISTS public.approval_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    operator TEXT NOT NULL CHECK (operator IN ('=', '!=', '>', '<', '>=', '<=', 'contains', 'not_contains', 'in', 'not_in')),
    field_value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conditions_workflow ON public.approval_conditions(workflow_id);

COMMENT ON TABLE public.approval_conditions IS 'Conditions that trigger a workflow (ALL conditions must match)';
COMMENT ON COLUMN public.approval_conditions.field_name IS 'JSON path in request data (e.g., amount, item_type)';

-- ============================================

-- Approval Requests (Runtime Instances)
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id),
    requester_id UUID NOT NULL REFERENCES public.users(id),
    request_data JSONB NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    current_step INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_approval_requests_workflow ON public.approval_requests(workflow_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requester ON public.approval_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON public.approval_requests(entity_type, entity_id);

COMMENT ON TABLE public.approval_requests IS 'Runtime approval request instances';
COMMENT ON COLUMN public.approval_requests.request_data IS 'Original request data as JSON for condition evaluation';
COMMENT ON COLUMN public.approval_requests.entity_type IS 'Type of entity (purchase_order, prescription, etc.)';
COMMENT ON COLUMN public.approval_requests.entity_id IS 'Reference to actual entity record';

-- ============================================

-- Approval Actions (History/Audit Trail)
CREATE TABLE IF NOT EXISTS public.approval_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    approver_id UUID NOT NULL REFERENCES public.users(id),
    action TEXT NOT NULL CHECK (action IN ('approve', 'reject')),
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_approval_actions_request ON public.approval_actions(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_actions_approver ON public.approval_actions(approver_id);

COMMENT ON TABLE public.approval_actions IS 'History of approval/rejection actions';

-- ============================================
-- PART 4: ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_feature_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_custom_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_actions ENABLE ROW LEVEL SECURITY;

-- Modules: All authenticated users can read
CREATE POLICY "authenticated_read_modules" ON public.modules
    FOR SELECT TO authenticated USING (true);

-- Modules: Only system admins can modify
CREATE POLICY "system_admin_manage_modules" ON public.modules
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON r.id = u.role_id
            WHERE u.id = auth.uid() AND r.role_code IN ('system_admin', 'hospital_admin')
        )
    );

-- Features: All authenticated users can read
CREATE POLICY "authenticated_read_features" ON public.features
    FOR SELECT TO authenticated USING (true);

-- Features: Only admins can modify
CREATE POLICY "admin_manage_features" ON public.features
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON r.id = u.role_id
            WHERE u.id = auth.uid() AND r.role_code IN ('system_admin', 'hospital_admin')
        )
    );

-- Role Permissions: Users can read their own role's permissions
CREATE POLICY "users_read_own_role_permissions" ON public.role_permissions
    FOR SELECT TO authenticated
    USING (
        role_id IN (SELECT role_id FROM public.users WHERE id = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON r.id = u.role_id
            WHERE u.id = auth.uid() AND r.role_code IN ('system_admin', 'hospital_admin')
        )
    );

-- Role Permissions: Only admins can modify
CREATE POLICY "admin_manage_role_permissions" ON public.role_permissions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON r.id = u.role_id
            WHERE u.id = auth.uid() AND r.role_code IN ('system_admin', 'hospital_admin')
        )
    );

-- Role Feature Permissions: Similar to role_permissions
CREATE POLICY "users_read_own_role_feature_permissions" ON public.role_feature_permissions
    FOR SELECT TO authenticated
    USING (
        role_id IN (SELECT role_id FROM public.users WHERE id = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON r.id = u.role_id
            WHERE u.id = auth.uid() AND r.role_code IN ('system_admin', 'hospital_admin')
        )
    );

CREATE POLICY "admin_manage_role_feature_permissions" ON public.role_feature_permissions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON r.id = u.role_id
            WHERE u.id = auth.uid() AND r.role_code IN ('system_admin', 'hospital_admin')
        )
    );

-- Staff Custom Permissions: Users can read their own, admins can read all
CREATE POLICY "users_read_own_custom_permissions" ON public.staff_custom_permissions
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON r.id = u.role_id
            WHERE u.id = auth.uid() AND r.role_code IN ('system_admin', 'hospital_admin')
        )
    );

CREATE POLICY "admin_manage_custom_permissions" ON public.staff_custom_permissions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON r.id = u.role_id
            WHERE u.id = auth.uid() AND r.role_code IN ('system_admin', 'hospital_admin')
        )
    );

-- Action Types: All authenticated can read
CREATE POLICY "authenticated_read_action_types" ON public.action_types
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_manage_action_types" ON public.action_types
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON r.id = u.role_id
            WHERE u.id = auth.uid() AND r.role_code IN ('system_admin', 'hospital_admin')
        )
    );

-- Approval Workflows: All can read active workflows
CREATE POLICY "authenticated_read_active_workflows" ON public.approval_workflows
    FOR SELECT TO authenticated USING (is_active = true OR
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON r.id = u.role_id
            WHERE u.id = auth.uid() AND r.role_code IN ('system_admin', 'hospital_admin')
        )
    );

CREATE POLICY "admin_manage_workflows" ON public.approval_workflows
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON r.id = u.role_id
            WHERE u.id = auth.uid() AND r.role_code IN ('system_admin', 'hospital_admin')
        )
    );

-- Workflow Steps: Readable by all
CREATE POLICY "authenticated_read_workflow_steps" ON public.approval_workflow_steps
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_manage_workflow_steps" ON public.approval_workflow_steps
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON r.id = u.role_id
            WHERE u.id = auth.uid() AND r.role_code IN ('system_admin', 'hospital_admin')
        )
    );

-- Approval Conditions: Readable by all
CREATE POLICY "authenticated_read_conditions" ON public.approval_conditions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_manage_conditions" ON public.approval_conditions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON r.id = u.role_id
            WHERE u.id = auth.uid() AND r.role_code IN ('system_admin', 'hospital_admin')
        )
    );

-- Approval Requests: Users can see their own requests + requests they can approve
CREATE POLICY "users_read_relevant_requests" ON public.approval_requests
    FOR SELECT TO authenticated
    USING (
        requester_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.approval_workflow_steps aws
            JOIN public.users u ON (
                (aws.approver_user_id = u.id AND u.id = auth.uid()) OR
                (aws.approver_role_id = u.role_id AND u.id = auth.uid()) OR
                (aws.approver_department_id = u.department_id AND u.id = auth.uid())
            )
            WHERE aws.workflow_id = approval_requests.workflow_id
              AND aws.step_order = approval_requests.current_step
        ) OR
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON r.id = u.role_id
            WHERE u.id = auth.uid() AND r.role_code IN ('system_admin', 'hospital_admin', 'hospital_director')
        )
    );

-- Approval Requests: Users can create their own
CREATE POLICY "users_create_requests" ON public.approval_requests
    FOR INSERT TO authenticated
    WITH CHECK (requester_id = auth.uid());

-- Approval Requests: Users can update their own pending requests
CREATE POLICY "users_update_own_requests" ON public.approval_requests
    FOR UPDATE TO authenticated
    USING (requester_id = auth.uid() AND status = 'pending');

-- Approval Actions: Users can read actions on requests they can see
CREATE POLICY "users_read_approval_actions" ON public.approval_actions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.approval_requests ar
            WHERE ar.id = approval_actions.request_id
              AND (
                ar.requester_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.users u
                    JOIN public.roles r ON r.id = u.role_id
                    WHERE u.id = auth.uid() AND r.role_code IN ('system_admin', 'hospital_admin', 'hospital_director')
                )
              )
        )
    );

-- Approval Actions: Approvers can insert their actions
CREATE POLICY "approvers_insert_actions" ON public.approval_actions
    FOR INSERT TO authenticated
    WITH CHECK (approver_id = auth.uid());

-- ============================================
-- PART 5: TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_modules_updated_at
    BEFORE UPDATE ON public.modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_workflows_updated_at
    BEFORE UPDATE ON public.approval_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_requests_updated_at
    BEFORE UPDATE ON public.approval_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
