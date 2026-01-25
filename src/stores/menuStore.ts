import { create } from 'zustand'
import { supabase } from '@/services/supabase'

// ============================================================================
// PERSISTENT MENU CACHE (localStorage)
// Eliminates network fetch on every page load - shows menus instantly from cache
// ============================================================================
const MENU_CACHE_KEY = 'home-menus-cache'
const MENU_CACHE_TTL_MS = 30 * 60 * 1000  // 30 minutes - long enough for session, short enough for permission updates

interface CachedMenuData {
    menus: MenuItem[]
    userId: string
    roleCode: string
    departmentCode: string
    timestamp: number
}

/**
 * Load menus from localStorage if valid for this user/role/department
 */
function loadCachedMenus(userId: string, roleCode: string, deptCode: string): MenuItem[] | null {
    try {
        const cached = localStorage.getItem(MENU_CACHE_KEY)
        if (!cached) return null

        const data: CachedMenuData = JSON.parse(cached)

        // Validate cache is for THIS user (prevents cross-user cache issues)
        if (data.userId !== userId) {
            console.log('[MenuCache] Cache invalid: different user')
            return null
        }

        // Validate role hasn't changed (permission scope change)
        if (data.roleCode !== roleCode) {
            console.log('[MenuCache] Cache invalid: role changed')
            return null
        }

        // Validate department hasn't changed
        if (data.departmentCode !== deptCode) {
            console.log('[MenuCache] Cache invalid: department changed')
            return null
        }

        // Check TTL (stale cache)
        if (Date.now() - data.timestamp > MENU_CACHE_TTL_MS) {
            console.log('[MenuCache] Cache expired (TTL exceeded)')
            return null
        }

        console.log(`[MenuCache] Valid cache found (${data.menus.length} items, age: ${Math.round((Date.now() - data.timestamp) / 1000)}s)`)
        return data.menus
    } catch (err) {
        console.warn('[MenuCache] Failed to load cache:', err)
        return null
    }
}

/**
 * Save menus to localStorage after successful fetch
 */
function saveCachedMenus(menus: MenuItem[], userId: string, roleCode: string, deptCode: string): void {
    try {
        const data: CachedMenuData = {
            menus,
            userId,
            roleCode,
            departmentCode: deptCode,
            timestamp: Date.now()
        }
        localStorage.setItem(MENU_CACHE_KEY, JSON.stringify(data))
        console.log(`[MenuCache] Saved ${menus.length} items to cache`)
    } catch (err) {
        console.warn('[MenuCache] Failed to save cache:', err)
    }
}

/**
 * Clear menu cache (call on logout or role change)
 */
function clearCachedMenus(): void {
    try {
        localStorage.removeItem(MENU_CACHE_KEY)
        console.log('[MenuCache] Cache cleared')
    } catch (err) {
        console.warn('[MenuCache] Failed to clear cache:', err)
    }
}

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
    { id: 'settings', label: 'System Settings', path: '/admin/settings', icon: 'Settings', parent_id: null, order_index: 7, is_core: true, allowed_department_id: null, module_code: 'admin.settings', children: [] },
]

const FALLBACK_PHARMACY_MENUS: MenuItem[] = [
    { id: 'dash', label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', parent_id: null, order_index: 0, is_core: true, allowed_department_id: null, module_code: 'dashboard', children: [] },
    { id: 'purchasing', label: 'Purchasing', path: '/c/purchasing', icon: 'ShoppingCart', parent_id: null, order_index: 1, is_core: true, allowed_department_id: null, module_code: 'procurement', children: [] },
    { id: 'receiving', label: 'Received Item', path: '/pharmacy/procurement/received-items', icon: 'Truck', parent_id: null, order_index: 2, is_core: true, allowed_department_id: null, module_code: 'receiving', children: [] },
    { id: 'inventory', label: 'Inventory', path: '/c/inventory', icon: 'Package', parent_id: null, order_index: 3, is_core: true, allowed_department_id: null, module_code: 'inventory', children: [] },
    { id: 'dispensing', label: 'Dispensing', path: '/c/dispensing', icon: 'Pill', parent_id: null, order_index: 4, is_core: true, allowed_department_id: null, module_code: 'dispensing', children: [] },
    { id: 'reports', label: 'Reports', path: '/c/reports', icon: 'BarChart3', parent_id: null, order_index: 5, is_core: true, allowed_department_id: null, module_code: 'reports', children: [] },
]

const FALLBACK_LAB_MENUS: MenuItem[] = [
    { id: 'dash', label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', parent_id: null, order_index: 0, is_core: true, allowed_department_id: null, module_code: 'dashboard', children: [] },
    { id: 'lab-samples', label: 'Sample Collection', path: '/lab/samples', icon: 'TestTube', parent_id: null, order_index: 1, is_core: true, allowed_department_id: null, module_code: 'lab.samples', children: [] },
    { id: 'lab-processing', label: 'Lab Processing', path: '/lab/processing', icon: 'Microscope', parent_id: null, order_index: 2, is_core: true, allowed_department_id: null, module_code: 'lab.processing', children: [] },
    { id: 'lab-results', label: 'Lab Results', path: '/lab/results', icon: 'FileText', parent_id: null, order_index: 3, is_core: true, allowed_department_id: null, module_code: 'lab.results', children: [] },
    { id: 'lab-reports', label: 'Lab Reports', path: '/lab/reports', icon: 'BarChart3', parent_id: null, order_index: 4, is_core: true, allowed_department_id: null, module_code: 'lab.reports', children: [] },
]

const FALLBACK_GENERIC_MENUS: MenuItem[] = [
    { id: 'dash', label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', parent_id: null, order_index: 0, is_core: true, allowed_department_id: null, module_code: 'dashboard', children: [] },
    { id: 'profile', label: 'My Profile', path: '/profile', icon: 'User', parent_id: null, order_index: 1, is_core: true, allowed_department_id: null, module_code: 'profile', children: [] },
]

export const useMenuStore = create<MenuState>((set, get) => ({
    menus: [],
    isLoading: false,
    isInitialized: false,
    error: null,

    fetchMenus: async (userId: string, options?: { roleCode?: string, departmentCode?: string, departmentName?: string, user?: any }) => {
        // Prevent duplicate calls
        if (get().isLoading) return

        // Resolve context early for cache key
        const roleCode = options?.roleCode || options?.user?.role?.role_code || ''
        const deptCode = options?.departmentCode || options?.user?.department?.department_code || ''

        // PHASE 1: OPTIMISTIC CACHE - Show menus instantly from localStorage
        // This eliminates the "keep refreshing" problem by showing cached menus immediately
        const state = get()
        const hasMenusInMemory = state.menus.length > 0
        const lastFetch = (state as any).lastFetchTime || 0
        const MEMORY_CACHE_TTL = 5 * 60 * 1000

        // If we have fresh menus in memory, skip network entirely
        if (hasMenusInMemory && (Date.now() - lastFetch < MEMORY_CACHE_TTL) && !options?.user) {
            console.log('[MenuStore] Returning in-memory cached menus (fresh)')
            return
        }

        // Try localStorage cache first (persists across page reloads)
        if (!hasMenusInMemory && !state.isInitialized) {
            const cachedMenus = loadCachedMenus(userId, roleCode, deptCode)
            if (cachedMenus && cachedMenus.length > 0) {
                console.log('[MenuStore] INSTANT: Showing localStorage cached menus')
                // @ts-ignore
                set({ menus: cachedMenus, isLoading: false, isInitialized: true, lastFetchTime: Date.now() })
                // Continue to background refresh below
            }
        }

        // If we already have menus (from cache), do a background refresh silently
        const isBackgroundRefresh = get().menus.length > 0
        if (!isBackgroundRefresh) {
            set({ isLoading: true, error: null })
        } else {
            console.log('[MenuStore] Background refresh: user can continue using cached menus')
        }

        let attempts = 0
        const maxAttempts = 3

        while (attempts < maxAttempts) {
            try {
                attempts++
                console.log(`[MenuStore] Fetching menus for user: ${userId} (Attempt ${attempts}/${maxAttempts})`)

                // 1. Resolve User Context
                let effectiveRoleCode = options?.roleCode || options?.user?.role?.role_code
                let effectiveDeptCode = options?.departmentCode || options?.user?.department?.department_code

                let effectiveRoleId = options?.user?.role_id
                let effectiveDeptId = options?.user?.department_id

                // Inspect role name and department name for robust fallback detection
                const effectiveRoleName = options?.user?.role?.role_name || ''
                const effectiveDeptName = options?.departmentName || options?.user?.department?.department_name || ''

                // Fetch user from DB if crucial info is missing
                if (!effectiveRoleCode || !effectiveDeptCode || !effectiveRoleId) {
                    // Set a timeout for the user fetch
                    const userPromise = supabase
                        .from('users')
                        .select('role_id, department_id, role:roles(role_code, role_name), department:departments(department_code, department_name)')
                        .eq('id', userId)
                        .single()

                    // PHASE 2: Extended timeout to 20s for slow networks/cold starts
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('User data fetch timed out')), 20000)
                    )

                    try {
                        const result: any = await Promise.race([userPromise, timeoutPromise])

                        if (result.error) {
                            console.warn('[MenuStore] User detail fetch error:', result.error.message)
                            // Soft fail: continue with whatever info we have in context
                        } else if (result.data) {
                            const userData = result.data
                            const roleData: any = userData.role;
                            const deptData: any = userData.department;
                            effectiveRoleCode = effectiveRoleCode || (Array.isArray(roleData) ? roleData[0]?.role_code : roleData?.role_code);
                            effectiveDeptCode = effectiveDeptCode || (Array.isArray(deptData) ? deptData[0]?.department_code : deptData?.department_code);
                            effectiveRoleId = effectiveRoleId || userData.role_id;
                            effectiveDeptId = effectiveDeptId || userData.department_id;
                            // Capture department name if not provided
                            if (!options?.departmentName && deptData) {
                                const dName = Array.isArray(deptData) ? deptData[0]?.department_name : deptData?.department_name;
                                if (dName) options = { ...options, departmentName: dName };
                            }
                        }
                    } catch (err) {
                        console.warn('[MenuStore] User detail fetch timed out (soft fail), proceeding with partial context')
                    }
                }

                // Resolve Department Name for display
                const displayDeptName = options?.departmentName || options?.user?.department?.department_name || effectiveDeptName || 'Department';

                const normalizedRole = effectiveRoleCode?.toLowerCase().replace(/\s+/g, '_') || ''
                const isAdmin = normalizedRole === 'hospital_admin' || normalizedRole === 'system_admin'

                // ROBUST PHARMACY DETECTION
                // Check role code, role name, AND department name
                const isPharmacyRole = normalizedRole === 'pharmacist' || normalizedRole === 'assistant_pharmacist' ||
                    effectiveRoleName.toLowerCase().includes('pharmacist');
                const isPharmacyDept = effectiveDeptName.toLowerCase().includes('pharmacy');
                const isPharmacy = isPharmacyRole || isPharmacyDept;

                console.log(`[MenuStore] Context - Role: ${normalizedRole}, RoleName: ${effectiveRoleName}, Dept: ${displayDeptName}, IsAdmin: ${isAdmin}, IsPharmacy: ${isPharmacy}`)

                // 2. Parallel Fetch: Menus Structure & Permissions
                // PHASE 2: Extended timeout to 30s for better resilience with slow networks
                const timeoutMs = 30000

                const menusQuery = supabase
                    .from('menus')
                    .select('id, label, path, icon, parent_id, order_index, is_core, allowed_department_id, module_code')
                    .order('order_index')

                const rpcQuery = !isAdmin
                    ? supabase.rpc('get_staff_accessible_modules', { p_staff_id: userId })
                    : Promise.resolve({ data: [], error: null }) // Admins don't need this

                // Create timeout promises
                const timeoutPromise = (ms: number, name: string) => new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`${name} timed out`)), ms)
                )

                // Execute in parallel with allSettled
                const [menusResult, rpcResult] = await Promise.allSettled([
                    // Wrap menus query with timeout
                    Promise.race([menusQuery, timeoutPromise(timeoutMs, 'Menus fetch')]),
                    // Wrap RPC query with timeout
                    Promise.race([rpcQuery, timeoutPromise(timeoutMs, 'Permissions fetch')])
                ])

                // Handle Menus Result (Critical)
                if (menusResult.status === 'rejected') {
                    throw new Error(`Menus fetch failed: ${menusResult.reason.message}`)
                }
                // @ts-ignore
                if (menusResult.value.error) {
                    // @ts-ignore
                    throw new Error(`Menus DB failed: ${menusResult.value.error.message}`)
                }

                // Handle RPC Result (Non-Critical / Soft Fail)
                let accessibleModules: any[] = []
                if (rpcResult.status === 'fulfilled') {
                    const val = rpcResult.value as any
                    if (val.error) {
                        console.warn(`[MenuStore] Permissions fetch failed (soft fail): ${val.error.message}`)
                    } else {
                        accessibleModules = val.data || []
                    }
                } else {
                    console.warn(`[MenuStore] Permissions fetch timed out/failed (soft fail): ${rpcResult.reason}`)
                }

                // @ts-ignore
                const allMenus = menusResult.value.data
                let accessibleModuleCodes = new Set<string>()

                if (!isAdmin) {
                    if (accessibleModules.length > 0) {
                        accessibleModules.forEach((m: any) => accessibleModuleCodes.add(m.module_code))
                    } else {
                        // If RPC returned nothing OR failed, we might want to fallback to implicit roles
                        // Logging for debug, but we will proceed to Role/Dept Check below
                        console.log('[MenuStore] No explicit module permissions found (or RPC failed). Relying on role/dept logic.')
                    }
                }

                // 4. Filter and Map Menus
                // Helper: Normalize accessible codes
                const normalizedAccessibleCodes = new Set(accessibleModuleCodes)

                // CRITICAL: Always whitelist core modules that don't need explicit permissions
                // This ensures 'based on permission' logic works but dashboard is always available
                normalizedAccessibleCodes.add('dashboard')
                normalizedAccessibleCodes.add('profile')

                accessibleModuleCodes.forEach(code => {
                    if (code.includes('.')) {
                        const parts = code.split('.')
                        if (parts.length === 2) normalizedAccessibleCodes.add(parts[1])
                    }
                })

                // Pass 1: Identify directly accessible menu IDs
                const directlyAccessibleMenuIds = new Set<string>()

                // console.log('[MenuStore] Normalized Accessible Modules:', Array.from(normalizedAccessibleCodes))

                allMenus?.forEach((m: any) => {
                    const code = m.module_code
                    if (!code) return

                    let isAccessible = false

                    // Admin Logic
                    if (isAdmin) {
                        isAccessible = code === 'hospital_admin' || code === 'system_admin' || code === 'dashboard'
                    }
                    // Regular Role Logic - Trust the RPC!
                    else {
                        // CRITICAL: Check if this is a whitelisted core module first
                        const coreWhitelist = ['dashboard', 'profile']
                        if (coreWhitelist.includes(code)) {
                            isAccessible = true
                        } else if (normalizedAccessibleCodes.has(code) ||
                            normalizedAccessibleCodes.has(`pharmacy.${code}`) ||
                            normalizedAccessibleCodes.has(`admin.${code}`)) {
                            isAccessible = true
                        }
                    }

                    if (isAccessible) {
                        directlyAccessibleMenuIds.add(m.id)
                    }
                })

                // console.log('[MenuStore] Directly Accessible IDs:', Array.from(directlyAccessibleMenuIds))

                // Pass 2: Propagate accessibility to descendants (Recursive Inheritance)
                const childrenMap = new Map<string, any[]>()
                allMenus?.forEach((m: any) => {
                    if (m.parent_id) {
                        if (!childrenMap.has(m.parent_id)) childrenMap.set(m.parent_id, [])
                        childrenMap.get(m.parent_id)!.push(m)
                    }
                })

                const finalAccessibleIds = new Set<string>(directlyAccessibleMenuIds)
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

                // Also ensure parents of accessible items are visible
                const ensureParents = (menuId: string, allMenusMap: Map<string, any>) => {
                    let currentId = menuId
                    while (true) {
                        const menu = allMenusMap.get(currentId)
                        if (!menu || !menu.parent_id) break

                        if (!finalAccessibleIds.has(menu.parent_id)) {
                            finalAccessibleIds.add(menu.parent_id)
                            currentId = menu.parent_id
                        } else {
                            break
                        }
                    }
                }

                const allMenusMap = new Map<string, any>(allMenus?.map((m: any) => [m.id, m]))
                Array.from(finalAccessibleIds).forEach(id => ensureParents(id, allMenusMap))

                const filteredMenus = allMenus?.filter((m: any) => finalAccessibleIds.has(m.id)) || []

                const menuItems: MenuItem[] = filteredMenus.map((m: any) => ({
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

                menuItems.forEach(item => {
                    menuMap.set(item.id, { ...item, children: [] })
                })

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

                // 4. Determine which menus to use
                let finalMenus = rootMenus

                // If no menus were filtered, apply safety fallbacks
                // This happens when:
                // 1. RPC returns empty (no role_permissions) AND logic filtered everything out
                // 2. We're in a dev environment with broken data
                if (finalMenus.length === 0 && !isAdmin) {
                    console.warn('[MenuStore] No accessible menus found after filtering - applying role/department fallback')

                    // NEW: Department-based fallback for roles without explicit permissions
                    // This handles cases like 'Medical Laboratory Technologist' where role_permissions might be missing
                    const normalizedDeptName = effectiveDeptName?.toLowerCase() || ''
                    // Check department name or role name
                    if (normalizedDeptName.includes('pathology') || normalizedDeptName.includes('laboratory') || normalizedRole === 'medical_laboratory_technologist') {
                        finalMenus = FALLBACK_LAB_MENUS
                        // Also ensure implicit pharmacy access if needed
                    } else if (normalizedDeptName.includes('pharmacy') || isPharmacy) {
                        finalMenus = FALLBACK_PHARMACY_MENUS
                    } else {
                        // Generic fallback (Dashboard + Profile)
                        finalMenus = FALLBACK_GENERIC_MENUS
                    }
                    console.log(`[MenuStore] Applied fallback menus based on context (Dept: ${normalizedDeptName}, Role: ${normalizedRole})`)
                }

                // If STILL no menus (shouldn't happen due to logic above, but for safety), apply strict fallback
                if (finalMenus.length === 0) {
                    // Note: With 'dashboard' whitelist, this should rarely happen unless menus table is empty/broken
                    if (isAdmin) {
                        finalMenus = FALLBACK_ADMIN_MENUS
                    } else if (isPharmacy) {
                        finalMenus = FALLBACK_PHARMACY_MENUS
                    } else if (normalizedRole === 'medical_laboratory_technologist') {
                        finalMenus = FALLBACK_LAB_MENUS
                    } else {
                        // For generic departments, if we have 0 menus despite dashboard whitelist, 
                        // it means database is likely broken or dashboard menu item missing.
                        // We use generic fallback as absolute last resort.
                        finalMenus = FALLBACK_GENERIC_MENUS
                    }
                    console.log('[MenuStore] Applying fallback menus:', finalMenus.length, 'items')
                }

                // 5. Wrap in Department Header
                let headerTitle = ''
                let headerIcon = 'Package'

                if (isAdmin) {
                    headerTitle = 'Hospital Administration'
                    headerIcon = 'Shield'
                } else if (isPharmacy) {
                    headerTitle = 'Pharmacy Logistics'
                    headerIcon = 'Pill'
                } else if (normalizedRole === 'medical_laboratory_technologist') {
                    headerTitle = 'Pathology Laboratory'
                    headerIcon = 'Microscope'
                } else if (finalMenus.length > 0) {
                    // Generic header - Use Department Name
                    headerTitle = displayDeptName !== 'Department' ? displayDeptName : 'Navigation'
                    headerIcon = 'Building2'
                }

                if (headerTitle && finalMenus.length > 0) {
                    const rootHeader: MenuItem = {
                        id: 'dept-header',
                        label: headerTitle,
                        path: '#',
                        icon: headerIcon,
                        parent_id: null,
                        order_index: 0,
                        is_core: true,
                        allowed_department_id: null,
                        module_code: 'header',
                        isHeader: true,
                        children: finalMenus
                    }
                    console.log('[MenuStore] Setting menus with header:', headerTitle, 'Children:', finalMenus.length)
                    const finalMenusToSet = [rootHeader]
                    // PHASE 1: Persist to localStorage for instant loading on next page load
                    saveCachedMenus(finalMenusToSet, userId, normalizedRole, effectiveDeptCode || '')
                    // @ts-ignore - Adding custom property for cache tracking
                    set({ menus: finalMenusToSet, isLoading: false, isInitialized: true, error: null, lastFetchTime: Date.now() })
                } else {
                    console.log('[MenuStore] Setting menus without header:', finalMenus.length, 'items')
                    // PHASE 1: Persist to localStorage for instant loading on next page load
                    saveCachedMenus(finalMenus, userId, normalizedRole, effectiveDeptCode || '')
                    // @ts-ignore
                    set({ menus: finalMenus, isLoading: false, isInitialized: true, error: null, lastFetchTime: Date.now() })
                }

                return

            } catch (error: any) {
                console.error(`[MenuStore] Attempt ${attempts} failed:`, error)

                if (attempts >= maxAttempts) {
                    const errorMsg = error.message || 'Failed to fetch menus'
                    let finalMenus: MenuItem[] = []

                    // Emergency fallback logic in catch block
                    const effectiveRole = (options?.roleCode || options?.user?.role?.role_code || '').toLowerCase().replace(/\s+/g, '_')

                    if (effectiveRole === 'hospital_admin' || effectiveRole === 'system_admin') {
                        finalMenus = FALLBACK_ADMIN_MENUS
                    } else if (effectiveRole === 'pharmacist' || effectiveRole === 'assistant_pharmacist') {
                        finalMenus = FALLBACK_PHARMACY_MENUS
                    } else if (effectiveRole === 'medical_laboratory_technologist') {
                        finalMenus = FALLBACK_LAB_MENUS
                    } else {
                        finalMenus = FALLBACK_GENERIC_MENUS
                    }

                    if (get().menus.length > 0 && finalMenus.length === 0) {
                        finalMenus = get().menus
                        console.log('[MenuStore] Keeping cached menus despite error')
                    }

                    set({
                        error: errorMsg,
                        isLoading: false,
                        isInitialized: true,
                        menus: finalMenus
                    })
                } else {
                    // PHASE 2: Exponential backoff: 2s, 4s, 8s (more resilient to transient failures)
                    const waitTime = 2000 * Math.pow(2, attempts - 1)
                    console.log(`[MenuStore] Retrying in ${waitTime}ms... (attempt ${attempts}/${maxAttempts})`)
                    await new Promise(resolve => setTimeout(resolve, waitTime))
                }
            }
        }
    },
    clearMenus: () => {
        // PHASE 1: Clear localStorage cache on logout/role change
        clearCachedMenus()
        // @ts-ignore
        set({ menus: [], error: null, isLoading: false, isInitialized: false, lastFetchTime: 0 })
    },
}))

export const useMenus = () => useMenuStore((state) => state.menus)
export const useMenusLoading = () => useMenuStore((state) => state.isLoading)
export const useIsMenusInitialized = () => useMenuStore((state) => state.isInitialized)
