// @ts-nocheck
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import { loadFacilityDrugInventory } from '@/services/pharmacy/facilityDrugInventoryService'
import { loadFacilityNonDrugInventory } from '@/services/pharmacy/facilityNonDrugInventoryService'
import { issueStock, resolveOrCreateStockBatch, normalizeItemCode } from '@/modules/inventory/services/inventoryService'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  IndentRequest,
  IndentRequestWithRelations,
  IndentRequestItem,
  IndentEntitlement,
  IndentFilter,
} from '@/types/pharmacy'

// Mock Departments for Fallback
export const mockDepartments = [
  { id: 'dept-nephro', department_name: 'Nephrology', department_code: 'NEPH' },
  { id: 'dept-cardio', department_name: 'Cardiology Clinic', department_code: 'CARD' },
  { id: 'dept-emer', department_name: 'Emergency & Trauma Department', department_code: 'EMER' },
  { id: 'dept-icu', department_name: 'Intensive Care Unit (ICU)', department_code: 'ICU' },
  { id: 'dept-peds', department_name: 'Paediatric Ward', department_code: 'PED' },
  { id: 'dept-ortho', department_name: 'Orthopaedic Clinic', department_code: 'ORTH' },
  { id: 'dept-genward', department_name: 'General Ward', department_code: 'GW' },
  { id: 'dept-matward', department_name: 'Maternity Ward', department_code: 'MAT' },
  { id: 'dept-pakar', department_name: 'Klinik Pakar', department_code: 'KP' },
  { id: 'dept-lab', department_name: 'Laboratory', department_code: 'LAB' },
]

// Local storage helpers for entitlements
const ENTITLEMENTS_STORAGE_PREFIX = 'hom_indent_entitlements_'

function readLocalEntitlements(hospitalId: string = 'hosp-1'): IndentEntitlement[] {
  try {
    const raw = localStorage.getItem(`${ENTITLEMENTS_STORAGE_PREFIX}${hospitalId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeLocalEntitlements(hospitalId: string = 'hosp-1', items: IndentEntitlement[]) {
  try {
    localStorage.setItem(`${ENTITLEMENTS_STORAGE_PREFIX}${hospitalId}`, JSON.stringify(items))
  } catch {}
}

// In-memory fallback (initialized from local storage or empty)
let mockEntitlements: IndentEntitlement[] = []

// Mock Indent Requests - Empty initial state as requested
let mockIndentRequests: IndentRequestWithRelations[] = []

export const isSoftwareModule = (code?: string, name?: string): boolean => {
  const c = (code || '').toLowerCase().trim()
  const n = (name || '').toLowerCase().trim()

  const MODULE_KEYWORDS = [
    'mycuti',
    'mystaff',
    'myformulari',
    'mykunci',
    'myperhimpunan',
    'myporter',
    'mytransporter',
    'mywarrant',
    'mysuhu',
    'mymsds',
    'myphis',
    'mycrossborder',
    'mypriviledging',
    'mytempahan',
    'system_',
  ]

  if (MODULE_KEYWORDS.some((m) => c.includes(m) || n.includes(m))) return true
  if (['billing', 'hr', 'asset', 'reports', 'driver_room', 'hospital_office', 'front_desk'].includes(c)) return true

  return false
}

/**
 * Get Departments list (filtered of modules and deduplicated, Haemodialysis mapped to Nephrology)
 */
export async function getDepartments(hospitalId?: string): Promise<ApiResponse<any[]>> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('departments')
        .select('*')
        .eq('status', 'active')
        .order('department_name', { ascending: true })

      if (hospitalId) {
        query = query.eq('hospital_id', hospitalId)
      }

      const { data, error } = await query

      if (!error && data && data.length > 0) {
        const filtered = data.filter((d) => !isSoftwareModule(d.department_code, d.department_name))
        const seen = new Set<string>()
        const deDuplicated = []
        for (const dept of filtered) {
          let name = dept.department_name
          if (name?.toLowerCase().includes('haemodialysis') || dept.department_code?.toLowerCase() === 'haemodialysis') {
            name = 'Nephrology'
          }
          const norm = (name || '').toLowerCase().trim()
          if (!seen.has(norm)) {
            seen.add(norm)
            deDuplicated.push({
              ...dept,
              department_name: name,
            })
          }
        }
        if (deDuplicated.length > 0) {
          return { data: deDuplicated, error: null }
        }
      }
    }
    return { data: mockDepartments, error: null }
  } catch (err) {
    return { data: mockDepartments, error: null }
  }
}

function isValidUUID(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
}

/**
 * Get Indent Entitlements for a Department / Hospital
 */
export async function getIndentEntitlements(
  hospitalId: string,
  departmentId?: string
): Promise<ApiResponse<IndentEntitlement[]>> {
  try {
    if (isSupabaseConfigured() && isValidUUID(hospitalId)) {
      let shouldQuery = true
      let query = supabase
        .from('distribution_indent_entitlements')
        .select(
          `
          *,
          department:departments(department_name)
        `
        )
        .eq('hospital_id', hospitalId)

      if (departmentId && departmentId !== 'all') {
        if (isValidUUID(departmentId)) {
          query = query.eq('department_id', departmentId)
        } else {
          shouldQuery = false
        }
      }

      if (shouldQuery) {
        const { data, error } = await query.order('created_at', { ascending: false })
        if (!error && data) {
          // Sync local storage cache
          writeLocalEntitlements(hospitalId, data as IndentEntitlement[])
          return { data: data as IndentEntitlement[], error: null }
        }
      }
    }

    // Fallback Local Storage / Offline Entitlements (strictly filtered by department)
    const localItems = readLocalEntitlements(hospitalId)
    if (!departmentId || departmentId === 'all') {
      return { data: localItems, error: null }
    }

    const filtered = localItems.filter((e) => e.department_id === departmentId)
    return { data: filtered, error: null }
  } catch (error) {
    const localItems = readLocalEntitlements(hospitalId)
    return { data: localItems, error: null }
  }
}

/**
 * Check if the user is authorized to approve/reject an indent request.
 * Superadmins/Hospital Admins have universal clearance.
 * Otherwise, the user must belong to the intended fulfilling/recipient department.
 */
export function canUserApproveIndent(user: any, request: IndentRequestWithRelations | null): boolean {
  if (!user || !request) return false

  // Safely extract role name string
  let roleStr = ''
  if (typeof user.role === 'string') {
    roleStr = user.role
  } else if (user.role && typeof user.role === 'object') {
    roleStr = user.role.name || user.role.role_name || user.role.code || ''
  } else if (typeof (user as any).role_name === 'string') {
    roleStr = (user as any).role_name
  }
  roleStr = String(roleStr || '').toLowerCase()

  if (
    roleStr.includes('superadmin') ||
    roleStr.includes('system_admin') ||
    roleStr.includes('admin') ||
    roleStr.includes('director') ||
    roleStr === 'super_admin' ||
    roleStr === 'hospital_admin'
  ) {
    return true
  }

  const userDeptId =
    user.department_id ||
    (user.department && typeof user.department === 'object' ? user.department.id : undefined)

  // If fulfilling_department_id is set on the request, compare department ID
  if (request.fulfilling_department_id && userDeptId) {
    return String(userDeptId) === String(request.fulfilling_department_id)
  }

  // Also check department name / code matching
  let userDeptName = ''
  if (typeof user.department === 'string') {
    userDeptName = user.department
  } else if (user.department && typeof user.department === 'object') {
    userDeptName = user.department.department_name || user.department.name || user.department.code || ''
  } else if (typeof (user as any).department_name === 'string') {
    userDeptName = (user as any).department_name
  }
  userDeptName = String(userDeptName || '').toLowerCase()

  const targetDeptName = String(request.fulfilling_department?.department_name || '').toLowerCase()
  if (targetDeptName && userDeptName) {
    if (userDeptName.includes(targetDeptName) || targetDeptName.includes(userDeptName)) {
      return true
    }
  }

  // If no fulfilling_department_id is explicitly set (legacy), default to pharmacy staff
  if (!request.fulfilling_department_id) {
    return userDeptName.includes('pharm') || userDeptName.includes('logis') || userDeptName.includes('stor')
  }

  return false
}

/**
 * Get all indent requests with filtering and pagination
 */
export async function getIndentRequests(
  hospitalId: string,
  filter?: IndentFilter,
  page: number = 1,
  pageSize: number = 15
): Promise<ApiResponse<PaginatedResponse<IndentRequestWithRelations>>> {
  try {
    if (isSupabaseConfigured()) {
      const validHospId = (hospitalId && isValidUUID(hospitalId)) ? hospitalId : '85bb6adc-b868-428b-83f4-e5af2f5cf904'
      let query = supabase
        .from('distribution_indent_requests')
        .select(
          `
          *,
          requesting_department:departments!requesting_department_id(id, department_name),
          fulfilling_department:departments!fulfilling_department_id(id, department_name),
          items:distribution_indent_request_items(*)
        `,
          { count: 'exact' }
        )
        .or(`hospital_id.eq.${validHospId},hospital_id.is.null`)

      if (filter?.search) {
        query = query.ilike('indent_number', `%${filter.search.trim()}%`)
      }
      if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status)
      }
      if (filter?.priority && filter.priority !== 'all') {
        query = query.eq('priority', filter.priority)
      }
      if (filter?.department_id && filter.department_id !== 'all' && isValidUUID(filter.department_id)) {
        query = query.eq('requesting_department_id', filter.department_id)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (!error && data) {
        // Hydrate user names for requested_by and approved_by
        const userIds = new Set<string>()
        data.forEach((row: any) => {
          if (row.requested_by && isValidUUID(row.requested_by)) userIds.add(row.requested_by)
          if (row.approved_by && isValidUUID(row.approved_by)) userIds.add(row.approved_by)
        })

        if (userIds.size > 0) {
          try {
            const { data: usersData } = await supabase
              .from('users')
              .select('id, full_name')
              .in('id', Array.from(userIds))

            if (usersData) {
              const userMap = new Map<string, string>()
              usersData.forEach((u: any) => userMap.set(u.id, u.full_name || 'Staff'))
              data.forEach((row: any) => {
                if (row.requested_by && userMap.has(row.requested_by)) {
                  row.requester = { full_name: userMap.get(row.requested_by) }
                }
                if (row.approved_by && userMap.has(row.approved_by)) {
                  row.approver = { full_name: userMap.get(row.approved_by) }
                }
              })
            }
          } catch (uErr) {
            console.warn('Could not hydrate user names:', uErr)
          }
        }

        return {
          data: {
            data: data as IndentRequestWithRelations[],
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
          },
          error: null,
        }
      }
    }

    // Fallback Mock Filtering
    let list = [...mockIndentRequests]

    if (filter?.search) {
      const q = filter.search.toLowerCase()
      list = list.filter(
        (item) =>
          item.indent_number.toLowerCase().includes(q) ||
          item.requesting_department?.department_name.toLowerCase().includes(q)
      )
    }

    if (filter?.status && filter.status !== 'all') {
      list = list.filter((item) => item.status === filter.status)
    }

    if (filter?.priority && filter.priority !== 'all') {
      list = list.filter((item) => item.priority === filter.priority)
    }

    if (filter?.department_id && filter.department_id !== 'all') {
      list = list.filter((item) => item.requesting_department_id === filter.department_id)
    }

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const total = list.length
    const totalPages = Math.ceil(total / pageSize) || 1
    const start = (page - 1) * pageSize
    const paginated = list.slice(start, start + pageSize)

    return {
      data: {
        data: paginated,
        total,
        page,
        pageSize,
        totalPages,
      },
      error: null,
    }
  } catch (error) {
    console.error('Error in getIndentRequests:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to load indent requests',
    }
  }
}

/**
 * Get Single Indent Request by ID
 */
export async function getIndentRequestById(
  id: string
): Promise<ApiResponse<IndentRequestWithRelations>> {
  try {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      const { data, error } = await supabase
        .from('distribution_indent_requests')
        .select(
          `
          *,
          requesting_department:departments!requesting_department_id(id, department_name),
          fulfilling_department:departments!fulfilling_department_id(id, department_name),
          items:distribution_indent_request_items(*)
        `
        )
        .eq('id', id)
        .maybeSingle()

      if (!error && data) {
        const item = data as IndentRequestWithRelations
        const userIds = new Set<string>()
        if (item.requested_by && isValidUUID(item.requested_by)) userIds.add(item.requested_by)
        if (item.approved_by && isValidUUID(item.approved_by)) userIds.add(item.approved_by)

        if (userIds.size > 0) {
          try {
            const { data: usersData } = await supabase
              .from('users')
              .select('id, full_name')
              .in('id', Array.from(userIds))

            if (usersData) {
              const userMap = new Map<string, string>()
              usersData.forEach((u: any) => userMap.set(u.id, u.full_name || 'Staff'))
              if (item.requested_by && userMap.has(item.requested_by)) {
                item.requester = { full_name: userMap.get(item.requested_by)! }
              }
              if (item.approved_by && userMap.has(item.approved_by)) {
                item.approver = { full_name: userMap.get(item.approved_by)! }
              }
            }
          } catch (uErr) {
            console.warn('Could not hydrate single user names:', uErr)
          }
        }
        return { data: item, error: null }
      }
    }

    const found = mockIndentRequests.find((r) => r.id === id)
    if (found) {
      return { data: found, error: null }
    }
    return { data: null, error: 'Indent request not found' }
  } catch (error) {
    return { data: null, error: 'Failed to fetch indent request' }
  }
}

/**
 * Create Indent Request
 */
export async function createIndentRequest(
  hospitalId: string,
  userId: string,
  payload: {
    requesting_department_id: string
    fulfilling_department_id?: string
    priority: 'low' | 'normal' | 'high' | 'urgent'
    required_date?: string
    notes?: string
    submit_immediately?: boolean
    items: Array<{
      item_type: 'drug' | 'non_drug'
      item_id: string
      item_code?: string
      item_name: string
      unit?: string
      qty_requested: number
    }>
  }
): Promise<ApiResponse<IndentRequestWithRelations>> {
  try {
    const now = new Date()
    const indentNumber = `IDN-${now.getFullYear()}-${String(Date.now()).slice(-4)}`
    const initialStatus = payload.submit_immediately ? 'pending' : 'draft'

    if (isSupabaseConfigured() && isValidUUID(hospitalId) && isValidUUID(payload.requesting_department_id)) {
      const { data: header, error: headerError } = await supabase
        .from('distribution_indent_requests')
        .insert({
          indent_number: indentNumber,
          hospital_id: hospitalId,
          requesting_department_id: payload.requesting_department_id,
          fulfilling_department_id: isValidUUID(payload.fulfilling_department_id) ? payload.fulfilling_department_id : null,
          requested_by: isValidUUID(userId) ? userId : null,
          request_date: now.toISOString(),
          required_date: payload.required_date || null,
          status: initialStatus,
          priority: payload.priority,
          notes: payload.notes,
        })
        .select('*')
        .single()

      if (headerError) throw headerError

      if (payload.items && payload.items.length > 0) {
        const itemRows = payload.items.map((i) => ({
          indent_request_id: header.id,
          item_type: i.item_type,
          item_id: isValidUUID(i.item_id) ? i.item_id : crypto.randomUUID(),
          item_code: i.item_code,
          item_name: i.item_name,
          unit: i.unit || 'UNIT',
          qty_requested: i.qty_requested,
          qty_approved: i.qty_requested,
          qty_issued: 0,
        }))

        const { error: itemsError } = await supabase
          .from('distribution_indent_request_items')
          .insert(itemRows)

        if (itemsError) throw itemsError
      }

      return getIndentRequestById(header.id)
    }

    // Mock Create
    const deptObj = mockDepartments.find((d) => d.id === payload.requesting_department_id) || {
      id: payload.requesting_department_id,
      department_name: 'Department Unit',
    }

    const newId = `ind-${Date.now()}`
    const newRequest: IndentRequestWithRelations = {
      id: newId,
      indent_number: indentNumber,
      hospital_id: hospitalId,
      requesting_department_id: payload.requesting_department_id,
      requested_by: userId,
      request_date: now.toISOString(),
      required_date: payload.required_date,
      status: initialStatus,
      priority: payload.priority,
      notes: payload.notes,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      requesting_department: { id: deptObj.id, department_name: deptObj.department_name },
      requester: { full_name: 'Hospital User / Nurse' },
      items: payload.items.map((item, idx) => ({
        id: `item-${newId}-${idx}`,
        indent_request_id: newId,
        item_type: item.item_type,
        item_id: item.item_id,
        item_code: item.item_code || `ITEM-${idx + 1}`,
        item_name: item.item_name,
        unit: item.unit || 'UNIT',
        qty_requested: item.qty_requested,
        qty_approved: item.qty_requested,
        qty_issued: 0,
      })),
    }

    mockIndentRequests.unshift(newRequest)
    return { data: newRequest, error: null }
  } catch (error) {
    console.error('Error creating indent request:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create indent request',
    }
  }
}

/**
 * Delete / Cancel an Indent Request
 */
export async function deleteIndentRequest(id: string): Promise<ApiResponse<boolean>> {
  try {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      const { error } = await supabase
        .from('distribution_indent_requests')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { data: true, error: null }
    }

    const idx = mockIndentRequests.findIndex((r) => r.id === id)
    if (idx !== -1) {
      mockIndentRequests.splice(idx, 1)
    }
    return { data: true, error: null }
  } catch (error) {
    console.error('Error deleting indent request:', error)
    return {
      data: false,
      error: error instanceof Error ? error.message : 'Failed to delete indent request',
    }
  }
}

/**
 * Approve Indent Request
 */
export async function approveIndentRequest(
  id: string,
  approverId: string,
  itemApprovals?: Record<string, number>
): Promise<ApiResponse<IndentRequestWithRelations>> {
  try {
    const now = new Date().toISOString()

    if (isSupabaseConfigured() && isValidUUID(id)) {
      const updateData: any = {
        status: 'approved',
        approved_at: now,
        updated_at: now,
      }
      if (isValidUUID(approverId)) {
        updateData.approved_by = approverId
      }

      const { error } = await supabase
        .from('distribution_indent_requests')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      if (itemApprovals) {
        for (const [itemId, qty] of Object.entries(itemApprovals)) {
          if (isValidUUID(itemId)) {
            await supabase
              .from('distribution_indent_request_items')
              .update({ qty_approved: qty })
              .eq('id', itemId)
          }
        }
      }

      return getIndentRequestById(id)
    }

    // Mock Update
    const idx = mockIndentRequests.findIndex((r) => r.id === id)
    if (idx !== -1) {
      mockIndentRequests[idx].status = 'approved'
      mockIndentRequests[idx].approved_by = approverId
      mockIndentRequests[idx].approved_at = now
      mockIndentRequests[idx].updated_at = now

      if (itemApprovals && mockIndentRequests[idx].items) {
        mockIndentRequests[idx].items = mockIndentRequests[idx].items.map((item) => ({
          ...item,
          qty_approved: itemApprovals[item.id] !== undefined ? itemApprovals[item.id] : item.qty_requested,
        }))
      }
      return { data: mockIndentRequests[idx], error: null }
    }
    return { data: null, error: 'Request not found' }
  } catch (error) {
    return { data: null, error: 'Failed to approve request' }
  }
}

/**
 * Reject Indent Request
 */
export async function rejectIndentRequest(
  id: string,
  rejectorId: string,
  reason: string,
  rejectorName?: string
): Promise<ApiResponse<IndentRequestWithRelations>> {
  try {
    const now = new Date().toISOString()
    if (isSupabaseConfigured() && isValidUUID(id)) {
      const updateData: any = {
        status: 'rejected',
        rejection_reason: reason,
        updated_at: now,
      }
      if (isValidUUID(rejectorId)) {
        updateData.approved_by = rejectorId
      }

      const { error } = await supabase
        .from('distribution_indent_requests')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
      return getIndentRequestById(id)
    }

    const idx = mockIndentRequests.findIndex((r) => r.id === id)
    if (idx !== -1) {
      mockIndentRequests[idx].status = 'rejected'
      mockIndentRequests[idx].rejection_reason = reason
      mockIndentRequests[idx].approved_by = rejectorId
      mockIndentRequests[idx].approver = { full_name: rejectorName || 'Pharmacist' }
      mockIndentRequests[idx].updated_at = now
      return { data: mockIndentRequests[idx], error: null }
    }
    return { data: null, error: 'Request not found' }
  } catch (error) {
    return { data: null, error: 'Failed to reject request' }
  }
}

export interface ItemStoreStockInfo {
  available_stock: number
  unit: string
  unit_price?: number
  pack_price?: number
  pack_size?: number
  sku_unit?: string
  packaging?: string
  location?: string
  batches: Array<{
    batch_number: string
    expiry_date: string
    quantity: number
    location?: string
  }>
  primary_batch?: string
  primary_expiry?: string
}

/**
 * Extract the numeric pack size (conversion factor from PKU to SKU) from packaging description.
 * Examples:
 * - "Pack of 10 Bottles (500ml)" -> 10
 * - "Pack of 2 x 5 Supps" -> 10
 * - "Pack of 5 x 10 Supps" -> 50
 * - "Pack of 50 Tubes" -> 50
 * - "Pack of 1000 Tablet" -> 1000
 * - "Pack of 30's" -> 30
 * - "Bottle of 60 ml" -> 1
 */
export function getPackSize(packagingDescription?: string | null): number {
  if (!packagingDescription) return 1
  const desc = packagingDescription.trim()

  // Match "Pack of X x Y" (e.g. Pack of 2 x 5 Supps)
  const multMatch = desc.match(/^(?:pack|box|carton)\s+of\s+(\d+)\s*[xX*]\s*(\d+)/i)
  if (multMatch) {
    const n1 = parseInt(multMatch[1], 10) || 1
    const n2 = parseInt(multMatch[2], 10) || 1
    return n1 * n2 > 0 ? n1 * n2 : 1
  }

  // Match "Pack of X" or "Box of X"
  const singlePackMatch = desc.match(/^(?:pack|box|carton|tin|can|jar|bag|bundle|packet)\s+of\s+(\d+)/i)
  if (singlePackMatch) {
    const count = parseInt(singlePackMatch[1], 10)
    return count > 0 ? count : 1
  }

  return 1
}

/**
 * Calculate the single dispensing unit (SKU) price from bulk packaging (PKU) price.
 * Example:
 * - RM 93.72 for "Pack of 10 Bottles (500ml)" -> RM 9.372 per bottle
 */
export function getSkuUnitPrice(packPrice: number, packagingDescription?: string | null): number {
  if (!packPrice || packPrice <= 0) return 0
  const packSize = getPackSize(packagingDescription)
  return packPrice / packSize
}

/**
 * Convert a bulk packaging description (PKU) into a single dispensing/issuing Stock Keeping Unit (SKU).
 * Example:
 * - "Pack of 10 Bottles (500ml)" -> "Bottle of 500ml"
 * - "Pack of 36 Bottles (120ml)" -> "Bottle of 120ml"
 * - "Pack of 50 Tubes (30g)" -> "Tube of 30g"
 * - "Bottle of 500 ml" -> "Bottle of 500ml"
 * - "Pack of 1000 tablet" -> "Tablet"
 * - "Pack of 6 Prefilled Syringes" -> "Prefilled Syringe"
 */
export function getSkuUnit(
  packagingDescription?: string | null,
  fallbackUnit?: string | null,
  dosageForm?: string | null
): string {
  const desc = (packagingDescription || '').trim()

  if (!desc || desc.toUpperCase() === 'UNIT') {
    if (
      fallbackUnit &&
      fallbackUnit.toUpperCase() !== 'UNIT' &&
      fallbackUnit !== 'TAB/VIAL' &&
      fallbackUnit !== 'PCS/PKT'
    ) {
      return fallbackUnit
    }
    if (dosageForm && dosageForm.toLowerCase() !== 'other') {
      return dosageForm.charAt(0).toUpperCase() + dosageForm.slice(1)
    }
    return 'Unit'
  }

  // 1. Check for "Pack of X Bottles/Tubes/Vials/Ampoules/Syringes/etc (Y ml/g)"
  const packMatch = desc.match(
    /^(?:pack|box|carton|tin|can|jar|bag|bundle|packet)\s+of\s+\d+\s+([a-zA-Z]+)(?:\s*([('"]?[^)'"]+[)'"]?))?/i
  )
  if (packMatch) {
    let itemNoun = packMatch[1].trim()
    const detail = (packMatch[2] || '').trim().replace(/[()]/g, '').trim()

    // Singularize noun
    if (itemNoun.toLowerCase().endsWith('ies')) {
      itemNoun = itemNoun.slice(0, -3) + 'y'
    } else if (
      itemNoun.toLowerCase().endsWith('es') &&
      !itemNoun.toLowerCase().endsWith('tubes') &&
      !itemNoun.toLowerCase().endsWith('bottles') &&
      !itemNoun.toLowerCase().endsWith('syringes') &&
      !itemNoun.toLowerCase().endsWith('ampoules') &&
      !itemNoun.toLowerCase().endsWith('capsules') &&
      !itemNoun.toLowerCase().endsWith('vials')
    ) {
      itemNoun = itemNoun.slice(0, -2)
    } else if (
      itemNoun.toLowerCase().endsWith('s') &&
      !itemNoun.toLowerCase().endsWith('ss') &&
      !itemNoun.toLowerCase().endsWith('doses')
    ) {
      itemNoun = itemNoun.slice(0, -1)
    }

    // Capitalize noun
    const capNoun = itemNoun.charAt(0).toUpperCase() + itemNoun.slice(1)

    if (detail && !detail.toLowerCase().includes('dose')) {
      return `${capNoun} of ${detail}`
    }
    return capNoun
  }

  // 2. Check for "Bottle of X ml", "Tube of X g", "Can of X ml", etc.
  const singleMatch = desc.match(/^([a-zA-Z]+)\s+of\s+(.+)$/i)
  if (singleMatch) {
    const itemNoun = singleMatch[1].charAt(0).toUpperCase() + singleMatch[1].slice(1)
    const detail = singleMatch[2].trim()
    return `${itemNoun} of ${detail}`
  }

  // 3. Check for "Pack of X's" or "Box of X's"
  if (/^(?:pack|box|carton)\s+of\s+\d+['']?s?$/i.test(desc)) {
    if (dosageForm && dosageForm.toLowerCase() !== 'other') {
      return dosageForm.charAt(0).toUpperCase() + dosageForm.slice(1)
    }
    if (
      fallbackUnit &&
      fallbackUnit.toUpperCase() !== 'UNIT' &&
      fallbackUnit !== 'TAB/VIAL'
    ) {
      return fallbackUnit
    }
    return 'Unit'
  }

  return desc
}

/**
 * Fetch real-time Store Stock & Batch Availability for Indent Items
 */
export async function getIndentItemsStockAvailability(
  hospitalId: string,
  items: Array<{ id: string; item_id?: string; item_code?: string; item_name?: string; item_type?: string; unit?: string }>
): Promise<ApiResponse<Record<string, ItemStoreStockInfo>>> {
  try {
    const result: Record<string, ItemStoreStockInfo> = {}
    if (!items || items.length === 0) return { data: result, error: null }

    const targetHospitalId = hospitalId || 'hosp-1'
    const [facilityDrugs, facilityNonDrugs] = await Promise.all([
      loadFacilityDrugInventory(targetHospitalId),
      loadFacilityNonDrugInventory(targetHospitalId),
    ])

    // Query active batches from pharmacy_stock_batches
    let dbBatches: any[] = []
    if (isSupabaseConfigured()) {
      try {
        const { data: bData } = await supabase
          .from('pharmacy_stock_batches')
          .select('id, item_id, batch_number, expiry_date, quantity_on_hand, status, location:pharmacy_stock_locations(location_name)')
          .eq('hospital_id', targetHospitalId)
          .in('status', ['available', 'quarantine', 'active'])
          .gt('quantity_on_hand', 0)
          .order('expiry_date', { ascending: true })

        if (bData) dbBatches = bData
      } catch (err) {
        console.warn('Could not fetch pharmacy_stock_batches:', err)
      }
    }

    for (const item of items) {
      const isDrug = item.item_type === 'drug'
      const itemCodeLower = (item.item_code || '').trim().toLowerCase()
      const itemNameLower = (item.item_name || '').trim().toLowerCase()

      // Find matching item in facility drug or non-drug inventory
      let matchedFacilityItem: any = null
      if (isDrug) {
        matchedFacilityItem = facilityDrugs.find(
          (d) =>
            (d.id && d.id === item.item_id) ||
            (d.drug_code && d.drug_code.toLowerCase() === itemCodeLower) ||
            (d.sku && d.sku.toLowerCase() === itemCodeLower) ||
            (d.drug_name && d.drug_name.toLowerCase() === itemNameLower)
        )
      } else {
        matchedFacilityItem = facilityNonDrugs.find(
          (nd) =>
            (nd.id && nd.id === item.item_id) ||
            (nd.item_code && nd.item_code.toLowerCase() === itemCodeLower) ||
            (nd.sku && nd.sku.toLowerCase() === itemCodeLower) ||
            (nd.item_name && nd.item_name.toLowerCase() === itemNameLower)
        )
      }

      // Find matching batches in pharmacy_stock_batches
      const matchedBatches = dbBatches.filter((b) => {
        if (!b.item_id) return false
        if (item.item_id && b.item_id === item.item_id) return true
        if (matchedFacilityItem && (b.item_id === matchedFacilityItem.id || b.item_id === matchedFacilityItem.drug_id || b.item_id === matchedFacilityItem.nondrug_id)) return true
        return false
      })

      const batchesList: Array<{ batch_number: string; expiry_date: string; quantity: number; location?: string }> = []
      let totalStock = 0

      if (matchedBatches.length > 0) {
        matchedBatches.forEach((b) => {
          const qty = Number(b.quantity_on_hand || 0)
          totalStock += qty
          batchesList.push({
            batch_number: b.batch_number || 'N/A',
            expiry_date: b.expiry_date || 'N/A',
            quantity: qty,
            location: b.location?.location_name || '',
          })
        })
      } else if (matchedFacilityItem) {
        const facStock = Number(matchedFacilityItem.facility_stock ?? 0)
        totalStock = facStock
        if (matchedFacilityItem.batch_number || matchedFacilityItem.batch_no || matchedFacilityItem.expiry_date || matchedFacilityItem.exp_date || facStock > 0) {
          batchesList.push({
            batch_number: matchedFacilityItem.batch_number || matchedFacilityItem.batch_no || 'BN-STORE-DEFAULT',
            expiry_date: matchedFacilityItem.expiry_date || matchedFacilityItem.exp_date || '2028-12-31',
            quantity: facStock,
            location: matchedFacilityItem.location || '',
          })
        }
      }

      const primaryBatch = batchesList.length > 0 ? batchesList[0].batch_number : undefined
      const primaryExpiry = batchesList.length > 0 ? batchesList[0].expiry_date : undefined
      
      const pkgDesc = matchedFacilityItem?.packaging_description || matchedFacilityItem?.packaging || ''
      const skuUnit = getSkuUnit(
        pkgDesc,
        (item as any).unit || matchedFacilityItem?.unit_of_measure,
        matchedFacilityItem?.dosage_form
      )

      const rawPackPrice = Number(matchedFacilityItem?.price ?? matchedFacilityItem?.unit_price ?? (item as any).unit_price ?? 0)
      const packSize = getPackSize(pkgDesc)
      const skuUnitPrice = getSkuUnitPrice(rawPackPrice, pkgDesc)

      // Resolve location matching KEW.PS-4 ledger priority
      let resolvedLoc = ''
      if (typeof window !== 'undefined') {
        try {
          const itemOverrides = JSON.parse(localStorage.getItem('kewps4_item_overrides') || '{}')
          const ovMatch = itemOverrides[item.item_id] || (matchedFacilityItem && itemOverrides[matchedFacilityItem.id]) || (matchedFacilityItem && itemOverrides[matchedFacilityItem.drug_id]) || (matchedFacilityItem && itemOverrides[matchedFacilityItem.nondrug_id])
          if (ovMatch?.location && !['decanting', 'default', 'n/a'].includes(ovMatch.location.trim().toLowerCase())) {
            resolvedLoc = ovMatch.location
          }
        } catch {}
      }

      if (!resolvedLoc && matchedFacilityItem?.location && !['decanting', 'default', 'n/a'].includes(matchedFacilityItem.location.trim().toLowerCase())) {
        resolvedLoc = matchedFacilityItem.location
      } else if (!resolvedLoc && matchedFacilityItem?.store_location && !['decanting', 'default', 'n/a'].includes(matchedFacilityItem.store_location.trim().toLowerCase())) {
        resolvedLoc = matchedFacilityItem.store_location
      } else if (!resolvedLoc) {
        const validBatchLoc = batchesList.find(b => b.location && !['decanting', 'default', 'n/a'].includes(b.location.trim().toLowerCase()))?.location
        if (validBatchLoc) resolvedLoc = validBatchLoc
      }

      if (!resolvedLoc) {
        resolvedLoc = isDrug ? 'Stor Logistik (Ubat) > Rack M > Level 3' : 'Stor Logistik (Bukan Ubat) > Rack A > Level 1'
      }

      // Format location display
      const formattedLocation = resolvedLoc
        .replace(/^\[[^\]]+\]\s*/, '')
        .replace(/\((Drug|drug)\)/gi, '(Ubat)')
        .replace(/\((Non-Drug|non-drug|nondrug)\)/gi, '(Bukan Ubat)')

      result[item.id] = {
        available_stock: totalStock,
        unit: skuUnit,
        unit_price: skuUnitPrice,
        pack_price: rawPackPrice,
        pack_size: packSize,
        sku_unit: skuUnit,
        packaging: pkgDesc,
        location: formattedLocation,
        batches: batchesList,
        primary_batch: primaryBatch,
        primary_expiry: primaryExpiry,
      }
    }

    return { data: result, error: null }
  } catch (error) {
    console.error('Error fetching stock availability:', error)
    return { data: {}, error: 'Failed to fetch item stock info' }
  }
}

/**
 * Issue Items for Indent Request (Store Counter)
 * Updates indent status and creates corresponding Pengeluaran transactions in KEW.PS-4 ledger
 */
export async function issueIndentRequest(
  id: string,
  issuerId: string,
  issuedItems: Array<{
    item_id: string
    qty_issued: number
    batch_number?: string
    expiry_date?: string
    actual_item_id?: string
    item_type?: 'drug' | 'non_drug'
    item_code?: string
    item_name?: string
    unit?: string
  }>,
  hospitalId?: string
): Promise<ApiResponse<IndentRequestWithRelations>> {
  try {
    const now = new Date().toISOString()
    const targetHospId = (hospitalId && isValidUUID(hospitalId)) ? hospitalId : '85bb6adc-b868-428b-83f4-e5af2f5cf904'

    if (isSupabaseConfigured() && isValidUUID(id)) {
      const updateData: any = {
        status: 'issued',
        issued_at: now,
        updated_at: now,
      }
      if (issuerId && isValidUUID(issuerId)) {
        updateData.issued_by = issuerId
      }

      try {
        await supabase
          .from('distribution_indent_requests')
          .update(updateData)
          .eq('id', id)
      } catch (uErr) {
        console.warn('Could not update distribution_indent_requests status:', uErr)
      }

      for (const item of issuedItems) {
        const itemId = item.item_id
        if (itemId && isValidUUID(itemId)) {
          try {
            await supabase
              .from('distribution_indent_request_items')
              .update({
                qty_issued: item.qty_issued,
                batch_number: item.batch_number,
                expiry_date: item.expiry_date,
              })
              .or(`id.eq.${itemId},item_id.eq.${itemId}`)
          } catch (iErr) {
            console.warn('Could not update distribution_indent_request_items:', iErr)
          }
        }
      }

      // Fetch the full indent details to get indent_number and requesting department name
      let fullIndent: IndentRequestWithRelations | null = null
      try {
        const fullReqRes = await getIndentRequestById(id)
        if (fullReqRes.data) fullIndent = fullReqRes.data
      } catch {}

      const indentNumber = fullIndent?.indent_number || `IDN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
      const deptName = fullIndent?.requesting_department?.department_name || 'Nephrology'
      const indentHospId = (fullIndent?.hospital_id && isValidUUID(fullIndent.hospital_id)) ? fullIndent.hospital_id : targetHospId

      // Load facility inventory to accurately map drug_id / nondrug_id
      const [facDrugs, facNonDrugs] = await Promise.all([
        loadFacilityDrugInventory(indentHospId),
        loadFacilityNonDrugInventory(indentHospId)
      ])

      // Look up if requesting department has a registered location in pharmacy_stock_locations
      let deptLocationId: string | undefined = undefined
      try {
        const { data: locData } = await supabase
          .from('pharmacy_stock_locations')
          .select('id, location_name')
          .or(`hospital_id.eq.${indentHospId},hospital_id.is.null`)
          .ilike('location_name', `%${deptName}%`)
          .limit(1)
        if (locData && locData.length > 0) {
          deptLocationId = locData[0].id
        }
      } catch (lErr) {
        console.warn('Location lookup warning:', lErr)
      }

      // Automatically post each issued line item to the KEW.PS-4 ledger
      for (const item of issuedItems) {
        const qtyToIssue = Number(item.qty_issued) || 0
        if (qtyToIssue <= 0) continue

        const matchedLine = fullIndent?.items?.find(
          (it) => it.id === item.item_id || it.item_id === item.item_id || it.item_code === item.item_code
        )

        const rawItemId = item.actual_item_id || matchedLine?.item_id || item.item_id
        const itemType = (item.item_type || matchedLine?.item_type || 'drug') as 'drug' | 'non_drug'
        const itemCode = (item.item_code || matchedLine?.item_code || '').trim().toLowerCase()
        const itemName = (item.item_name || matchedLine?.item_name || '').trim().toLowerCase()
        const batchNum = item.batch_number || matchedLine?.batch_number || 'BKH-2026-1114'
        const expiryDate = item.expiry_date || matchedLine?.expiry_date || '2028-08-15'

        // Resolve canonical itemId in drugs / non_drugs / facility_inventory
        let canonicalItemId = (rawItemId && isValidUUID(rawItemId)) ? rawItemId : ''
        
        if (itemType === 'drug') {
          const matchedFac = facDrugs?.find(
            (d) =>
              (d.drug_id && isValidUUID(d.drug_id) && (d.drug_id === rawItemId || d.id === rawItemId)) ||
              (d.drug_code && itemCode && normalizeItemCode(d.drug_code) === normalizeItemCode(itemCode)) ||
              (d.drug_name && itemName && normalizeItemCode(d.drug_name) === normalizeItemCode(itemName))
          )
          if (matchedFac?.drug_id && isValidUUID(matchedFac.drug_id)) {
            canonicalItemId = matchedFac.drug_id
          } else if (matchedFac?.id && isValidUUID(matchedFac.id)) {
            canonicalItemId = matchedFac.id
          }

          if (!canonicalItemId || !isValidUUID(canonicalItemId)) {
            try {
              if (itemCode) {
                const { data: byCode } = await supabase
                  .from('drugs')
                  .select('id, drug_code')
                  .ilike('drug_code', itemCode)
                  .limit(1)
                if (byCode && byCode.length > 0 && byCode[0].id) {
                  canonicalItemId = byCode[0].id
                }
              }
              if (!canonicalItemId && itemName) {
                const cleanName = itemName.split('(')[0].trim()
                const { data: byName } = await supabase
                  .from('drugs')
                  .select('id, drug_name')
                  .ilike('drug_name', `%${cleanName}%`)
                  .limit(1)
                if (byName && byName.length > 0 && byName[0].id) {
                  canonicalItemId = byName[0].id
                }
              }
            } catch (dErr) {
              console.warn('Error resolving drug canonical ID:', dErr)
            }
          }
        } else {
          const matchedFac = facNonDrugs?.find(
            (nd) =>
              (nd.nondrug_id && isValidUUID(nd.nondrug_id) && (nd.nondrug_id === rawItemId || nd.id === rawItemId)) ||
              (nd.item_code && itemCode && normalizeItemCode(nd.item_code) === normalizeItemCode(itemCode)) ||
              (nd.item_name && itemName && normalizeItemCode(nd.item_name) === normalizeItemCode(itemName))
          )
          if (matchedFac?.nondrug_id && isValidUUID(matchedFac.nondrug_id)) {
            canonicalItemId = matchedFac.nondrug_id
          } else if (matchedFac?.id && isValidUUID(matchedFac.id)) {
            canonicalItemId = matchedFac.id
          }

          if (!canonicalItemId || !isValidUUID(canonicalItemId)) {
            try {
              if (itemCode) {
                const { data: byCode } = await supabase
                  .from('non_drugs')
                  .select('id, item_code')
                  .ilike('item_code', itemCode)
                  .limit(1)
                if (byCode && byCode.length > 0 && byCode[0].id) {
                  canonicalItemId = byCode[0].id
                }
              }
              if (!canonicalItemId && itemName) {
                const cleanName = itemName.split('(')[0].trim()
                const { data: byName } = await supabase
                  .from('non_drugs')
                  .select('id, item_name')
                  .ilike('item_name', `%${cleanName}%`)
                  .limit(1)
                if (byName && byName.length > 0 && byName[0].id) {
                  canonicalItemId = byName[0].id
                }
              }
            } catch (nErr) {
              console.warn('Error resolving non-drug canonical ID:', nErr)
            }
          }
        }

        if (!canonicalItemId) {
          canonicalItemId = isValidUUID(rawItemId) ? rawItemId : '9b26298b-fd7b-4006-ac0a-9595aea22d52'
        }

        try {
          const batchId = await resolveOrCreateStockBatch(
            indentHospId,
            canonicalItemId,
            itemType,
            batchNum,
            expiryDate,
            qtyToIssue,
            deptLocationId
          )

          await issueStock(indentHospId, {
            batch_id: batchId,
            quantity: qtyToIssue,
            transaction_number: indentNumber,
            to_location_id: deptLocationId,
            reason: `Agihan ke: ${deptName} - Indent Ref: ${indentNumber}`,
            performed_by: (issuerId && isValidUUID(issuerId)) ? issuerId : '',
            issued_date: now.split('T')[0],
            transaction_date: now,
            item_id: canonicalItemId,
            item_type: itemType
          })
        } catch (issueErr) {
          console.warn(`Could not auto-post KEW.PS-4 issue for item ${canonicalItemId}:`, issueErr)
        }
      }

      return {
        data: (fullIndent || {
          id,
          indent_number: indentNumber,
          status: 'issued',
          items: []
        }) as IndentRequestWithRelations,
        error: null
      }
    }

    // Mock Update & Offline Fallback
    const idx = mockIndentRequests.findIndex((r) => r.id === id)
    if (idx !== -1) {
      mockIndentRequests[idx].status = 'issued'
      mockIndentRequests[idx].issued_by = issuerId
      mockIndentRequests[idx].issued_at = now
      mockIndentRequests[idx].updated_at = now

      const reqObj = mockIndentRequests[idx]
      const deptName = reqObj.requesting_department?.department_name || 'Nephrology'
      const indentNumber = reqObj.indent_number || `IDN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`

      if (reqObj.items) {
        reqObj.items = reqObj.items.map((it) => {
          const matched = issuedItems.find((i) => i.item_id === it.id || i.item_id === it.item_id)
          if (matched) {
            return {
              ...it,
              qty_issued: matched.qty_issued,
              batch_number: matched.batch_number || it.batch_number || 'BN-2026-X',
              expiry_date: matched.expiry_date || it.expiry_date || '2028-06-30',
            }
          }
          return it
        })
      }

      // In mock mode, also trigger resolveOrCreateStockBatch and issueStock
      for (const item of issuedItems) {
        const qtyToIssue = Number(item.qty_issued) || 0
        if (qtyToIssue <= 0) continue

        const matchedLine = reqObj.items?.find(
          (it) => it.id === item.item_id || it.item_id === item.item_id
        )

        const rawItemId = item.actual_item_id || matchedLine?.item_id || item.item_id
        const itemType = (item.item_type || matchedLine?.item_type || 'drug') as 'drug' | 'non_drug'
        const batchNum = item.batch_number || matchedLine?.batch_number || 'BN-2026-X'
        const expiryDate = item.expiry_date || matchedLine?.expiry_date || '2028-06-30'

        try {
          const batchId = await resolveOrCreateStockBatch(
            targetHospId,
            rawItemId,
            itemType,
            batchNum,
            expiryDate,
            qtyToIssue
          )

          await issueStock(targetHospId, {
            batch_id: batchId,
            quantity: qtyToIssue,
            transaction_number: indentNumber,
            reason: `Agihan ke: ${deptName} - Indent Ref: ${indentNumber}`,
            performed_by: issuerId || 'Staf Farmasi',
            issued_date: now.split('T')[0],
            transaction_date: now
          })
        } catch (mErr) {
          console.warn('Mock stock issue warning:', mErr)
        }
      }

      return { data: mockIndentRequests[idx], error: null }
    }
    return { data: null, error: 'Request not found' }
  } catch (error) {
    console.error('Error in issueIndentRequest:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to issue items' }
  }
}



/**
 * Create or Update Indent Entitlement
 */
export async function upsertIndentEntitlement(
  payload: Partial<IndentEntitlement>
): Promise<ApiResponse<IndentEntitlement>> {
  try {
    const now = new Date().toISOString()
    const hospitalId = payload.hospital_id || 'hosp-1'
    const deptObj = mockDepartments.find((d) => d.id === payload.department_id) || {
      department_name: 'Department Unit',
    }

    if (isSupabaseConfigured() && isValidUUID(payload.hospital_id) && isValidUUID(payload.department_id)) {
      const { department, ...cleanPayload } = payload as any
      const payloadToSave: any = {
        ...cleanPayload,
        item_id: isValidUUID(payload.item_id) ? payload.item_id : crypto.randomUUID(),
        created_by: isValidUUID(payload.created_by) ? payload.created_by : null,
        updated_at: now,
      }
      if (!isValidUUID(payloadToSave.id)) {
        delete payloadToSave.id
      }

      const { data, error } = await supabase
        .from('distribution_indent_entitlements')
        .upsert(payloadToSave)
        .select('*')
        .single()

      if (error) throw error

      const local = readLocalEntitlements(hospitalId)
      const existingIdx = local.findIndex((e) => e.id === data.id)
      if (existingIdx >= 0) {
        local[existingIdx] = data as IndentEntitlement
      } else {
        local.unshift(data as IndentEntitlement)
      }
      writeLocalEntitlements(hospitalId, local)

      return { data: data as IndentEntitlement, error: null }
    }

    const local = readLocalEntitlements(hospitalId)
    if (payload.id) {
      const idx = local.findIndex((e) => e.id === payload.id)
      if (idx !== -1) {
        local[idx] = {
          ...local[idx],
          ...payload,
          updated_at: now,
          department: { department_name: deptObj.department_name },
        }
        writeLocalEntitlements(hospitalId, local)
        return { data: local[idx], error: null }
      }
    }

    const newEnt: IndentEntitlement = {
      id: `ent-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      hospital_id: payload.hospital_id || 'hosp-1',
      department_id: payload.department_id || 'dept-nephro',
      item_type: payload.item_type || 'drug',
      item_id: payload.item_id || `item-${Date.now()}`,
      item_code: payload.item_code || 'CODE-NEW',
      item_name: payload.item_name || 'New Entitlement Item',
      unit: payload.unit,
      packaging: payload.packaging,
      max_qty_per_request: payload.max_qty_per_request || 100,
      is_active: payload.is_active !== undefined ? payload.is_active : true,
      created_at: now,
      updated_at: now,
      department: { department_name: deptObj.department_name },
    }

    local.unshift(newEnt)
    writeLocalEntitlements(hospitalId, local)
    return { data: newEnt, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to save entitlement' }
  }
}

/**
 * Delete Indent Entitlement
 */
export async function deleteIndentEntitlement(id: string, hospitalId: string = 'hosp-1'): Promise<ApiResponse<boolean>> {
  try {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      const { error } = await supabase.from('distribution_indent_entitlements').delete().eq('id', id)
      if (error) throw error
    }

    // Always filter out from local cache
    const local = readLocalEntitlements(hospitalId).filter((e) => e.id !== id)
    writeLocalEntitlements(hospitalId, local)

    return { data: true, error: null }
  } catch (error) {
    return { data: false, error: error instanceof Error ? error.message : 'Failed to delete entitlement' }
  }
}

/**
 * Fetch Facility Inventory Catalog (drugs & non-drugs) for selection.
 * STRICTLY reflects the facility's registered inventory from the Facility Drug & Non-Drug Inventory menus.
 */
export async function getFacilityInventoryCatalog(hospitalId?: string): Promise<ApiResponse<Array<{
  item_code: string
  item_name: string
  item_type: 'drug' | 'non_drug'
  unit: string
  packaging?: string
}>>> {
  try {
    const targetHospitalId = hospitalId || 'hosp-1'
    const catalogItems: Array<{
      item_code: string
      item_name: string
      item_type: 'drug' | 'non_drug'
      unit: string
      packaging?: string
    }> = []

    const seenKeys = new Set<string>()

    // Fetch ONLY the facility's registered inventory
    const [facilityDrugs, facilityNonDrugs] = await Promise.all([
      loadFacilityDrugInventory(targetHospitalId),
      loadFacilityNonDrugInventory(targetHospitalId),
    ])

    if (facilityDrugs && facilityDrugs.length > 0) {
      facilityDrugs.forEach((d) => {
        const code = d.drug_code || d.sku || d.id || 'DRUG'
        const name = d.drug_name || (d as any).generic_name || 'Unnamed Drug'
        const key = `drug-${code}-${name}`
        if (!seenKeys.has(key)) {
          seenKeys.add(key)
          const pkgDesc = d.packaging_description || d.packaging || ''
          const skuUnit = getSkuUnit(pkgDesc, d.unit_of_measure || d.pku, d.dosage_form)

          catalogItems.push({
            item_code: code,
            item_name: name,
            item_type: 'drug',
            unit: skuUnit,
            packaging: pkgDesc,
          })
        }
      })
    }

    if (facilityNonDrugs && facilityNonDrugs.length > 0) {
      facilityNonDrugs.forEach((nd) => {
        const code = nd.item_code || nd.sku || nd.id || 'NDRUG'
        const name = nd.item_name || 'Unnamed Item'
        const key = `nondrug-${code}-${name}`
        if (!seenKeys.has(key)) {
          seenKeys.add(key)
          const pkgDesc = nd.packaging_description || nd.packaging || ''
          const skuUnit = getSkuUnit(pkgDesc, nd.unit_of_measure || nd.uom, (nd as any).item_group)

          catalogItems.push({
            item_code: code,
            item_name: name,
            item_type: 'non_drug',
            unit: skuUnit,
            packaging: pkgDesc,
          })
        }
      })
    }

    return { data: catalogItems, error: null }
  } catch (err) {
    return { data: [], error: 'Failed to fetch facility inventory catalog' }
  }
}
