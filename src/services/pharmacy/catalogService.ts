/**
 * Pharmacy Catalog Service
 * Handles drug catalog, non-drug catalog, supplier catalog, and contracts
 */

import { supabase } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  Contract,
  ContractWithRelations,
  ContractItem,
  MOFCatalogItem,
  KKMFacility,
} from '@/types/pharmacy'

// =====================================================
// CONTRACT MANAGEMENT
// =====================================================

/**
 * Get all contracts
 */
export async function getContracts(
  hospitalId?: string,
  filter?: {
    contract_type?: string
    supplier_id?: string
    status?: string
  }
): Promise<ApiResponse<Contract[]>> {
  try {
    let query = supabase.from('contracts').select('*')

    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId)
    }

    if (filter?.contract_type) {
      query = query.eq('contract_type', filter.contract_type)
    }

    if (filter?.supplier_id) {
      query = query.eq('supplier_id', filter.supplier_id)
    }

    if (filter?.status) {
      query = query.eq('status', filter.status)
    }

    const { data, error } = await query
    if (error) throw error

    return { data: (data || []) as Contract[], error: null }
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch contracts',
    }
  }
}

/**
 * Get contract by ID with items
 */
export async function getContractById(
  contractId: string
): Promise<ApiResponse<ContractWithRelations>> {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single()

    if (error) throw error

    // Fetch supplier info if needed
    let supplier = null
    if (data.supplier_id) {
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', data.supplier_id)
        .maybeSingle()
      supplier = supplierData
    }

    const contractWithRelations: ContractWithRelations = {
      ...(data as Contract),
      supplier,
      items: [], // Fetch items if they exist in a separate table
    }

    return { data: contractWithRelations, error: null }
  } catch (error) {
    console.error('Error fetching contract:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch contract',
    }
  }
}

/**
 * Get active contracts for dropdown
 */
export async function getActiveContracts(hospitalId?: string): Promise<ApiResponse<Contract[]>> {
  try {
    let query = supabase
      .from('contracts')
      .select('*')
      .eq('status', 'active')

    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId)
    }

    const { data, error } = await query
    if (error) throw error

    return { data: (data || []) as Contract[], error: null }
  } catch (error) {
    console.error('Error fetching active contracts:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch active contracts',
    }
  }
}

// =====================================================
// MOF CATALOG
// =====================================================

/**
 * Get MOF catalog items
 */
export async function getMOFCatalogItems(
  filter?: {
    search?: string
    item_type?: string
    status?: string
  },
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedResponse<MOFCatalogItem>>> {
  try {
    let query = supabase
      .from('mof_catalog_items')
      .select('*', { count: 'exact' })

    if (filter?.search) {
      const search = filter.search
      query = query.or(`mof_code.ilike.%${search}%,item_name.ilike.%${search}%`)
    }

    if (filter?.item_type) {
      query = query.eq('item_type', filter.item_type)
    }

    if (filter?.status) {
      query = query.eq('status', filter.status)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query
      .order('item_name', { ascending: true })
      .range(from, to)

    if (error) throw error

    return {
      data: {
        data: (data || []) as MOFCatalogItem[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      error: null,
    }
  } catch (error) {
    console.error('Error fetching MOF catalog items:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch MOF catalog items',
    }
  }
}

// =====================================================
// KKM FACILITIES
// =====================================================

/**
 * Get KKM Hospital Facilities
 */
export async function getKKMHospitalFacilities(
  state?: string
): Promise<ApiResponse<KKMFacility[]>> {
  try {
    let query = supabase
      .from('hospital_facilities')
      .select('*')

    if (state) {
      query = query.eq('state', state)
    }

    const { data, error } = await query.order('name', { ascending: true })
    if (error) throw error

    // Map to KKMFacility type if needed
    const facilities: KKMFacility[] = (data || []).map((f: any) => ({
      id: f.id,
      facility_code: f.facility_code || '',
      facility_name: f.name || '',
      facility_type: 'hospital',
      state: f.state || '',
      address: f.address || '',
      phone: f.phone || '',
      email: f.email || '',
      is_active: f.status === 'active',
      created_at: f.created_at,
    }))

    return { data: facilities, error: null }
  } catch (error) {
    console.error('Error fetching KKM hospital facilities:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch KKM hospital facilities',
    }
  }
}

/**
 * Get KKM Clinic Facilities
 */
export async function getKKMClinicFacilities(
  state?: string
): Promise<ApiResponse<KKMFacility[]>> {
  try {
    let query = supabase
      .from('clinic_facilities')
      .select('*')

    if (state) {
      query = query.eq('state', state)
    }

    const { data, error } = await query.order('name', { ascending: true })
    if (error) throw error

    const facilities: KKMFacility[] = (data || []).map((f: any) => ({
      id: f.id,
      facility_code: f.facility_code || '',
      facility_name: f.name || '',
      facility_type: 'clinic',
      state: f.state || '',
      address: f.address || '',
      phone: f.phone || '',
      email: f.email || '',
      is_active: f.status === 'active',
      created_at: f.created_at,
    }))

    return { data: facilities, error: null }
  } catch (error) {
    console.error('Error fetching KKM clinic facilities:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch KKM clinic facilities',
    }
  }
}

/**
 * Search catalog items across all sources
 */
export async function searchCatalogItems(
  hospitalId: string,
  search: string,
  _itemType?: 'drug' | 'non_drug' | 'all'
): Promise<ApiResponse<{
  drugs: any[]
  non_drugs: any[]
  mof_items: MOFCatalogItem[]
  contract_items: ContractItem[]
}>> {
  try {
    if (!search || search.length < 2) {
      return {
        data: { drugs: [], non_drugs: [], mof_items: [], contract_items: [] },
        error: null
      }
    }

    // Parallel searches
    const [drugsRes, nonDrugsRes, mofRes, contractsRes] = await Promise.all([
      supabase.from('drugs').select('*').eq('hospital_id', hospitalId).ilike('drug_name', `%${search}%`).limit(10),
      supabase.from('non_drugs').select('*').eq('hospital_id', hospitalId).ilike('item_name', `%${search}%`).limit(10),
      supabase.from('mof_catalog_items').select('*').ilike('item_name', `%${search}%`).limit(10),
      supabase.from('contracts').select('*').eq('hospital_id', hospitalId).ilike('item_name', `%${search}%`).limit(10),
    ])

    return {
      data: {
        drugs: drugsRes.data || [],
        non_drugs: nonDrugsRes.data || [],
        mof_items: (mofRes.data || []) as MOFCatalogItem[],
        contract_items: (contractsRes.data || []) as unknown as ContractItem[],
      },
      error: null,
    }
  } catch (error) {
    console.error('Error searching catalog items:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to search catalog items',
    }
  }
}


