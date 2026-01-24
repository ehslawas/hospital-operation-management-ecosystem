-- Migration: Add Performance Indexes for RBAC and Modules
-- Created: 2026-01-19
-- Description: Adds missing indexes to support frequent queries in get_staff_accessible_modules and permission checks.

-- 1. Modules Table: Frequent lookup by code and active status
CREATE INDEX IF NOT EXISTS idx_modules_code_active ON public.modules(module_code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_modules_parent_id ON public.modules(parent_module_id);
CREATE INDEX IF NOT EXISTS idx_modules_display_order ON public.modules(display_order);

-- 2. Role Permissions: Core join table for RBAC, queried by role and module
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_module ON public.role_permissions(role_id, module_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module_id ON public.role_permissions(module_id);

-- 3. Users Table: Frequent lookups and joins by role
CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON public.users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_hospital_id ON public.users(hospital_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email); -- Login lookup

-- 4. Staff Custom Permissions: Overrides checked on every permission call
CREATE INDEX IF NOT EXISTS idx_staff_custom_permissions_user_module ON public.staff_custom_permissions(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_staff_custom_permissions_user_feature ON public.staff_custom_permissions(user_id, feature_id);
CREATE INDEX IF NOT EXISTS idx_staff_custom_permissions_composite ON public.staff_custom_permissions(user_id, module_id, action);

-- 5. Features: Joined for feature-level permissions
CREATE INDEX IF NOT EXISTS idx_features_module_id ON public.features(module_id);
CREATE INDEX IF NOT EXISTS idx_features_code ON public.features(feature_code);

-- 6. Role Feature Permissions
CREATE INDEX IF NOT EXISTS idx_role_feature_permissions_role_feature ON public.role_feature_permissions(role_id, feature_id);

-- 7. Menus: Used for building the sidebar
CREATE INDEX IF NOT EXISTS idx_menus_order_index ON public.menus(order_index);
CREATE INDEX IF NOT EXISTS idx_menus_parent_id ON public.menus(parent_id);

-- Analyye tables to update stats immediately
ANALYZE public.modules;
ANALYZE public.role_permissions;
ANALYZE public.users;
ANALYZE public.staff_custom_permissions;
ANALYZE public.features;
ANALYZE public.menus;
ANALYZE public.suppliers;
