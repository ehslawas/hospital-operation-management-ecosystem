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
    error: string | null

    // Actions
    fetchMenus: (userId: string, options?: { roleCode?: string, departmentCode?: string }) => Promise<void>
    clearMenus: () => void
}

/**
 * Menu Store - Manages dynamic navigation menus based on user role and department
 */
export const useMenuStore = create<MenuState>((set) => ({
    menus: [],
    isLoading: false,
    error: null,

    fetchMenus: async (userId: string, options?: { roleCode?: string, departmentCode?: string }) => {
        set({ isLoading: true, error: null })

        try {
            console.log('[MenuStore] === START FETCH ===')
            console.log('[MenuStore] User ID:', userId)
            console.log('[MenuStore] Options:', options)

            // 0. Validate input
            if (!userId) {
                throw new Error('User ID is required for menu fetch')
            }

            // 1. Get User Data or Simulated Data
            let roleId = ''
            let departmentId: string | null = ''
            let departmentCode = ''

            // Base user fetch
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('role_id, department_id')
                .eq('id', userId)
                .single()

            if (userError || !user) {
                throw new Error(`User not found: ${userError?.message || 'Unknown error'}`)
            }

            // Validate user has a role
            if (!user.role_id && !options?.roleCode) {
                throw new Error('User has no role assigned and no role simulation provided')
            }

            // A. Handle Role Simulation
            if (options?.roleCode) {
                const { data: roleData, error: roleError } = await supabase
                    .from('roles')
                    .select('id')
                    .eq('role_code', options.roleCode)
                    .single()

                if (roleError) {
                    console.error('[MenuStore] Simulated Role not found:', roleError)
                    roleId = user.role_id // Fallback
                } else {
                    roleId = roleData.id
                }
            } else {
                roleId = user.role_id
            }

            // B. Handle Department Simulation or Inheritance
            // If explicit department code provided (e.g. switching to pharmacy view implies pharmacy dept)
            if (options?.departmentCode) {
                const { data: deptData, error: deptError } = await supabase
                    .from('departments')
                    .select('id, department_code')
                    .eq('department_code', options.departmentCode)
                    .single()

                if (deptError) {
                    console.error('[MenuStore] Simulated Dept not found:', deptError)
                    departmentCode = '' // Fallback
                    departmentId = user.department_id // Fallback key
                } else {
                    departmentId = deptData.id
                    departmentCode = deptData.department_code
                }
            } else {
                // If no simulated department, use user's real one
                departmentId = user.department_id
                if (departmentId) {
                    const { data: dept, error: deptError } = await supabase
                        .from('departments')
                        .select('department_code')
                        .eq('id', departmentId)
                        .single()
                    if (!deptError) {
                        departmentCode = dept?.department_code
                    }
                }
            }

            // C. Post-processing: Ensure Admins have a department context
            // If we still have no department, but the role is Admin, force 'hospital_admin'
            if (!departmentId) {
                const { data: roleData } = await supabase
                    .from('roles')
                    .select('role_code')
                    .eq('id', roleId)
                    .single()

                if (roleData && (roleData.role_code === 'hospital_admin' || roleData.role_code === 'system_admin')) {
                    console.log('[MenuStore] No department found for Admin, auto-linking to hospital_admin context.')
                    const { data: adminDept } = await supabase
                        .from('departments')
                        .select('id, department_code')
                        .eq('department_code', 'hospital_admin')
                        .single()

                    if (adminDept) {
                        departmentId = adminDept.id
                        departmentCode = adminDept.department_code
                    }
                }
            }

            console.log('[MenuStore] Effective Context -> Role:', roleId, 'Dept:', departmentCode, 'DeptID:', departmentId)

            // 3. Fetch ALL Menus and ALL Role Permissions (Filter in JS for reliability)
            const { data: allMenus, error: allMenusError } = await supabase
                .from('menus')
                .select('*')
                .order('order_index', { ascending: true })

            if (allMenusError) {
                throw new Error(`Failed to load menus: ${allMenusError.message}`)
            }
            console.log('[MenuStore] Total Raw Menus in DB:', allMenus.length)

            const { data: allRoleAccess, error: allAccessError } = await supabase
                .from('role_menu_access')
                .select('menu_id, can_view')
                .eq('role_id', roleId)
                .eq('can_view', true)

            if (allAccessError) {
                throw new Error(`Failed to load permissions: ${allAccessError.message}`)
            }
            console.log('[MenuStore] Permissions found for this role:', allRoleAccess.length)

            // 5. Filter and Map in Javascript
            const permissionSet = new Set(allRoleAccess.map(a => a.menu_id))

            const filteredMenus = allMenus.filter(menu => {
                const hasPermission = permissionSet.has(menu.id)
                const isDeptMatched = !menu.allowed_department_id || menu.allowed_department_id === departmentId
                return hasPermission && isDeptMatched
            })

            console.log('[MenuStore] Filtered Menus count:', filteredMenus.length)
            if (filteredMenus.length === 0) {
                console.error('[MenuStore] CRITICAL: Zero menus passed filters. Role ID:', roleId, 'Dept ID:', departmentId)
            }

            // 6. Build Hierarchy
            const menuMap = new Map<string, MenuItem>()
            const rootMenus: MenuItem[] = []

            filteredMenus.forEach(menu => {
                menuMap.set(menu.id, { ...menu, children: [] })
            })

            filteredMenus.forEach(menu => {
                const menuItem = menuMap.get(menu.id)!
                if (menu.parent_id && menuMap.has(menu.parent_id)) {
                    const parent = menuMap.get(menu.parent_id)!
                    if (!parent.children) parent.children = []
                    parent.children.push(menuItem)
                } else {
                    rootMenus.push(menuItem)
                }
            })

            const sortMenusRecursive = (items: MenuItem[]) => {
                items.sort((a, b) => a.order_index - b.order_index)
                items.forEach(child => {
                    if (child.children?.length) sortMenusRecursive(child.children)
                })
            }
            sortMenusRecursive(rootMenus)

            // 7. Applying Presentation Wrapping for Department Header
            const deptLabels: Record<string, string> = {
                'pharmacy_logistics': 'Pharmacy Logistics',
                'hospital_admin': 'Hospital Administration',
                'system_admin': 'System Administration',
                'emergency_trauma': 'Emergency & Trauma'
            }

            const headerLabel = departmentCode ? deptLabels[departmentCode] || departmentCode.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : null

            if (headerLabel) {
                console.log(`[MenuStore] Applying Header wrapper for: ${headerLabel}`)
                const rootHeader: MenuItem = {
                    id: `header-${departmentCode}`,
                    label: headerLabel,
                    path: '#',
                    icon: departmentCode === 'hospital_admin' || departmentCode === 'system_admin' ? 'Shield' : 'Package',
                    parent_id: null,
                    order_index: 0,
                    is_core: true,
                    allowed_department_id: departmentId,
                    module_code: departmentCode,
                    isHeader: true,
                    children: rootMenus
                }
                set({ menus: [rootHeader], isLoading: false })
            } else {
                set({ menus: rootMenus, isLoading: false })
            }

            console.log('[MenuStore] === END FETCH SUCCESS ===')

        } catch (error) {
            console.error('[MenuStore] FATAL ERROR:', error)
            set({
                error: error instanceof Error ? error.message : 'Unknown fatal error',
                isLoading: false,
                menus: []
            })
        }
    },

    clearMenus: () => {
        set({ menus: [], error: null })
    },
}))

// Helper hook to get menus
export const useMenus = () => useMenuStore((state) => state.menus)
export const useMenusLoading = () => useMenuStore((state) => state.isLoading)
