// @ts-nocheck
import { supabase, isSupabaseConfigured } from '@/services/supabase'
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

// Mock Entitlements
let mockEntitlements: IndentEntitlement[] = [
  {
    id: 'ent-1',
    hospital_id: 'hosp-1',
    department_id: 'dept-nephro',
    item_type: 'drug',
    item_id: 'drug-101',
    item_code: 'DRUG-NEPH-01',
    item_name: 'Erythropoietin 4000 IU Injection',
    max_qty_per_request: 200,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    department: { department_name: 'Nephrology' },
  },
  {
    id: 'ent-2',
    hospital_id: 'hosp-1',
    department_id: 'dept-nephro',
    item_type: 'drug',
    item_id: 'drug-102',
    item_code: 'DRUG-NEPH-02',
    item_name: 'Calcium Acetate 667mg Capsule',
    max_qty_per_request: 500,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    department: { department_name: 'Nephrology' },
  },
  {
    id: 'ent-3',
    hospital_id: 'hosp-1',
    department_id: 'dept-nephro',
    item_type: 'non_drug',
    item_id: 'ndrug-101',
    item_code: 'NDRUG-NEPH-01',
    item_name: 'AV Fistula Needle 16G',
    max_qty_per_request: 300,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    department: { department_name: 'Nephrology' },
  },
  {
    id: 'ent-4',
    hospital_id: 'hosp-1',
    department_id: 'dept-nephro',
    item_type: 'non_drug',
    item_id: 'ndrug-102',
    item_code: 'NDRUG-NEPH-02',
    item_name: 'Hemodialysis Blood Line Set',
    max_qty_per_request: 100,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    department: { department_name: 'Nephrology' },
  },
  {
    id: 'ent-5',
    hospital_id: 'hosp-1',
    department_id: 'dept-cardio',
    item_type: 'drug',
    item_id: 'drug-201',
    item_code: 'DRUG-CARD-01',
    item_name: 'Aspirin 100mg Tablet',
    max_qty_per_request: 1000,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    department: { department_name: 'Cardiology Clinic' },
  },
  {
    id: 'ent-6',
    hospital_id: 'hosp-1',
    department_id: 'dept-emer',
    item_type: 'drug',
    item_id: 'drug-301',
    item_code: 'DRUG-EMER-01',
    item_name: 'Adrenaline 1mg/ml Ampoule',
    max_qty_per_request: 100,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    department: { department_name: 'Emergency & Trauma Department' },
  },
]

// Mock Indent Requests - Empty initial state as requested
let mockIndentRequests: IndentRequestWithRelations[] = []

export const isSoftwareModule = (code?: string, name?: string): boolean => {
  const c = (code || '').toLowerCase().trim()
  const n = (name || '').toLowerCase().trim()

  const MODULE_KEYWORDS = [
    'mycuti',
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

/**
 * Get Indent Entitlements for a Department / Hospital
 */
export async function getIndentEntitlements(
  hospitalId: string,
  departmentId?: string
): Promise<ApiResponse<IndentEntitlement[]>> {
  try {
    if (isSupabaseConfigured()) {
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
        query = query.eq('department_id', departmentId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      if (!error && data && data.length > 0) {
        return { data: data as IndentEntitlement[], error: null }
      }
    }

    // Fallback Mock Entitlements (strictly filtered by department)
    if (!departmentId || departmentId === 'all') {
      return { data: [...mockEntitlements], error: null }
    }

    // Direct ID match in mockEntitlements
    let list = mockEntitlements.filter((e) => e.department_id === departmentId)

    // If departmentId comes from Supabase (UUID), resolve by department name mapping
    if (list.length === 0) {
      let deptName = ''
      if (isSupabaseConfigured()) {
        const { data: deptData } = await supabase
          .from('departments')
          .select('department_name')
          .eq('id', departmentId)
          .maybeSingle()
        if (deptData) {
          deptName = deptData.department_name.toLowerCase()
        }
      }

      if (departmentId === 'dept-nephro' || deptName.includes('nephro') || deptName.includes('nefrologi') || deptName.includes('haemodialysis')) {
        list = mockEntitlements
          .filter((e) => e.department_id === 'dept-nephro')
          .map((e) => ({ ...e, department_id: departmentId }))
      } else if (departmentId === 'dept-cardio' || deptName.includes('cardio')) {
        list = mockEntitlements
          .filter((e) => e.department_id === 'dept-cardio')
          .map((e) => ({ ...e, department_id: departmentId }))
      } else if (departmentId === 'dept-emer' || deptName.includes('emer') || deptName.includes('trauma')) {
        list = mockEntitlements
          .filter((e) => e.department_id === 'dept-emer')
          .map((e) => ({ ...e, department_id: departmentId }))
      }
    }

    return { data: list, error: null }
  } catch (error) {
    return { data: mockEntitlements, error: null }
  }
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
      let query = supabase
        .from('distribution_indent_requests')
        .select(
          `
          *,
          requesting_department:departments(id, department_name),
          items:distribution_indent_request_items(*)
        `,
          { count: 'exact' }
        )
        .eq('hospital_id', hospitalId)

      if (filter?.search) {
        query = query.ilike('indent_number', `%${filter.search.trim()}%`)
      }
      if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status)
      }
      if (filter?.priority && filter.priority !== 'all') {
        query = query.eq('priority', filter.priority)
      }
      if (filter?.department_id && filter.department_id !== 'all') {
        query = query.eq('requesting_department_id', filter.department_id)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (!error && data) {
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
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('distribution_indent_requests')
        .select(
          `
          *,
          requesting_department:departments(id, department_name),
          items:distribution_indent_request_items(*)
        `
        )
        .eq('id', id)
        .single()

      if (!error && data) {
        return { data: data as IndentRequestWithRelations, error: null }
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

    if (isSupabaseConfigured()) {
      const { data: header, error: headerError } = await supabase
        .from('distribution_indent_requests')
        .insert({
          indent_number: indentNumber,
          hospital_id: hospitalId,
          requesting_department_id: payload.requesting_department_id,
          requested_by: userId,
          request_date: now.toISOString(),
          required_date: payload.required_date,
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
          item_id: i.item_id,
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
 * Approve Indent Request
 */
export async function approveIndentRequest(
  id: string,
  approverId: string,
  itemApprovals?: Record<string, number>
): Promise<ApiResponse<IndentRequestWithRelations>> {
  try {
    const now = new Date().toISOString()

    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('distribution_indent_requests')
        .update({
          status: 'approved',
          approved_by: approverId,
          approved_at: now,
          updated_at: now,
        })
        .eq('id', id)

      if (error) throw error

      if (itemApprovals) {
        for (const [itemId, qty] of Object.entries(itemApprovals)) {
          await supabase
            .from('distribution_indent_request_items')
            .update({ qty_approved: qty })
            .eq('id', itemId)
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
  reason: string
): Promise<ApiResponse<IndentRequestWithRelations>> {
  try {
    const now = new Date().toISOString()
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('distribution_indent_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          updated_at: now,
        })
        .eq('id', id)

      if (error) throw error
      return getIndentRequestById(id)
    }

    const idx = mockIndentRequests.findIndex((r) => r.id === id)
    if (idx !== -1) {
      mockIndentRequests[idx].status = 'rejected'
      mockIndentRequests[idx].rejection_reason = reason
      mockIndentRequests[idx].updated_at = now
      return { data: mockIndentRequests[idx], error: null }
    }
    return { data: null, error: 'Request not found' }
  } catch (error) {
    return { data: null, error: 'Failed to reject request' }
  }
}

/**
 * Issue Items for Indent Request (Store Counter)
 */
export async function issueIndentRequest(
  id: string,
  issuerId: string,
  issuedItems: Array<{
    item_id: string
    qty_issued: number
    batch_number?: string
    expiry_date?: string
  }>
): Promise<ApiResponse<IndentRequestWithRelations>> {
  try {
    const now = new Date().toISOString()

    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('distribution_indent_requests')
        .update({
          status: 'issued',
          issued_by: issuerId,
          issued_at: now,
          updated_at: now,
        })
        .eq('id', id)

      if (error) throw error

      for (const item of issuedItems) {
        await supabase
          .from('distribution_indent_request_items')
          .update({
            qty_issued: item.qty_issued,
            batch_number: item.batch_number,
            expiry_date: item.expiry_date,
          })
          .eq('id', item.item_id)
      }

      return getIndentRequestById(id)
    }

    // Mock Update
    const idx = mockIndentRequests.findIndex((r) => r.id === id)
    if (idx !== -1) {
      mockIndentRequests[idx].status = 'issued'
      mockIndentRequests[idx].issued_by = issuerId
      mockIndentRequests[idx].issued_at = now
      mockIndentRequests[idx].updated_at = now

      if (mockIndentRequests[idx].items) {
        mockIndentRequests[idx].items = mockIndentRequests[idx].items.map((it) => {
          const matched = issuedItems.find((i) => i.item_id === it.id)
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
      return { data: mockIndentRequests[idx], error: null }
    }
    return { data: null, error: 'Request not found' }
  } catch (error) {
    return { data: null, error: 'Failed to issue items' }
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
    const deptObj = mockDepartments.find((d) => d.id === payload.department_id) || {
      department_name: 'Department Unit',
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('distribution_indent_entitlements')
        .upsert({
          ...payload,
          updated_at: now,
        })
        .select('*')
        .single()

      if (error) throw error
      return { data: data as IndentEntitlement, error: null }
    }

    if (payload.id) {
      const idx = mockEntitlements.findIndex((e) => e.id === payload.id)
      if (idx !== -1) {
        mockEntitlements[idx] = {
          ...mockEntitlements[idx],
          ...payload,
          updated_at: now,
          department: { department_name: deptObj.department_name },
        }
        return { data: mockEntitlements[idx], error: null }
      }
    }

    const newEnt: IndentEntitlement = {
      id: `ent-${Date.now()}`,
      hospital_id: payload.hospital_id || 'hosp-1',
      department_id: payload.department_id || 'dept-nephro',
      item_type: payload.item_type || 'drug',
      item_id: payload.item_id || `item-${Date.now()}`,
      item_code: payload.item_code || 'CODE-NEW',
      item_name: payload.item_name || 'New Entitlement Item',
      max_qty_per_request: payload.max_qty_per_request || 100,
      is_active: payload.is_active !== undefined ? payload.is_active : true,
      created_at: now,
      updated_at: now,
      department: { department_name: deptObj.department_name },
    }

    mockEntitlements.unshift(newEnt)
    return { data: newEnt, error: null }
  } catch (error) {
    return { data: null, error: 'Failed to save entitlement' }
  }
}

/**
 * Delete Indent Entitlement
 */
export async function deleteIndentEntitlement(id: string): Promise<ApiResponse<boolean>> {
  try {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('distribution_indent_entitlements').delete().eq('id', id)
      if (error) throw error
      return { data: true, error: null }
    }

    mockEntitlements = mockEntitlements.filter((e) => e.id !== id)
    return { data: true, error: null }
  } catch (error) {
    return { data: false, error: 'Failed to delete entitlement' }
  }
}

/**
 * Fetch full Facility Inventory Catalog (drugs & non-drugs) for selection
 */
export async function getFacilityInventoryCatalog(hospitalId?: string): Promise<ApiResponse<Array<{
  item_code: string
  item_name: string
  item_type: 'drug' | 'non_drug'
  unit: string
}>>> {
  try {
    const catalogItems: Array<{
      item_code: string
      item_name: string
      item_type: 'drug' | 'non_drug'
      unit: string
    }> = []

    if (isSupabaseConfigured()) {
      // Fetch drugs from Supabase
      const { data: drugData } = await supabase
        .from('drugs')
        .select('drug_code, drug_name, unit_of_measure, sku')
        .eq('status', 'active')
        .limit(100)

      if (drugData) {
        drugData.forEach((d) => {
          catalogItems.push({
            item_code: d.drug_code || d.sku || 'DRUG-CODE',
            item_name: d.drug_name,
            item_type: 'drug',
            unit: (d.unit_of_measure || 'UNIT').toUpperCase(),
          })
        })
      }

      // Fetch non-drugs from Supabase
      const { data: nonDrugData } = await supabase
        .from('non_drugs')
        .select('item_code, item_name, unit_of_measure, sku')
        .eq('status', 'active')
        .limit(100)

      if (nonDrugData) {
        nonDrugData.forEach((nd) => {
          catalogItems.push({
            item_code: nd.item_code || nd.sku || 'NDRUG-CODE',
            item_name: nd.item_name,
            item_type: 'non_drug',
            unit: (nd.unit_of_measure || 'UNIT').toUpperCase(),
          })
        })
      }
    }

    // Default facility inventory items (from master MOH inventory catalog)
    const defaultMasterCatalog = [
      { item_code: 'PCM500', item_name: 'Paracetamol 500mg Tablet', item_type: 'drug' as const, unit: 'TAB' },
      { item_code: 'AMX500', item_name: 'Amoxicillin 500mg Capsule', item_type: 'drug' as const, unit: 'CAP' },
      { item_code: 'MET500', item_name: 'Metformin 500mg Tablet', item_type: 'drug' as const, unit: 'TAB' },
      { item_code: 'INS-G', item_name: 'Insulin Glargine 100 U/mL Injection', item_type: 'drug' as const, unit: 'PEN' },
      { item_code: 'ATV20', item_name: 'Atorvastatin 20mg Tablet', item_type: 'drug' as const, unit: 'TAB' },
      { item_code: 'DRUG-NEPH-01', item_name: 'Erythropoietin 4000 IU Injection', item_type: 'drug' as const, unit: 'VIAL' },
      { item_code: 'DRUG-NEPH-02', item_name: 'Calcium Acetate 667mg Capsule', item_type: 'drug' as const, unit: 'CAP' },
      { item_code: 'DRUG-CARD-01', item_name: 'Aspirin 100mg Tablet', item_type: 'drug' as const, unit: 'TAB' },
      { item_code: 'DRUG-EMER-01', item_name: 'Adrenaline 1mg/ml Ampoule', item_type: 'drug' as const, unit: 'AMP' },
      { item_code: 'SYR5ML', item_name: 'Syringe 5ml with Needle', item_type: 'non_drug' as const, unit: 'PCS' },
      { item_code: 'GLV-M', item_name: 'Examination Gloves (Medium)', item_type: 'non_drug' as const, unit: 'BOX' },
      { item_code: 'BND-10', item_name: 'Gauze Bandage 10cm', item_type: 'non_drug' as const, unit: 'ROLL' },
      { item_code: 'MASK-N95', item_name: 'N95 Respirator Mask', item_type: 'non_drug' as const, unit: 'PCS' },
      { item_code: 'CATH-16', item_name: 'Urinary Catheter 16Fr', item_type: 'non_drug' as const, unit: 'PCS' },
      { item_code: 'IV-SET', item_name: 'IV Infusion Set', item_type: 'non_drug' as const, unit: 'SET' },
      { item_code: 'NDRUG-NEPH-01', item_name: 'AV Fistula Needle 16G', item_type: 'non_drug' as const, unit: 'PCS' },
      { item_code: 'NDRUG-NEPH-02', item_name: 'Hemodialysis Blood Line Set', item_type: 'non_drug' as const, unit: 'SET' },
    ]

    defaultMasterCatalog.forEach((item) => {
      if (!catalogItems.some((c) => c.item_code === item.item_code)) {
        catalogItems.push(item)
      }
    })

    return { data: catalogItems, error: null }
  } catch (err) {
    return { data: [], error: 'Failed to fetch facility inventory catalog' }
  }
}
