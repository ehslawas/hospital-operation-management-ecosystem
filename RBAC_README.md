# Hospital RBAC System - Complete Implementation

## 🎯 Overview

A complete Role-Based Access Control (RBAC) system with dynamic approval workflows for Hospital Management. This system is **100% UI-configurable** - no code changes required for new departments, roles, menus, or approval workflows.

## ✨ Features

- ✅ **Dynamic Menu System** - Hierarchical, permission-based navigation
- ✅ **Granular Permissions** - Module + Feature level access control
- ✅ **Custom Overrides** - Individual staff permission exceptions
- ✅ **Approval Workflows** - Multi-step approvals with conditions
- ✅ **Real-time Caching** - 5-minute permission cache with React Query
- ✅ **Full Type Safety** - Complete TypeScript coverage
- ✅ **Row Level Security** - Supabase RLS on all tables

## 📦 What's Included

### Database (Supabase)
- **3 migrations** - 100, 101, 102
- **11 new tables** - modules, features, permissions, workflows
- **5 functions** - Permission checking & workflow evaluation
- **40+ RLS policies** - Secure by default

### Frontend (React + TypeScript)
- **8 Admin Pages** - Module, Feature, Permission, Workflow management
- **1 Approval Dashboard** - 3 tabs (Pending, My Requests, All)
- **3 Hooks** - useAuth, usePermission, useFeatureAccess
- **3 Components** - ProtectedRoute, PermissionGate, FeatureGate
- **2 Services** - permissionService (30+ functions), approvalService (25+ functions)

## 🚀 Quick Start

### 1. Apply Migrations

The migrations are located in `supabase/migrations/`:
- `100_create_rbac_system.sql` - Core tables
- `101_create_rbac_functions.sql` - Database functions
- `102_seed_rbac_sample_data.sql` - Sample data

These will be automatically applied when you push to Supabase or run locally.

### 2. Install Dependencies

```bash
npm install @tanstack/react-query date-fns
```

### 3. Configure Environment

Ensure your `.env` file has:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Wrap App with AuthProvider

```tsx
// src/App.tsx or main.tsx
import { AuthProvider } from './hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {/* Your routes */}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

### 5. Add Admin Routes

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Admin routes
<Route path="/admin/modules" element={
  <ProtectedRoute moduleCode="administration.modules" action="view">
    <ModuleManagementPage />
  </ProtectedRoute>
} />

<Route path="/admin/permissions" element={
  <ProtectedRoute moduleCode="administration.permissions" action="view">
    <PermissionManagementPage />
  </ProtectedRoute>
} />

<Route path="/approvals" element={
  <ProtectedRoute moduleCode="approvals" action="view">
    <ApprovalDashboardPage />
  </ProtectedRoute>
} />
```

## 📖 Usage Examples

### Check Permission in Code

```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, checkPermission } = useAuth();
  
  const handleDelete = async () => {
    const canDelete = await checkPermission('pharmacy.stock', 'delete');
    if (!canDelete) {
      toast.error('No permission');
      return;
    }
    // Proceed...
  };
}
```

### Permission Gate Component

```tsx
import { PermissionGate } from '@/components/PermissionGates';

<PermissionGate module="pharmacy.stock" action="create">
  <Button>Add Stock</Button>
</PermissionGate>
```

### Use Permission Hook

```tsx
import { usePermission } from '@/hooks/usePermission';

function StockPage() {
  const { hasAccess, isLoading } = usePermission('pharmacy.stock', 'edit');
  
  if (isLoading) return <Loading />;
  
  return (
    <div>
      {hasAccess && <EditButton />}
    </div>
  );
}
```

### Integrate Approval Workflow

```tsx
import { checkApprovalNeeded, createApprovalRequest } from '@/services/approvalService';

// Before creating resource
const approvalCheck = await checkApprovalNeeded('purchase_order', {
  amount: '10000',
  item_type: 'medical_cylinder'
});

if (approvalCheck.needs_approval) {
  // Create approval request
  await createApprovalRequest(
    approvalCheck.workflow_id,
    userId,
    formData,
    'purchase_order'
  );
  showMessage('Sent for approval');
} else {
  // Create directly
  await createPurchaseOrder(formData);
}
```

## 🏗️ Architecture

### Database Functions

1. **`check_staff_permission(staff_id, module_code, action)`**
   - Checks permission with custom override support
   - Returns boolean

2. **`check_approval_needed(action_type_code, request_data)`**
   - Evaluates workflow conditions
   - Returns `{needs_approval, workflow_id}`

3. **`get_staff_accessible_modules(staff_id)`**
   - Returns hierarchical module tree with permissions
   - Used for dynamic sidebar

4. **`check_feature_permission(staff_id, feature_code)`**
   - Feature-level access check

5. **`get_pending_approvals_for_staff(staff_id)`**
   - Returns pending approval requests for staff

### Permission Hierarchy

```
Role Permissions (baseline)
  ↓
Staff Custom Permissions (overrides)
  ↓
Final Access Decision
```

Custom permissions ALWAYS override role permissions:
- **Grant override** = Access granted even if role denies
- **Deny override** = Access denied even if role allows

## 🔐 Security

- ✅ All tables have Row Level Security (RLS)
- ✅ Functions use `SECURITY DEFINER` with `STABLE` flag
- ✅ Admin checks in RLS policies
- ✅ Permission caching client-side only
- ✅ Database enforces all constraints

## 🧪 Testing

### Manual Testing Scenarios

1. **Add New Module**
   - Go to `/admin/modules`
   - Click "Add Module"
   - Fill form and save
   - Verify appears in sidebar (if permission granted)

2. **Configure Permission**
   - Go to `/admin/permissions`
   - Select role
   - Check permission boxes
   - Save
   - Login as user with that role
   - Verify access

3. **Create Approval Workflow**
   - Go to `/admin/workflows`
   - Click "New Workflow"
   - Set condition: `amount > 5000`
   - Add approval steps
   - Activate workflow
   - Test with purchase order

### Database Testing

```sql
-- Test permission check
SELECT check_staff_permission(
  'user-uuid-here',
  'pharmacy.stock',
  'view'
);

-- Test approval workflow
SELECT * FROM check_approval_needed(
  'purchase_order',
  '{"amount": "10000", "item_type": "medical_cylinder"}'::jsonb
);

-- Get accessible modules
SELECT * FROM get_staff_accessible_modules('user-uuid-here');
```

## 📂 File Structure

```
src/
├── components/
│   ├── PermissionGates.tsx         # PermissionGate, FeatureGate
│   └── ProtectedRoute.tsx          # Route protection
├── hooks/
│   ├── useAuth.tsx                 # Auth context + caching
│   └── usePermission.ts            # Permission hooks
├── pages/
│   ├── admin/
│   │   ├── modules/ModuleManagementPage.tsx
│   │   ├── features/FeatureManagementPage.tsx
│   │   ├── permissions/PermissionManagementPage.tsx
│   │   └── workflows/WorkflowManagementPage.tsx
│   ├── approvals/ApprovalDashboardPage.tsx
│   └── examples/CreatePurchaseOrderPage.tsx
├── services/
│   ├── permissionService.ts        # 30+ functions
│   └── approvalService.ts          # 25+ functions
├── types/
│   └── rbac.types.ts               # 40+ type definitions
└── constants/
    └── permissions.ts              # Constants

supabase/migrations/
├── 100_create_rbac_system.sql
├── 101_create_rbac_functions.sql
└── 102_seed_rbac_sample_data.sql
```

## 📊 Sample Data

After migration 102, you'll have:
- **16 modules** (Dashboard, Patient Management, Pharmacy, etc.)
- **11 features** (add_stock, adjust_stock, prescribe_medication, etc.)
- **1 workflow** (Medical Cylinder Purchase > RM 5,000)
- **Sample permissions** for Assistant Pharmacist role

## 🛠️ Admin Pages

| Page | Route | Purpose |
|------|-------|---------|
| Module Management | `/admin/modules` | Manage hierarchical menus |
| Feature Management | `/admin/features` | Manage granular features |
| Permission Management | `/admin/permissions` | Configure role permissions |
| Staff Permissions | `/admin/staff-permissions` | Individual overrides |
| Workflow Management | `/admin/workflows` | Approval workflows |
| Approval Dashboard | `/approvals` | View/manage approvals |

## 🎯 Success Criteria

- ✅ Add departments without code changes
- ✅ Create roles without code changes
- ✅ Build menu structure via UI
- ✅ Configure permissions via UI
- ✅ Create approval workflows via UI
- ✅ Dynamic sidebar based on permissions
- ✅ Buttons respect permission checks
- ✅ Approval requests flow automatically
- ✅ Full TypeScript type safety
- ✅ Permission caching (5-min TTL)

## 🐛 Troubleshooting

**Permissions not working?**
- Check RLS policies are enabled
- Verify user has role assigned
- Check permission cache (clear and retry)

**Approval not triggering?**
- Verify workflow is active
- Check conditions match request data
- Ensure action type matches

**Module not in sidebar?**
- Check `is_active = true`
- Verify role has `can_view` permission
- Check parent module permissions

## 📚 Additional Documentation

- [Implementation Plan](file:///C:/Users/60113/.gemini/antigravity/brain/9a7bf49f-4e88-4f62-b8ea-950617cab3c7/implementation_plan.md) - Detailed technical specs
- [Walkthrough](file:///C:/Users/60113/.gemini/antigravity/brain/9a7bf49f-4e88-4f62-b8ea-950617cab3c7/walkthrough.md) - What was built
- [Task Checklist](file:///C:/Users/60113/.gemini/antigravity/brain/9a7bf49f-4e88-4f62-b8ea-950617cab3c7/task.md) - Implementation progress

## 📞 Support

For questions or issues, refer to the implementation plan and type definitions for detailed API documentation.

---

**Built with:** React, TypeScript, Supabase, TanStack Query, Tailwind CSS, shadcn/ui
