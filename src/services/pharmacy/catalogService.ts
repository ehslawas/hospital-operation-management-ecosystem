/**
 * Pharmacy Catalog Service
 * Handles drug catalog, non-drug catalog, supplier catalog, and contracts
 */

import { supabase, isSupabaseConfigured } from '../supabase'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  Contract,
  ContractWithRelations,
  ContractItem,
  MOFCatalogItem,
  KKMFacility,
} from '@/types/pharmacy'
import { mockContracts, mockSuppliers } from './mockData'

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
    let contracts = [...mockContracts]

    if (filter?.contract_type) {
      contracts = contracts.filter(c => c.contract_type === filter.contract_type)
    }

    if (filter?.supplier_id) {
      contracts = contracts.filter(c => c.supplier_id === filter.supplier_id)
    }

    if (filter?.status) {
      contracts = contracts.filter(c => c.status === filter.status)
    }

    return { data: contracts, error: null }
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
    const contract = mockContracts.find(c => c.id === contractId)
    
    if (!contract) {
      return { data: null, error: 'Contract not found' }
    }

    const supplier = mockSuppliers.find(s => s.id === contract.supplier_id)

    const contractWithRelations: ContractWithRelations = {
      ...contract,
      supplier,
      items: [], // Mock items would be populated here
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
export async function getActiveContracts(): Promise<ApiResponse<Contract[]>> {
  try {
    const contracts = mockContracts.filter(c => c.status === 'active')
    return { data: contracts, error: null }
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
    // Mock MOF catalog data
    let items: MOFCatalogItem[] = [
      {
        id: 'mof-001',
        mof_code: 'MOF-DRUG-001',
        item_name: 'Paracetamol 500mg Tablet',
        item_type: 'drug',
        description: 'Standard paracetamol tablets',
        unit_of_measure: 'tablet',
        standard_price: 0.12,
        contract_reference: 'KKM-2024-PHARMA-001',
        panel_suppliers: ['sup-001', 'sup-002'],
        status: 'active',
        effective_date: '2024-01-01',
        expiry_date: '2024-12-31',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'mof-002',
        mof_code: 'MOF-DRUG-002',
        item_name: 'Amoxicillin 500mg Capsule',
        item_type: 'drug',
        description: 'Antibiotic capsules',
        unit_of_measure: 'capsule',
        standard_price: 0.35,
        contract_reference: 'KKM-2024-PHARMA-001',
        panel_suppliers: ['sup-001', 'sup-003'],
        status: 'active',
        effective_date: '2024-01-01',
        expiry_date: '2024-12-31',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'mof-003',
        mof_code: 'MOF-CONS-001',
        item_name: 'Syringe 5ml with Needle',
        item_type: 'non_drug',
        description: 'Disposable syringe with needle',
        unit_of_measure: 'piece',
        standard_price: 0.25,
        contract_reference: 'MOF-2024-MED-001',
        panel_suppliers: ['sup-002'],
        status: 'active',
        effective_date: '2024-01-01',
        expiry_date: '2025-12-31',
        created_at: '2024-01-01T00:00:00Z',
      },
    ]

    // Apply filters
    if (filter?.search) {
      const search = filter.search.toLowerCase()
      items = items.filter(i =>
        i.mof_code.toLowerCase().includes(search) ||
        i.item_name.toLowerCase().includes(search)
      )
    }

    if (filter?.item_type) {
      items = items.filter(i => i.item_type === filter.item_type)
    }

    if (filter?.status) {
      items = items.filter(i => i.status === filter.status)
    }

    const total = items.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const data = items.slice(start, start + pageSize)

    return {
      data: {
        data,
        total,
        page,
        pageSize,
        totalPages,
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
    // Mock KKM hospital facilities
    let facilities: KKMFacility[] = [
      {
        id: 'fac-001',
        facility_code: 'HKL',
        facility_name: 'Hospital Kuala Lumpur',
        facility_type: 'hospital',
        state: 'WP Kuala Lumpur',
        address: 'Jalan Pahang, 50586 Kuala Lumpur',
        phone: '+60-3-2615-5555',
        email: 'hkl@moh.gov.my',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'fac-002',
        facility_code: 'HTAR',
        facility_name: 'Hospital Tengku Ampuan Rahimah',
        facility_type: 'hospital',
        state: 'Selangor',
        address: 'Jalan Langat, 41200 Klang, Selangor',
        phone: '+60-3-3375-7000',
        email: 'htar@moh.gov.my',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'fac-003',
        facility_code: 'HSA',
        facility_name: 'Hospital Sultan Aminah',
        facility_type: 'hospital',
        state: 'Johor',
        address: 'Jalan Persiaran Abu Bakar Sultan, 80100 Johor Bahru',
        phone: '+60-7-223-1666',
        email: 'hsa@moh.gov.my',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
    ]

    if (state) {
      facilities = facilities.filter(f => f.state === state)
    }

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
    // Mock KKM clinic facilities
    let facilities: KKMFacility[] = [
      {
        id: 'clinic-001',
        facility_code: 'KK-CHERAS',
        facility_name: 'Klinik Kesihatan Cheras',
        facility_type: 'clinic',
        state: 'WP Kuala Lumpur',
        address: 'Jalan Yaacob Latif, 56000 Cheras, Kuala Lumpur',
        phone: '+60-3-9130-3100',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'clinic-002',
        facility_code: 'KK-SHAH-ALAM',
        facility_name: 'Klinik Kesihatan Shah Alam',
        facility_type: 'clinic',
        state: 'Selangor',
        address: 'Persiaran Perbandaran, 40000 Shah Alam, Selangor',
        phone: '+60-3-5510-5050',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
    ]

    if (state) {
      facilities = facilities.filter(f => f.state === state)
    }

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
  search: string,
  itemType?: 'drug' | 'non_drug' | 'all'
): Promise<ApiResponse<{
  drugs: any[]
  non_drugs: any[]
  mof_items: MOFCatalogItem[]
  contract_items: ContractItem[]
}>> {
  try {
    // This would search across all catalog sources
    const searchLower = search.toLowerCase()

    // Mock search results
    return {
      data: {
        drugs: [],
        non_drugs: [],
        mof_items: [],
        contract_items: [],
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

