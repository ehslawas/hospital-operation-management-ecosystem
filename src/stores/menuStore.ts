import { create } from 'zustand'
import { supabase } from '@/services/supabase'

export interface MenuItem {
    id: string
    label: string
    path: string
    icon: string
    parent_id: string | null
    order_index: number
    is_core: boolean
    allowed_department_id: string | null
    module_code: string | null
    isHeader?: boolean
    children?: MenuItem[]
}

interface MenuState {
    menus: MenuItem[]
    isLoading: boolean
    isInitialized: boolean // NEW: Tracks if we've attempted to fetch menus at least once
    error: string | null

    // Actions
    fetchMenus: (userId: string, options?: { roleCode?: string, departmentCode?: string, user?: any }) => Promise<void>
    clearMenus: () => void
}

// Fallback menus for System/Hospital Admin to ensure system is never unusable
const FALLBACK_ADMIN_MENUS: MenuItem[] = [
    { id: 'dash', label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', parent_id: null, order_index: 0, is_core: true, allowed_department_id: null, module_code: 'dashboard', children: [] },
    { id: 'users', label: 'User Management', path: '/admin/users', icon: 'Users', parent_id: null, order_index: 1, is_core: true, allowed_department_id: null, module_code: 'admin.users', children: [] },
    { id: 'roles', label: 'Role Management', path: '/admin/roles', icon: 'Shield', parent_id: null, order_index: 2, is_core: true, allowed_department_id: null, module_code: 'admin.roles', children: [] },
    { id: 'depts', label: 'Departments', path: '/admin/departments', icon: 'Building2', parent_id: null, order_index: 3, is_core: true, allowed_department_id: null, module_code: 'admin.depts', children: [] },
    { id: 'hosp', label: 'Hospitals', path: '/admin/hospitals', icon: 'Building', parent_id: null, order_index: 4, is_core: true, allowed_department_id: null, module_code: 'admin.hospitals', children: [] },
    { id: 'acc', label: 'Access Requests', path: '/admin/access-requests', icon: 'UserPlus', parent_id: null, order_index: 5, is_core: true, allowed_department_id: null, module_code: 'admin.access', children: [] },
    { id: 'audit', label: 'Audit Logs', path: '/admin/audit-logs', icon: 'FileText', parent_id: null, order_index: 6, is_core: true, allowed_department_id: null, module_code: 'admin.audit', children: [] },
    { id: 'sett', label: 'System Settings', path: '/admin/settings', icon: 'Settings', parent_id: null, order_index: 7, is_core: true, allowed_department_id: null, module_code: 'admin.settings', children: [] },
]

export const useMenuStore = create<MenuState>((set, get) => ({
    menus: [],
    isLoading: false,
    isInitialized: false,
    error: null,

    fetchMenus: async (userId: string, options?: { roleCode?: string, departmentCode?: string, user?: any }) => {
        // Prevent duplicate calls
        if (get().isLoading) return

        set({ isLoading: true, error: null })

        try {
            console.log('[MenuStore] Fetching menus for user:', userId)

            // 1. Resolve User Context
            let effectiveRoleCode = options?.roleCode || options?.user?.role?.role_code
            let effectiveDeptCode = options?.departmentCode || options?.user?.department?.department_code

            let effectiveRoleId = options?.user?.role_id
            let effectiveDeptId = options?.user?.department_id

            // Fetch user from DB if crucial info is missing
            if (!effectiveRoleCode || !effectiveDeptCode || !effectiveRoleId) {
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('role_id, department_id, role:roles(role_code), department:departments(department_code)')
                    .eq('id', userId)
                    .single()

                if (!userError && userData) {
                    const roleData: any = userData.role;
                    const deptData: any = userData.department;
                    effectiveRoleCode = effectiveRoleCode || (Array.isArray(roleData) ? roleData[0]?.role_code : roleData?.role_code);
                    effectiveDeptCode = effectiveDeptCode || (Array.isArray(deptData) ? deptData[0]?.department_code : deptData?.department_code);
                    effectiveRoleId = effectiveRoleId || userData.role_id;
                    effectiveDeptId = effectiveDeptId || userData.department_id;
                }
            }

            const normalizedRole = effectiveRoleCode?.toLowerCase() || ''
            const isAdmin = normalizedRole === 'hospital_admin' || normalizedRole === 'system_admin'
            const isPharmacy = normalizedRole === 'pharmacist' || normalizedRole === 'assistant_pharmacist'

            console.log(`[MenuStore] Context - Role: ${normalizedRole}, IsAdmin: ${isAdmin}`)

            // 2. Fetch All Structural Menus
            const { data: allMenus, error: menusError } = await supabase
                .from('menus')
                .select('*')
                .order('order_index')

            if (menusError) throw menusError

            // 3. Fetch RBAC Permissions (Modules) for Regular Roles
            // The RPC function handles feature→module inheritance automatically via feature_grants CTE
            let accessibleModuleCodes = new Set<string>()

            if (!isAdmin) {
                console.log('[MenuStore] Regular role - fetching RBAC permissions')

                // Fetch Modules (via RPC) - this already includes modules granted via features!
                const { data: accessibleModules } = await supabase.rpc('get_staff_accessible_modules', {
                    p_staff_id: userId
                })

                console.log('[MenuStore] RPC returned modules:', accessibleModules?.map((m: any) => m.module_code))

                if (accessibleModules) {
                    accessibleModules.forEach((m: any) => accessibleModuleCodes.add(m.module_code))
                } else {
                    console.warn('[MenuStore] RPC returned NO accessible modules for user', userId)
                    console.warn('[MenuStore] Role:', effectiveRoleCode, 'Dept:', effectiveDeptCode)
                }
            }

            // 4. Filter and Map Menus
            // Helper: Normalize accessible codes (add base codes if prefixed)
            // e.g. if 'pharmacy.procurement' is granted, also treat 'procurement' as accessible for checking
            const normalizedAccessibleCodes = new Set(accessibleModuleCodes)
            accessibleModuleCodes.forEach(code => {
                if (code.includes('.')) {
                    const parts = code.split('.')
                    if (parts.length === 2) normalizedAccessibleCodes.add(parts[1])
                }
            })

            // Pass 1: Identify directly accessible menu IDs
            const directlyAccessibleMenuIds = new Set<string>()

            console.log('[MenuStore] Normalized Accessible Modules:', Array.from(normalizedAccessibleCodes))

            allMenus?.forEach(m => {
                const code = m.module_code
                if (!code) return

                let isAccessible = false

                // Admin Logic
                if (isAdmin) {
                    isAccessible = code === 'hospital_admin' || code === 'system_admin' || code === 'dashboard'
                }
                // Regular Role Logic - Trust the RPC!
                else {
                    // The RPC already handles feature→module inheritance
                    // Just check if the module code is in the accessible set
                    if (normalizedAccessibleCodes.has(code) ||
                        normalizedAccessibleCodes.has(`pharmacy.${code}`) ||
                        normalizedAccessibleCodes.has(`admin.${code}`)) {
                        isAccessible = true
                    }
                }

                if (isAccessible) {
                    directlyAccessibleMenuIds.add(m.id)
                }
            })

            console.log('[MenuStore] Directly Accessible IDs:', Array.from(directlyAccessibleMenuIds))

            // Pass 2: Propagate accessibility to descendants (Recursive Inheritance)
            // If a parent is accessible, ALL its children should be accessible unless explicitly denied?
            // For now, assume strict inheritance: Access to parent = Access to subtree.

            // Build adjacency list for traversal
            const childrenMap = new Map<string, any[]>()
            allMenus?.forEach(m => {
                if (m.parent_id) {
                    if (!childrenMap.has(m.parent_id)) childrenMap.set(m.parent_id, [])
                    childrenMap.get(m.parent_id)!.push(m)
                }
            })

            const finalAccessibleIds = new Set<string>(directlyAccessibleMenuIds)

            // Queue for BFS traversal starting from directly accessible nodes
            const queue = Array.from(directlyAccessibleMenuIds)

            while (queue.length > 0) {
                const parentId = queue.shift()!
                const children = childrenMap.get(parentId)
                if (children) {
                    children.forEach(child => {
                        if (!finalAccessibleIds.has(child.id)) {
                            finalAccessibleIds.add(child.id)
                            queue.push(child.id)
                        }
                    })
                }
            }

            // Also ensure parents of accessible items are visible (Upward propagation for structure)
            // Needed if a specific child is granted but parent wasn't generic? 
            // Usually we want the tree path to exist. 
            // Current Logic: We filter from allMenus. If we keep a child, we MUST keep its parents or the tree breaks?
            // The tree builder handles "orphan" nodes? No, "if (item.parent_id && menuMap.has(item.parent_id))".
            // So if parent is missing, child is essentially lost or becomes root?
            // Let's ensure parents are kept if a child is accessible.

            const ensureParents = (menuId: string, allMenusMap: Map<string, any>) => {
                let currentId = menuId
                while (true) {
                    const menu = allMenusMap.get(currentId)
                    if (!menu || !menu.parent_id) break

                    if (!finalAccessibleIds.has(menu.parent_id)) {
                        finalAccessibleIds.add(menu.parent_id)
                        currentId = menu.parent_id // Continue up
                    } else {
                        break // Parent already added, assume ancestors are too
                    }
                }
            }

            const allMenusMap = new Map(allMenus?.map(m => [m.id, m]))
            // Create array from set to iterate safely
            Array.from(finalAccessibleIds).forEach(id => ensureParents(id, allMenusMap))

            const filteredMenus = allMenus?.filter(m => finalAccessibleIds.has(m.id)) || []

            const menuItems: MenuItem[] = filteredMenus.map(m => ({
                id: m.id,
                label: m.label,
                path: m.path,
                icon: m.icon || 'Circle',
                parent_id: m.parent_id,
                order_index: m.order_index,
                is_core: true,
                allowed_department_id: m.allowed_department_id,
                module_code: m.module_code,
                children: []
            }))

            // 3. Construct Hierarchy
            const menuMap = new Map<string, MenuItem>()
            const rootMenus: MenuItem[] = []

            // Add all items to map
            menuItems.forEach(item => {
                menuMap.set(item.id, { ...item, children: [] })
            })

            // Build tree
            menuItems.forEach(item => {
                const menuItem = menuMap.get(item.id)!
                if (item.parent_id && menuMap.has(item.parent_id)) {
                    menuMap.get(item.parent_id)!.children!.push(menuItem)
                } else {
                    rootMenus.push(menuItem)
                }
            })

            // Sort
            const sortRecursive = (items: MenuItem[]) => {
                items.sort((a, b) => a.order_index - b.order_index)
                items.forEach(child => {
                    if (child.children) sortRecursive(child.children)
                })
            }
            sortRecursive(rootMenus)

            // 4. Wrap in Department Header (Visual consistency)
            let headerTitle = ''
            if (isAdmin) headerTitle = 'Hospital Administration'
            else if (isPharmacy) headerTitle = 'Pharmacy Logistics'

            if (headerTitle && rootMenus.length > 0) {
                const rootHeader: MenuItem = {
                    id: 'dept-header',
                    label: headerTitle,
                    path: '#',
                    icon: isAdmin ? 'Shield' : 'Package',
                    parent_id: null,
                    order_index: 0,
                    is_core: true,
                    allowed_department_id: null,
                    module_code: 'header',
                    isHeader: true,
                    children: rootMenus
                }
                set({ menus: [rootHeader], isLoading: false, isInitialized: true })
            } else {
                set({ menus: rootMenus, isLoading: false, isInitialized: true })
            }

        } catch (error: any) {
            console.error('[MenuStore] Error loading menus:', error)
            set({
                error: error.message || 'Failed to fetch menus',
                isLoading: false,
                isInitialized: true,
                menus: FALLBACK_ADMIN_MENUS // Emergency fallback
            })
        }
    },

    clearMenus: () => {
        set({ menus: [], error: null, isLoading: false, isInitialized: false })
    },
}))

export const useMenus = () => useMenuStore((state) => state.menus)
export const useMenusLoading = () => useMenuStore((state) => state.isLoading)
export const useIsMenusInitialized = () => useMenuStore((state) => state.isInitialized)
